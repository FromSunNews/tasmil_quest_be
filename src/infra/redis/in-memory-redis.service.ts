import { Injectable } from '@nestjs/common';

interface StoredValue {
  value: string;
  expiresAt?: number;
}

@Injectable()
export class InMemoryRedisService {
  private readonly store = new Map<string, StoredValue>();

  async setValue(key: string, value: string, ttlSeconds?: number) {
    const record: StoredValue = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    };
    this.store.set(key, record);
  }

  async getValue(key: string): Promise<string | null> {
    this.cleanup(key);
    return this.store.get(key)?.value ?? null;
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  async setJson<T>(key: string, payload: T, ttlSeconds?: number) {
    return this.setValue(key, JSON.stringify(payload), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.getValue(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async incr(key: string) {
    const current = parseInt((await this.getValue(key)) ?? '0', 10) + 1;
    await this.setValue(key, current.toString());
    return current;
  }

  getClient() {
    return null;
  }

  private cleanup(key: string) {
    const record = this.store.get(key);
    if (record?.expiresAt && record.expiresAt <= Date.now()) {
      this.store.delete(key);
    }
  }
}

