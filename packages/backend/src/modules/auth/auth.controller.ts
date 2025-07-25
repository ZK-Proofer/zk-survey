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
import { LogInterceptor } from '../../common/interceptor/log.interceptor';
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseInterceptors(LogInterceptor)
  async loginWithGoogle(
    @Body() loginDto: GoogleLoginDto,
  ): Promise<LoginResponseDto> {
    return await this.authService.loginWithGoogle(
      loginDto.code,
      loginDto.redirectUri,
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
