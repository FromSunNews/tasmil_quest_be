import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Query,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService, LoginResponse } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { WalletLoginDto } from './dto/wallet-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsernameLoginDto } from './dto/username-login.dto';
import { WalletNonceQueryDto } from './dto/wallet-nonce-query.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('wallet/nonce')
  async getWalletNonce(@Query() query: WalletNonceQueryDto) {
    return this.authService.generateWalletNonce(query.walletAddress);
  }

  @Public()
  @Post('wallet/login')
  async walletLogin(
    @Body() dto: WalletLoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip?: string,
  ): Promise<LoginResponse> {
    return this.authService.walletLogin(dto, res, ip);
  }

  @Public()
  @Post('login')
  async usernameLogin(
    @Body() dto: UsernameLoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip?: string,
  ): Promise<LoginResponse> {
    return this.authService.usernameLogin(dto, res, ip);
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    return this.authService.refreshTokens(req, res);
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(req, res);
  }
}

