import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GoogleLoginDto,
  LoginResponseDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { RefreshTokenGuard } from './guard/bearer-token.guard';
import { LogInterceptor } from 'src/modules/common/interceptor/log.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Version('1')
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
  @Version('1')
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
