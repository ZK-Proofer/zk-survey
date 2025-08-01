import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Member } from '../member/entity/member.entity';
import { MemberService } from '../member/member.service';
import { JsonWebTokenError } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import {
  ENV_JWT_SECRET_KEY,
  ENV_GOOGLE_CLIENT_ID_KEY,
  ENV_GOOGLE_CLIENT_SECRET_KEY,
} from '../../common/const/env-keys.const';
import { CommitmentDto, LoginResponseDto } from './dto/auth.dto';
import axios from 'axios';
import { MerkleTreeService } from '../merkletree/merkle-tree.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Commitment } from './entity/commitment.entity';
import { QueryRunner, Repository } from 'typeorm';

interface JwtPayload {
  email: string;
  sub: number;
  type: 'access' | 'refresh';
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface GoogleErrorResponse {
  error: string;
  error_description: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly memberService: MemberService,
    private readonly configService: ConfigService,
    private readonly merkleTreeService: MerkleTreeService,
    @InjectRepository(Commitment)
    private readonly commitmnetRepository: Repository<Commitment>,
  ) {}

  async loginWithGoogle(
    code: string,
    redirectUri: string,
    qr: QueryRunner,
  ): Promise<LoginResponseDto> {
    const memberRepository = qr.manager.getRepository(Member);
    const clientId = this.configService.get<string>(ENV_GOOGLE_CLIENT_ID_KEY);
    const clientSecret = this.configService.get<string>(
      ENV_GOOGLE_CLIENT_SECRET_KEY,
    );

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException('Google OAuth configuration missing');
    }

    const params = `client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}`;

    try {
      const response = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const userInfo = await axios.get<GoogleUserInfo>(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`,
          },
        },
      );

      let member = await memberRepository.findOne({
        where: { email: userInfo.data.email },
      });
      if (!member) {
        member = await memberRepository.save({
          email: userInfo.data.email,
          nickname: userInfo.data.name,
        });
      }
      return this.loginUser(member);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as GoogleErrorResponse;
        throw new UnauthorizedException(
          `Google OAuth error: ${errorData.error} - ${errorData.error_description}`,
        );
      }
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }

  loginUser(user: Member): LoginResponseDto {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
      member: {
        email: user.email,
        nickname: user.nickname,
      },
    };
  }

  signToken(
    user: Pick<Member, 'id' | 'email'>,
    isRefreshToken: boolean,
  ): string {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      expiresIn: isRefreshToken ? '7d' : '1d',
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
        email: payload.email,
      },
      isRefreshToken,
    );
  }

  private getCommitmentRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository(Commitment)
      : this.commitmnetRepository;
  }

  async registerSurveyCommitment(
    surveyId: number,
    commitmentDto: CommitmentDto,
    qr?: QueryRunner,
  ): Promise<void> {
    const repository = this.getCommitmentRepository(qr);
    await repository.save({
      commitmentHash: commitmentDto.commitment,
    });

    await this.merkleTreeService.addLeaf(
      surveyId,
      commitmentDto.commitment,
      qr,
    );
  }
}
