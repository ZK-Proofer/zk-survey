import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerkleTreeService } from './merkletree.service';
import { MerkleTree } from './entyty/merkle-tree.entity';
@Module({
  imports: [TypeOrmModule.forFeature([MerkleTree])],
  providers: [MerkleTreeService],
  exports: [MerkleTreeService],
})
export class MerkleTreeModule {}
