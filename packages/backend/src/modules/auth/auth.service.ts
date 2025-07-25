import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Member } from 'src/modules/member/entity/member.entity';
import { MemberService } from 'src/modules/member/member.service';
import { JsonWebTokenError } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { ENV_JWT_SECRET_KEY } from 'src/modules/common/const/env-keys.const';
import { ethers } from 'ethers';
import { LoginResponseDto } from './dto/auth.dto';

interface JwtPayload {
  address: string;
  sub: number;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly memberService: MemberService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithAddress(
    address: string,
    message: string,
    signature: string,
  ): Promise<LoginResponseDto> {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new UnauthorizedException('invalid signature');
    }
    const existingUser = await this.memberService.getMemberByAddress(address);
    if (!existingUser) {
      throw new UnauthorizedException('user not found');
    }
    return this.loginUser(existingUser);
  }

  loginUser(user: Member): LoginResponseDto {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
      member: {
        address: user.address,
        nickname: user.nickname,
      },
    };
  }

  signToken(
    user: Pick<Member, 'id' | 'address'>,
    isRefreshToken: boolean,
  ): string {
    const payload: JwtPayload = {
      address: user.address,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      expiresIn: isRefreshToken ? '7d' : '15m',
    });
  }

  extractTokenFromHeader(header: string, isBearer: boolean) {
    const [type, token] = header.split(' ');
    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (type !== prefix || !token) {
      throw new UnauthorizedException('invalid token');
    }

    return token;
  }

  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      });
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('invalid token');
      }
      throw new UnauthorizedException('error occurred while verifying token');
    }
  }

  rotateToken(token: string, isRefreshToken: boolean) {
    const payload = this.verifyToken(token);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('request with refresh token');
    }

    return this.signToken(
      {
        id: payload.sub,
        address: payload.address,
      },
      isRefreshToken,
    );
  }
}
