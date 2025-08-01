import { IsArray } from 'class-validator';

export class MerkleTreeLeavesDto {
  @IsArray()
  leaves: string[];
}

export class MerkleTreeResponseDto {
  merkleLeaves: string[];
}
