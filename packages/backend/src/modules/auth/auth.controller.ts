import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GoogleLoginDto,
  LoginResponseDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { RefreshTokenGuard } from './guard/bearer-token.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { QueryRunnerDecorator } from '../../common/decorator/query-runner.decorator';
import { QueryRunner } from 'typeorm';
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseInterceptors(TransactionInterceptor)
  async loginWithGoogle(
    @Body() loginDto: GoogleLoginDto,
    @QueryRunnerDecorator() qr: QueryRunner,
  ): Promise<LoginResponseDto> {
    return await this.authService.loginWithGoogle(
      loginDto.code,
      loginDto.redirectUri,
      qr,
    );
  }

  @Post('token/refresh')
  @UseGuards(RefreshTokenGuard)
  postTokenRefresh(
    @Headers('authorization') rawToken: string,
  ): RefreshTokenDto {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const newToken = this.authService.rotateToken(token, true);

    return {
      refreshToken: newToken,
    };
  }
}
