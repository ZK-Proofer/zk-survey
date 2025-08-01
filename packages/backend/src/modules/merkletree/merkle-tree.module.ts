import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerkleTreeService } from './merkle-tree.service';
import { MerkleTreeController } from './merkle-tree.controller';
import { MerkleTree } from './entity/merkle-tree.entity';
@Module({
  imports: [TypeOrmModule.forFeature([MerkleTree])],
  controllers: [MerkleTreeController],
  providers: [MerkleTreeService],
  exports: [MerkleTreeService],
})
export class MerkleTreeModule {}
