import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Member } from '../entity/member.entity';
import { RequestWithMember } from '../../auth/guard/bearer-token.guard';

export const TokenMember = createParamDecorator(
  (_data: keyof Member | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithMember>();

    if (!request.member) {
      throw new InternalServerErrorException(
        'Request에 member 프로퍼티가 존재하지 않습니다.',
      );
    }

    if (_data) {
      return request.member[_data];
    }

    return request.member;
  },
);
