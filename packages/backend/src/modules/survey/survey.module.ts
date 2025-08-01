import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { SurveyInvitationService } from './services/survey-invitation.service';
import { SurveyResponseService } from './services/survey-response.service';
import { SurveyResultService } from './services/survey-result.service';
import { Survey } from './entity/survey.entity';
import { Question } from './entity/question.entity';
import { QuestionOption } from './entity/question-option.entity';
import { SurveyResponse } from './entity/survey-response.entity';
import { ResponseAnswer } from './entity/response-answer.entity';
import { SurveyInvitation } from './entity/survey-invitation.entity';
import { Commitment } from '../auth/entity/commitment.entity';
import { MerkleTreeModule } from '../merkletree/merkle-tree.module';
import { VerifyModule } from '../verify/verify.module';
import { MemberModule } from '../member/member.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Survey,
      Question,
      QuestionOption,
      SurveyInvitation,
      Commitment,
      SurveyResponse,
      ResponseAnswer,
    ]),
    MerkleTreeModule,
    VerifyModule,
    MemberModule,
    AuthModule,
    MailModule,
  ],
  controllers: [SurveyController],
  providers: [
    SurveyService,
    SurveyInvitationService,
    SurveyResponseService,
    SurveyResultService,
  ],
  exports: [SurveyService],
})
export class SurveyModule {}
