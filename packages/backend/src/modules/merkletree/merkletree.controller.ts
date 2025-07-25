import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MerkleTreeService } from './merkletree.service';
import { MerkleTreeLeavesDto } from './dto/merkletree.dto';

@Controller('merkletree')
export class MerkleTreeController {
  constructor(private readonly merkleTreeService: MerkleTreeService) {}

  @Get(':id/leaves')
  async getMerkleTreeLeaves(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MerkleTreeLeavesDto> {
    return await this.merkleTreeService.getLeaves(id);
  }
}
