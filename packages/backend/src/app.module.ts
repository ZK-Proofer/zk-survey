import {
  ClassSerializerInterceptor,
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { SurveyModule } from './modules/survey/survey.module';
import { Member } from './modules/member/entity/member.entity';
import { Survey } from './modules/survey/entity/survey.entity';
import { Question } from './modules/survey/entity/question.entity';
import { QuestionOption } from './modules/survey/entity/question-option.entity';
import { SurveyInvitation } from './modules/survey/entity/survey-invitation.entity';
import { Commitment } from './modules/auth/entity/commitment.entity';
import { SurveyResponse } from './modules/survey/entity/survey-response.entity';
import { ResponseAnswer } from './modules/survey/entity/response-answer.entity';
import { Verification } from './modules/verify/entity/verification.entity';
import {
  ENV_DB_HOST_KEY,
  ENV_DB_PORT_KEY,
  ENV_DB_USERNAME_KEY,
  ENV_DB_PASSWORD_KEY,
  ENV_DB_DATABASE_KEY,
} from './common/const/env-keys.const';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogMiddleware } from './common/middleware/log.middleware';
import { MemberModule } from './modules/member/member.module';
import { VerifyModule } from './modules/verify/verify.module';
import { MerkleTreeModule } from './modules/merkletree/merkletree.module';
import { MerkleTree } from './modules/merkletree/entity/merkle-tree.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env[ENV_DB_HOST_KEY] || 'localhost',
      port: parseInt(process.env[ENV_DB_PORT_KEY] || '3306'),
      username: process.env[ENV_DB_USERNAME_KEY] || 'root',
      password: process.env[ENV_DB_PASSWORD_KEY] || '',
      database: process.env[ENV_DB_DATABASE_KEY] || 'zk_survey',
      entities: [
        Member,
        Survey,
        Question,
        QuestionOption,
        SurveyInvitation,
        Commitment,
        SurveyResponse,
        ResponseAnswer,
        Verification,
        MerkleTree,
      ],
      synchronize: false,
    }),
    AuthModule,
    SurveyModule,
    MemberModule,
    VerifyModule,
    MerkleTreeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
  exports: [TypeOrmModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
