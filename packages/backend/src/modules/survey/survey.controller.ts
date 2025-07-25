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
import { CreateSurveyDto, SurveyResponseDto } from './dto/survey.dto';
import { AccessTokenGuard } from '../auth/guard/bearer-token.guard';
import { TokenMember } from '../member/decorator/member.decorator';
import { SurveyStatus } from './const/survey-status.const';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { QueryRunnerDecorator } from '../../common/decorator/query-runner.decorator';
import { QueryRunner } from 'typeorm';
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
}
