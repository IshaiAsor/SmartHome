import Redis from 'ioredis';
import config from '../config/env.config';

const client = new Redis(config.valkeyUrl);
client.on('error', (err) => console.error('[valkey] error:', err.message));

export const valkeyService = {
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },
  async get<T>(key: string): Promise<T | null> {
    const raw = await client.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  },
  async del(key: string): Promise<void> {
    await client.del(key);
  },
};
