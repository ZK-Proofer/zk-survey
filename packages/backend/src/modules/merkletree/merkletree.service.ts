import { Injectable, OnModuleInit } from '@nestjs/common';
import { IMT, IMTNode } from '@zk-kit/imt';
import { Fr, BarretenbergSync } from '@aztec/bb.js';
import { MERKLE_ARITY } from 'src/modules/merkletree/const/merkle.const';
import { MerkleTree } from './entyty/merkle-tree.entity';
import { QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

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

  async createTree(surveyId: number, depth: number, qr: QueryRunner) {
    const repository = qr.manager.getRepository(MerkleTree);
    const newRow = repository.create({
      survey_id: surveyId,
      depth,
      leaves: JSON.stringify([]),
    });
    return {
      save: () => {
        repository.save(newRow);
      },
    };
  }

  async getTree(surveyId: number) {
    const treeInfo = await this.merkleTreeRepository.findOneBy({
      survey_id: surveyId,
    });
    if (!treeInfo) throw new Error('Merkle tree not found');

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

  async addLeaf(surveyId: number, leaf: IMTNode) {
    const mt = await this.getTree(surveyId);
    mt.insert(leaf);
    const leaves = JSON.stringify(mt.leaves);

    await this.merkleTreeRepository.update(
      { survey_id: surveyId },
      { leaves: leaves },
    );
  }

  async getProofData(surveyId: number, leaf: IMTNode) {
    const mt = await this.getTree(surveyId);
    const index = mt.indexOf(leaf);
    if (index === -1) throw new Error('Leaf not found');
    const proof = mt.createProof(index);
    return { merkleIndex: index, merkleProof: proof };
  }
}
