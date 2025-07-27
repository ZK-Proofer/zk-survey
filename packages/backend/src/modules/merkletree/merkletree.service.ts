import { Injectable, OnModuleInit } from '@nestjs/common';
import { IMT, IMTNode } from '@zk-kit/imt';
import { Fr, BarretenbergSync } from '@aztec/bb.js';
import { MERKLE_ARITY } from './const/merkle.const';
import { QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MerkleTree } from './entity/merkle-tree.entity';
import { MerkleTreeLeavesDto } from './dto/merkletree.dto';
@Injectable()
export class MerkleTreeService implements OnModuleInit {
  private hashFn: (inputs: IMTNode[]) => IMTNode;

  constructor(
    @InjectRepository(MerkleTree)
    private merkleTreeRepository: Repository<MerkleTree>,
  ) {}

  async onModuleInit() {
    const bbsync = await BarretenbergSync.initSingleton();
    this.hashFn = (inputs: IMTNode[]) => {
      return bbsync
        .poseidon2Hash(inputs.map((input) => new Fr(BigInt(input))))
        .toString();
    };
  }

  private getMerkleTreeRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository(MerkleTree)
      : this.merkleTreeRepository;
  }

  async createTree(surveyId: number, depth: number, qr?: QueryRunner) {
    const repository = this.getMerkleTreeRepository(qr);

    await repository.save({
      survey_id: surveyId,
      depth,
      leaves: JSON.stringify([]),
    });
  }

  async getTree(surveyId: number) {
    const treeInfo = await this.merkleTreeRepository.findOneOrFail({
      where: {
        survey_id: surveyId,
      },
    });

    let leaves: string[];
    try {
      leaves = JSON.parse(treeInfo.leaves);
    } catch (error) {
      throw new Error(`Failed to parse leaves from db: ${error}`);
    }

    return new IMT(
      this.hashFn,
      treeInfo.depth,
      BigInt(0),
      MERKLE_ARITY,
      leaves,
    );
  }

  async addLeaf(surveyId: number, leaf: IMTNode, qr?: QueryRunner) {
    const repository = this.getMerkleTreeRepository(qr);

    const treeInfo = await repository.findOneOrFail({
      where: {
        survey_id: surveyId,
      },
    });

    let leaves: string[];
    try {
      leaves = JSON.parse(treeInfo.leaves);
    } catch (error) {
      throw new Error(`Failed to parse leaves from db: ${error}`);
    }
    // @TODO leaf validation
    leaves.push(leaf.toString());
    treeInfo.leaves = JSON.stringify(leaves);

    await repository.save(treeInfo);
  }

  async getLeaves(surveyId: number): Promise<MerkleTreeLeavesDto> {
    const treeInfo = await this.merkleTreeRepository.findOne({
      where: {
        survey_id: surveyId,
      },
      select: ['leaves'],
    });

    if (!treeInfo) return { leaves: [] };

    let leaves: string[] = [];
    try {
      leaves = JSON.parse(treeInfo.leaves);
    } catch (error) {
      throw new Error(`Failed to parse leaves from db: ${error}`);
    }

    return { leaves };
  }
}
