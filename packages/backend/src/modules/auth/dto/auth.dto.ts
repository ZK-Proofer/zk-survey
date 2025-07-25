import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class MetaMaskLoginDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  address: string;

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
    address: string;
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
  address: string;
  role: string;
  type: 'access' | 'refresh';
}
