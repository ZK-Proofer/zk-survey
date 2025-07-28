import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { Survey } from './entity/survey.entity';
import { Question } from './entity/question.entity';
import { QuestionOption } from './entity/question-option.entity';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { SurveyInvitation } from './entity/survey-invitation.entity';
import { Commitment } from '../auth/entity/commitment.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Survey,
      Question,
      QuestionOption,
      SurveyInvitation,
      Commitment,
    ]),
    AuthModule,
    MemberModule,
  ],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService],
})
export class SurveyModule {}
