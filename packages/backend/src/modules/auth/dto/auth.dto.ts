import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsHash,
  IsHexadecimal,
  registerSchema,
} from 'class-validator';
import { EntitySchema } from 'typeorm';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  redirectUri: string;
}

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  nickname?: string;
}

export class LoginResponseDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsObject()
  @IsNotEmpty()
  member: {
    email: string;
    nickname: string;
  };
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenPayload {
  sub: number;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export class CommitmentDto {
  @ApiProperty()
  @IsString()
  @IsHexadecimal()
  @IsNotEmpty()
  commitment: string;
}
