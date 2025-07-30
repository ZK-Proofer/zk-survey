import { Module } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { VerifyController } from './verify.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from './entity/verification.entity';
import { MerkleTreeModule } from '../merkletree/merkletree.module';

@Module({
  imports: [TypeOrmModule.forFeature([Verification]), MerkleTreeModule],
  controllers: [VerifyController],
  providers: [VerifyService],
  exports: [VerifyService],
})
export class VerifyModule {}
