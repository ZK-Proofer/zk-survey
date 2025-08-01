import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Member } from '../member/entity/member.entity';
import { Commitment } from './entity/commitment.entity';
import { MemberModule } from '../member/member.module';
import { MerkleTreeModule } from '../merkletree/merkle-tree.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member]),
    TypeOrmModule.forFeature([Commitment]),
    JwtModule.register({}),
    MemberModule,
    MerkleTreeModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
