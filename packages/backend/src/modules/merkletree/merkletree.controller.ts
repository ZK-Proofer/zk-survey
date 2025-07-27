import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MerkleTreeService } from './merkletree.service';
import { MerkleTreeLeavesDto } from './dto/merkletree.dto';

@Controller('merkletree')
export class MerkleTreeController {
  constructor(private readonly merkleTreeService: MerkleTreeService) {}

  @Get(':surveyId/leaves')
  async getMerkleTreeLeaves(
    @Param('surveyId', ParseIntPipe) surveyId: number,
  ): Promise<MerkleTreeLeavesDto> {
    return await this.merkleTreeService.getLeaves(surveyId);
  }
}
