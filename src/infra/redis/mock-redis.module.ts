import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { InMemoryRedisService } from './in-memory-redis.service';

@Global()
@Module({
  providers: [
    {
      provide: RedisService,
      useClass: InMemoryRedisService,
    },
  ],
  exports: [RedisService],
})
export class MockRedisModule {}
