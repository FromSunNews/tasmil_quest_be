import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { verifyMessage, isAddress } from 'ethers';
import { randomBytes, randomUUID } from 'crypto';
import { Response, Request } from 'express';
import { WalletLoginDto } from './dto/wallet-login.dto';
import { UsersService } from '../users/users.service';
import { WalletNonceQueryDto } from './dto/wallet-nonce-query.dto';
import { RedisService } from '../../infra/redis/redis.service';
import { RateLimiterService } from '../../shared/services/rate-limiter.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsernameLoginDto } from './dto/username-login.dto';
import { UserRole } from '../../common/enums/user-role.enum';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  user: any;
}

@Injectable()
export class AuthService {
  private readonly nonceTtl = 300;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly rateLimiterService: RateLimiterService,
  ) {}

  async generateWalletNonce(walletAddress: string) {
    const normalized = this.normalizeWalletAddress(walletAddress);
    await this.rateLimiterService.consume(`nonce:${normalized}`, 1);

    const nonce = randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();
    
    // Create user-friendly message with brand and timestamp
    const message = this.formatSignMessage(normalized, nonce, timestamp);
    
    // Store both nonce and message in Redis (message is needed for verification)
    await this.redisService.setValue(
      this.getNonceKey(normalized),
      JSON.stringify({ nonce, message, timestamp }),
      this.nonceTtl,
    );

    const result: {
      walletAddress: string;
      nonce: string;
      message: string;
      expiresIn: number;
    } = {
      walletAddress: normalized,
      nonce,
      message, // Include formatted message for frontend
      expiresIn: this.nonceTtl,
    };

    return result;
  }

  /**
   * Format sign message with brand identity and clear structure
   * This improves UX and security by making the message readable and trustworthy
   */
  private formatSignMessage(
    walletAddress: string,
    nonce: string,
    timestamp: string,
  ): string {
    return ` Welcome to Tasmil Finance

Please sign this message to verify ownership of your wallet.

This request will not trigger any blockchain transaction or cost any gas fees.

Wallet Address: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

By signing, you agree to our Terms of Service.`;
  }

  private isDevelopmentMode(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    return nodeEnv !== 'production';
  }

  async walletLogin(dto: WalletLoginDto, res: Response, ip?: string): Promise<LoginResponse> {
    try {
      await this.rateLimiterService.consume(`wallet-login:${ip ?? 'unknown'}`, 2);
      const normalizedWallet = this.normalizeWalletAddress(dto.walletAddress);
      const nonceData = await this.redisService.getValue(
        this.getNonceKey(normalizedWallet),
      );
      if (!nonceData) {
        throw new BusinessException({
          code: 'NONCE_EXPIRED',
          message: 'Nonce expired or not found',
          status: 400,
        });
      }
      
      // Parse stored data (could be old format with just nonce, or new format with {nonce, message, timestamp})
      let nonce: string;
      let message: string | undefined;
      
      try {
        const parsed = JSON.parse(nonceData);
        nonce = parsed.nonce;
        message = parsed.message;
      } catch {
        // Old format: just nonce string
        nonce = nonceData;
      }
      
      this.verifySignature(normalizedWallet, dto.signature, nonce, message);
      await this.redisService.delete(this.getNonceKey(normalizedWallet));

      const user = await this.usersService.ensureWalletUser(
        normalizedWallet,
        dto.referralCode,
      );
      await this.usersService.handleLoginSuccess(user.id);
      const tokens = await this.issueTokens(user);
      
      this.setRefreshTokenCookie(res, tokens.refreshToken);
      
      return {
        accessToken: tokens.accessToken,
        user: await this.usersService.getMe(user.id),
      };

    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      console.error('Error in walletLogin:', error);
      throw new BusinessException({
        code: 'LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Login failed',
        status: 500,
      });
    }
  }

  async usernameLogin(dto: UsernameLoginDto, res: Response, ip?: string): Promise<LoginResponse> {
    await this.rateLimiterService.consume(`username-login:${ip ?? 'unknown'}`);
    const normalizedWallet = this.normalizeWalletAddress(dto.walletAddress);
    const nonce = await this.redisService.getValue(
      this.getNonceKey(normalizedWallet),
    );
    if (!nonce) {
      throw new BusinessException({
        code: 'NONCE_EXPIRED',
        message: 'Nonce expired or not found',
        status: 400,
      });
    }
    // For username login, use old format for backward compatibility
    this.verifySignature(normalizedWallet, dto.signature, nonce);
    await this.redisService.delete(this.getNonceKey(normalizedWallet));

    const user = await this.usersService.getByUsername(dto.username);
    if (!user || user.walletAddress.toLowerCase() !== normalizedWallet) {
      throw new BusinessException({
        code: 'INVALID_LOGIN',
        message: 'Username or wallet mismatch',
        status: 401,
      });
    }
    await this.usersService.handleLoginSuccess(user.id);
    const tokens = await this.issueTokens(user);
    
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    
    return {
      accessToken: tokens.accessToken,
      user: await this.usersService.getMe(user.id),
    };
  }

  async refreshTokens(req: Request, res: Response): Promise<LoginResponse> {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }
      
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        },
      );
      if (!payload.tokenId) {
        throw new Error('Missing token id');
      }
      const stored = await this.redisService.getValue(
        this.getRefreshKey(payload.tokenId),
      );
      if (!stored) {
        throw new Error('Refresh token revoked');
      }
      await this.redisService.delete(this.getRefreshKey(payload.tokenId));
      const user = await this.usersService.getById(payload.sub);
      if (!user) {
        throw new Error('User not found');
      }
      const tokens = await this.issueTokens(user);
      
      this.setRefreshTokenCookie(res, tokens.refreshToken);
      
      return {
        accessToken: tokens.accessToken,
        user: await this.usersService.getMe(user.id),
      };
    } catch (error) {
      throw new BusinessException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
        status: 401,
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(
          refreshToken,
          {
            secret: this.configService.get<string>('auth.jwtRefreshSecret'),
          },
        );
        if (payload.tokenId) {
          await this.redisService.delete(this.getRefreshKey(payload.tokenId));
        }
      }
    } catch {

    }
    
    this.clearRefreshTokenCookie(res);
    
    return { message: 'Logged out' };
  }

  private verifySignature(
    walletAddress: string,
    signature: string,
    nonce: string,
    storedMessage?: string,
  ) {
    try {
      // Use stored message if available (new format), otherwise fallback to old format
      let message: string;
      if (storedMessage) {
        message = storedMessage;
      } else {
        // Fallback to old format for backward compatibility
        message = `Tasmil Login Nonce: ${nonce}`;
      }
      
      const recovered = verifyMessage(message, signature).toLowerCase();
      if (recovered !== walletAddress.toLowerCase()) {
        throw new BusinessException({
          code: 'INVALID_SIGNATURE',
          message: 'Signature does not match wallet address',
          status: 401,
        });
      }
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      throw new BusinessException({
        code: 'INVALID_SIGNATURE',
        message: 'Invalid signature format or verification failed',
        status: 401,
      });
    }
  }

  private async issueTokens(user: {
    id: string;
    walletAddress: string;
    role: UserRole;
    username: string;
  }): Promise<TokenResponse> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      username: user.username,
    };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: this.configService.get<number>('auth.jwtAccessTtl', 900),
    });

    const tokenId = randomUUID();
    const refreshPayload: JwtPayload = {
      ...accessPayload,
      tokenId,
    };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get<string>('auth.jwtRefreshSecret'),
      expiresIn: this.configService.get<number>('auth.jwtRefreshTtl', 604800),
    });
    await this.redisService.setValue(
      this.getRefreshKey(tokenId),
      user.id,
      this.configService.get<number>('auth.jwtRefreshTtl', 604800),
    );

    return { accessToken, refreshToken };
  }

  private getNonceKey(walletAddress: string) {
    return `wallet_nonce:${walletAddress.toLowerCase()}`;
  }

  private getRefreshKey(tokenId: string) {
    return `refresh_token:${tokenId}`;
  }

  private normalizeWalletAddress(address?: string) {
    if (!address || !isAddress(address)) {
      throw new BusinessException({
        code: 'INVALID_WALLET_ADDRESS',
        message: 'Wallet address is invalid',
        status: 400,
      });
    }
    return address.toLowerCase();
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const refreshTtl = this.configService.get<number>('auth.jwtRefreshTtl', 604800);
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      maxAge: refreshTtl * 1000,
      path: '/',
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);
  }

  private clearRefreshTokenCookie(res: Response) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    // IMPORTANT: Options must match exactly when setting the cookie
    // If path, domain, secure, or sameSite don't match, cookie won't be cleared
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    });
  }
}

