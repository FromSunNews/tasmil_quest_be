import { Injectable } from '@nestjs/common';
import { RedisService as NestRedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(private readonly nestRedis: NestRedisService) {}

  private get client(): Redis {
    return this.nestRedis.getOrThrow();
  }

  async setValue(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async getValue(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async delete(key: string) {
    await this.client.del(key);
  }

  async setJson<T>(key: string, payload: T, ttlSeconds?: number) {
    return this.setValue(key, JSON.stringify(payload), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async incr(key: string) {
    return this.client.incr(key);
  }

  getClient() {
    return this.nestRedis.getOrNil();
  }
}

