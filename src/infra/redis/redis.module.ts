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
        const [configService] = args as [ConfigService];
        const config: any = {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB') || 0,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
        };

        if (configService.get<string>('REDIS_TLS') === 'true') {
          config.tls = {};
        }

        return { config };
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
