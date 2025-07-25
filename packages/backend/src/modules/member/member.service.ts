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

  async getMemberByAddress(address: string): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { address } });
  }

  async createMember(member: Member): Promise<Member> {
    return this.memberRepository.save(member);
  }
}
