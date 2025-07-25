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
} from '@nestjs/common';
import { SurveyService } from './survey.service';
import { CreateSurveyDto, SurveyResponseDto } from './dto/survey.dto';
import { AccessTokenGuard } from '../auth/guard/bearer-token.guard';
import { TokenMember } from '../member/decorator/member.decorator';
import { SurveyStatus } from './const/survey-status.const';

@Controller({ path: 'survey', version: '1' })
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async createSurvey(
    @Body() createSurveyDto: CreateSurveyDto,
    @TokenMember('id') memberId: number,
  ): Promise<SurveyResponseDto> {
    return await this.surveyService.createSurvey(createSurveyDto, memberId);
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
  async updateSurveyStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: SurveyStatus,
    @TokenMember('id') memberId: number,
  ): Promise<void> {
    return await this.surveyService.updateSurveyStatus(id, status, memberId);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  async deleteSurvey(
    @Param('id', ParseIntPipe) id: number,
    @TokenMember('id') memberId: number,
  ): Promise<void> {
    return await this.surveyService.deleteSurvey(id, memberId);
  }
}
