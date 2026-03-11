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
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
          db: configService.get<number>('redis.db') || 0,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
        };

        if (configService.get<string>('redis.tls')) {
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
