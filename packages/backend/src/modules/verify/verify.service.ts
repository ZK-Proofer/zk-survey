import { Injectable } from '@nestjs/common';
import { UltraHonkBackend } from '@aztec/bb.js';
import circuit from './circuit/circuit.json';
import { InjectRepository } from '@nestjs/typeorm';
import { Verification } from './entity/verification.entity';
import { QueryRunner, Repository } from 'typeorm';

@Injectable()
export class VerifyService {
  private readonly honk: UltraHonkBackend;
  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
  ) {
    this.honk = new UltraHonkBackend(circuit.bytecode);
  }

  async verify(
    proof: string,
    publicInputs: string[],
    qr: QueryRunner,
  ): Promise<{ result: boolean; save: () => void }> {
    if (!this.validateHexString(proof, false))
      throw new Error('Wrong proof format');
    publicInputs.forEach((input, index) => {
      if (!this.validateHexString(input, true))
        throw new Error(`Wrong public input index: ${index}`);
    });

    const bufferProof = Buffer.from(proof.replace(/^0x/i, ''), 'hex');
    const verified = await this.honk.verifyProof({
      proof: bufferProof,
      publicInputs,
    });

    if (!verified) return { result: verified, save: () => {} };

    const repository = qr.manager.getRepository(Verification);
    const newRow = repository.create({
      nullifier_hash: publicInputs[1],
    });

    return {
      result: verified,
      save: () => {
        repository.save(newRow);
      },
    };
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
}
