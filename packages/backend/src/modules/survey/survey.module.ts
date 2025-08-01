import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { Survey } from './entity/survey.entity';
import { Question } from './entity/question.entity';
import { QuestionOption } from './entity/question-option.entity';
import { SurveyResponse } from './entity/survey-response.entity';
import { ResponseAnswer } from './entity/response-answer.entity';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { SurveyInvitation } from './entity/survey-invitation.entity';
import { Commitment } from '../auth/entity/commitment.entity';
import { MerkleTreeModule } from '../merkletree/merkle-tree.module';
import { VerifyModule } from '../verify/verify.module';
import { Verification } from '../verify/entity/verification.entity';

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
      Verification,
    ]),
    AuthModule,
    MemberModule,
    MerkleTreeModule,
    VerifyModule,
  ],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService],
})
export class SurveyModule {}
