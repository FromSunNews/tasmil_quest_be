import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { RedisService } from '../../infra/redis/redis.service';

@Injectable()
export class RateLimiterService {
  private readonly limiter?: RateLimiterRedis;

  constructor(redisService: RedisService) {
    const client = redisService.getClient();
    if (client) {
      this.limiter = new RateLimiterRedis({
        storeClient: client,
        points: 20,
        duration: 60,
        keyPrefix: 'rate',
      });
    }
  }

  async consume(key: string, points = 1) {
    if (!this.limiter) {
      return;
    }
    try {
      await this.limiter.consume(key, points);
    } catch {
      throw new HttpException(
        {
          success: false,
          data: null,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please slow down',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

