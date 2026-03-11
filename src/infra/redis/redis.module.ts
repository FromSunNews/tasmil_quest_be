import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisModule as NestRedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    NestRedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (...args: unknown[]): RedisModuleOptions => {
        const configService = args[0] as ConfigService;
        const redisConfig = configService.get<any>('redis');
        const config: any = {
          host: redisConfig?.host || process.env.REDIS_HOST || 'localhost',
          port: redisConfig?.port || parseInt(process.env.REDIS_PORT || '6379', 10),
          password: redisConfig?.password || process.env.REDIS_PASSWORD || undefined,
          db: redisConfig?.db || 0,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
        };

        if (redisConfig?.tls || process.env.REDIS_TLS === 'true') {
          config.tls = {};
        }

        console.log('[RedisModule] Connecting to:', { host: config.host, port: config.port, tls: !!config.tls });

        return { config };
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
