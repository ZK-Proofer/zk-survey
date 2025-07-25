import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerkleTreeService } from './merkletree.service';
import { MerkleTree } from './entity/merkle-tree.entity';
import { MerkleTreeController } from './merkletree.controller';
@Module({
  imports: [TypeOrmModule.forFeature([MerkleTree])],
  controllers: [MerkleTreeController],
  providers: [MerkleTreeService],
  exports: [MerkleTreeService],
})
export class MerkleTreeModule {}
