import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MemberModule } from '../member/member.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [MailService],
  controllers: [MailController],
  imports: [AuthModule, MemberModule],
  exports: [MailService],
})
export class MailModule {}
