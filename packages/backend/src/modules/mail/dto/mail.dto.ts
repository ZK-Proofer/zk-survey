import { IsString, IsEmail, IsOptional } from 'class-validator';

export class SendMailDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  @IsOptional()
  html?: string;

  @IsString()
  @IsOptional()
  text?: string;
}

export class SendSurveyInvitationDto {
  @IsEmail()
  to: string;

  @IsString()
  surveyTitle: string;

  @IsString()
  surveyUuid: string;

  @IsString()
  invitationLink: string;

  @IsString()
  @IsOptional()
  surveyDescription?: string;
}

export class SendPasswordReminderDto {
  @IsEmail()
  to: string;

  @IsString()
  surveyTitle: string;

  @IsString()
  password: string;

  @IsString()
  invitationLink: string;
}
