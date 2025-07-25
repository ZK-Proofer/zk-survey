import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Member } from '../member/entity/member.entity';
import { MemberModule } from '../member/member.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Member]),
    JwtModule.register({}),
    MemberModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
