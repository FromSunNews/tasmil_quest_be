import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Wallet } from 'ethers';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../infra/redis/redis.service';
import { RateLimiterService } from '../../shared/services/rate-limiter.service';

describe('AuthService', () => {
  const nonce = 'test-nonce';
  const wallet = Wallet.createRandom();

  const usersService = {
    ensureWalletUser: jest.fn().mockResolvedValue({
      id: 'user-1',
      walletAddress: wallet.address.toLowerCase(),
      role: 'user',
      username: 'user_123',
    }),
    handleLoginSuccess: jest.fn(),
    getMe: jest.fn().mockResolvedValue({ id: 'user-1' }),
  } as unknown as UsersService;

  const jwtService = {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token'),
  } as unknown as JwtService;

  const configService = {
    get: (key: string) => {
      const map: Record<string, string | number> = {
        'auth.jwtAccessSecret': 'access',
        'auth.jwtRefreshSecret': 'refresh',
        'auth.jwtAccessTtl': 900,
        'auth.jwtRefreshTtl': 604800,
      };
      return map[key];
    },
  } as unknown as ConfigService;

  const redisState = new Map<string, string>();
  const redisService = {
    setValue: jest.fn(async (key: string, value: string) => {
      redisState.set(key, value);
    }),
    getValue: jest.fn(async () => nonce),
    delete: jest.fn(async (key: string) => {
      redisState.delete(key);
    }),
  } as unknown as RedisService;

  const rateLimiterService = {
    consume: jest.fn().mockResolvedValue(undefined),
  } as unknown as RateLimiterService;

  const authService = new AuthService(
    usersService,
    jwtService,
    configService,
    redisService,
    rateLimiterService,
  );

  it('performs wallet login and updates streak', async () => {
    const signature = await wallet.signMessage(`Tasmil Login Nonce: ${nonce}`);
    const response = await authService.walletLogin({
      walletAddress: wallet.address,
      signature,
    });

    expect(response.accessToken).toBe('access-token');
    expect(response.refreshToken).toBe('refresh-token');
    expect(usersService.ensureWalletUser).toHaveBeenCalled();
    expect(usersService.handleLoginSuccess).toHaveBeenCalledWith('user-1');
  });
});

