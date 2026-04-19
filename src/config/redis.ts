// src/config/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => console.error('❌ Redis error:', err));
    redis.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedis();
    await client.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    // Non-fatal: app can work without Redis for basic flows, but jobs won't work
  }
}

export async function setWithTTL(key: string, value: string, ttlSeconds: number): Promise<void> {
  await getRedis().setex(key, ttlSeconds, value);
}

export async function getValue(key: string): Promise<string | null> {
  return getRedis().get(key);
}

export async function deleteKey(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function incrementWithTTL(key: string, ttlSeconds: number): Promise<number> {
  const client = getRedis();
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, ttlSeconds);
  }
  return count;
}

export default getRedis;
