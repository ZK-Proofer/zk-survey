import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { SurveyService } from './survey.service';
import {
  CreateSurveyDto,
  SubmitSurveyDto,
  SurveyResponseDto,
} from './dto/survey.dto';
import {
  CreateInvitationDto,
  InvitationResponseDto,
  SaveCommitmentDto,
  VerificationResponseDto,
  VerifyCommitmentDto,
  VerifyCommitmentResponseDto,
} from './dto/invitation.dto';
import { AccessTokenGuard } from '../auth/guard/bearer-token.guard';
import { TokenMember } from '../member/decorator/member.decorator';
import { SurveyStatus } from './const/survey-status.const';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { QueryRunnerDecorator } from '../../common/decorator/query-runner.decorator';
import { QueryRunner } from 'typeorm';
import { MerkleTreeResponseDto } from '../merkletree/dto/merkle-tree.dto';
@Controller({ path: 'survey', version: '1' })
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(TransactionInterceptor)
  async createSurvey(
    @Body() createSurveyDto: CreateSurveyDto,
    @TokenMember('id') memberId: number,
    @QueryRunnerDecorator() qr: QueryRunner,
  ): Promise<SurveyResponseDto> {
    return await this.surveyService.createSurvey(createSurveyDto, memberId, qr);
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  async getMySurveys(
    @TokenMember('id') memberId: number,
  ): Promise<SurveyResponseDto[]> {
    return await this.surveyService.getSurveysByAuthor(memberId);
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  async getSurveyById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SurveyResponseDto> {
    return await this.surveyService.getSurveyById(id);
  }

  @Get(':id/preview')
  async getSurveyPreview(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SurveyResponseDto> {
    return await this.surveyService.getSurveyPreview(id);
  }

  @Get(':id/results')
  @UseGuards(AccessTokenGuard)
  async getSurveyResults(
    @Param('id', ParseIntPipe) id: number,
    @TokenMember('id') memberId: number,
  ): Promise<any> {
    return await this.surveyService.getSurveyResults(id, memberId);
  }

  @Put(':id/status')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(TransactionInterceptor)
  async updateSurveyStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: SurveyStatus,
    @TokenMember('id') memberId: number,
    @QueryRunnerDecorator() qr: QueryRunner,
  ): Promise<void> {
    return await this.surveyService.updateSurveyStatus(
      id,
      status,
      memberId,
      qr,
    );
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(TransactionInterceptor)
  async updateSurvey(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSurveyDto: CreateSurveyDto,
    @TokenMember('id') memberId: number,
    @QueryRunnerDecorator() qr: QueryRunner,
  ): Promise<SurveyResponseDto> {
    return await this.surveyService.updateSurvey(
      id,
      updateSurveyDto,
      memberId,
      qr,
    );
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(TransactionInterceptor)
  async deleteSurvey(
    @Param('id', ParseIntPipe) id: number,
    @TokenMember('id') memberId: number,
    @QueryRunnerDecorator() qr: QueryRunner,
  ): Promise<void> {
    return await this.surveyService.deleteSurvey(id, memberId, qr);
  }

  @Post(':id/invitation')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(TransactionInterceptor)
  async createInvitation(
    @Param('id', ParseIntPipe) id: number,
    @Body() createInvitationDto: CreateInvitationDto,
    @TokenMember('id') memberId: number,
    @QueryRunnerDecorator() qr: QueryRunner,
  ): Promise<InvitationResponseDto> {
    return await this.surveyService.createInvitation(
      id,
      createInvitationDto,
      memberId,
      qr,
    );
  }

  @Get('invitation/:uuid')
  async getSurveyByUuid(
    @Param('uuid') uuid: string,
  ): Promise<SurveyResponseDto> {
    return await this.surveyService.getSurveyByUuid(uuid);
  }

  @Post('invitation/:uuid/commitment')
  @UseInterceptors(TransactionInterceptor)
  async saveCommitment(
    @Param('uuid') uuid: string,
    @Body() saveCommitmentDto: SaveCommitmentDto,
    @QueryRunnerDecorator() qr: QueryRunner,
  ): Promise<VerificationResponseDto> {
    return await this.surveyService.saveCommitment(uuid, saveCommitmentDto, qr);
  }

  @Post('invitation/:uuid/commitment/verify')
  async verifyCommitment(
    @Param('uuid') uuid: string,
    @Body() verifyCommitmentDto: SaveCommitmentDto,
  ): Promise<VerifyCommitmentResponseDto> {
    return await this.surveyService.verifyCommitment(uuid, verifyCommitmentDto);
  }

  @Post(':uuid/submit')
  @UseInterceptors(TransactionInterceptor)
  async submitSurvey(
    @Param('uuid') uuid: string,
    @Body() submitSurveyDto: SubmitSurveyDto,
    @QueryRunnerDecorator() qr: QueryRunner,
  ): Promise<void> {
    return await this.surveyService.submitSurvey(uuid, submitSurveyDto, qr);
  }
}
