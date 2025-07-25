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
  MetaMaskLoginDto,
  LoginResponseDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { RefreshTokenGuard } from './guard/bearer-token.guard';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('metamask/login')
  @UseInterceptors(LogInterceptor)
  async loginWithMetaMask(
    @Body() loginDto: MetaMaskLoginDto,
  ): Promise<LoginResponseDto> {
    return await this.authService.loginWithAddress(
      loginDto.address,
      loginDto.message,
      loginDto.signature,
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
