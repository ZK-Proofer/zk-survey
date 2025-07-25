import { CreateMemberDto } from './../auth/dto/auth.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entity/member.entity';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async getMemberById(id: number): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { id } });
  }

  async getMemberByEmail(email: string): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { email } });
  }

  async createMember(createMemberDto: CreateMemberDto): Promise<Member> {
    const member = this.memberRepository.create({
      email: createMemberDto.email,
      nickname: createMemberDto.nickname,
    });
    return this.memberRepository.save(member);
  }
}
