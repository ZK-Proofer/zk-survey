import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import {
  SendMailDto,
  SendSurveyInvitationDto,
  SendPasswordReminderDto,
} from './dto/mail.dto';
import { AccessTokenGuard } from '../auth/guard/bearer-token.guard';

@Controller({ path: 'mail', version: '1' })
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('survey-invitation')
  @UseGuards(AccessTokenGuard)
  async sendSurveyInvitation(
    @Body() sendSurveyInvitationDto: SendSurveyInvitationDto,
  ): Promise<void> {
    return await this.mailService.sendSurveyInvitation(
      sendSurveyInvitationDto.to,
      sendSurveyInvitationDto.surveyUuid,
      sendSurveyInvitationDto.surveyTitle,
      sendSurveyInvitationDto.invitationLink,
      sendSurveyInvitationDto.surveyDescription,
    );
  }
}
