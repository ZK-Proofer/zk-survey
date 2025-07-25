import { Module } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { VerifyController } from './verify.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from './entity/verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Verification])],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
