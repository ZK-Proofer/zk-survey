import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { Member } from 'src/modules/member/entity/member.entity';
import { MemberService } from 'src/modules/member/member.service';

export interface RequestWithMember extends Request {
  member: Member;
  token: string;
  tokenType: 'access' | 'refresh';
}

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly memberService: MemberService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithMember>();
    const rawToken = request.headers.authorization;

    if (!rawToken) {
      throw new UnauthorizedException('token not found');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, true);
    const payload = this.authService.verifyToken(token);
    const member = await this.memberService.getMemberById(payload.sub);

    if (!member) {
      throw new UnauthorizedException('member not found');
    }

    request.member = member;
    request.token = token;
    request.tokenType = payload.type;

    return true;
  }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
  constructor(authService: AuthService, memberService: MemberService) {
    super(authService, memberService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest<RequestWithMember>();

    if (req.tokenType !== 'access') {
      throw new UnauthorizedException('request with access token');
    }

    return true;
  }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
  constructor(authService: AuthService, memberService: MemberService) {
    super(authService, memberService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest<RequestWithMember>();

    if (req.tokenType !== 'refresh') {
      throw new UnauthorizedException('request with refresh token');
    }

    return true;
  }
}
