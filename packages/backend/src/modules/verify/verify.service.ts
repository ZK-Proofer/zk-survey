import { Injectable } from '@nestjs/common';
import { UltraHonkBackend } from '@aztec/bb.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Verification } from './entity/verification.entity';
import { QueryRunner, Repository } from 'typeorm';
import { MerkleTreeService } from '../merkletree/merkletree.service';
import circuit from './circuit/circuit.json';

@Injectable()
export class VerifyService {
  private readonly honk: UltraHonkBackend;
  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    private readonly merkleTreeService: MerkleTreeService,
  ) {
    this.honk = new UltraHonkBackend(circuit.bytecode);
  }

  private getVerificationRepository(qr: QueryRunner) {
    if (qr) return qr.manager.getRepository(Verification);
    return this.verificationRepository;
  }

  async verify(
    proof: string,
    surveyId: number,
    nulifier: string,
    merkleProof: string[],
  ) {
    if (!this.validateHexString(proof, false))
      throw new Error('Wrong proof format');
    if (!this.validateHexString(nulifier, true))
      throw new Error('Wrong nulfier format');
    merkleProof = merkleProof.map((node) => {
      if (node !== '0' && !this.validateHexString(node, true))
        throw new Error('Wrong merkle proof node format');
      return this.attachPrefix(node);
    });

    const merkleRoot = (await this.merkleTreeService.getTree(surveyId)).root;
    const bufferProof = Buffer.from(proof.replace(/^0x/i, ''), 'hex');

    const throwVerificationError = (error?: Error) => {
      throw new Error(`Verification failed${error && `: ${error}`}`);
    };
    try {
      const verified = await this.honk.verifyProof({
        proof: bufferProof,
        publicInputs: [
          this.attachPrefix(surveyId.toString(16)),
          this.attachPrefix(nulifier),
          this.attachPrefix(merkleRoot.toString()),
          ...merkleProof,
        ],
      });

      if (!verified) throwVerificationError();
    } catch (error) {
      throwVerificationError(error);
    }
  }

  private validateHexString(str: string, require32bytes: boolean = false) {
    const isHex = /^(0x)?[0-9a-fA-F]+$/.test(str);
    if (!isHex) {
      return false;
    }

    if (require32bytes) {
      const hexWithoutPrefix = str.startsWith('0x') ? str.slice(2) : str;
      if (hexWithoutPrefix.length !== 64) return false;
    }

    return true;
  }

  private attachPrefix(str: string) {
    return str.startsWith('0x') ? str : '0x' + str;
  }
}
