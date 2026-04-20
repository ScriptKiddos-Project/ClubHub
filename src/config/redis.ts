// server/src/config/redis.ts
import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable is not set");
    }

    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 5) return null; // stop retrying after 5 attempts, surface the error
        return Math.min(times * 200, 2000);
      },
    });

    client.on("connect",     () => console.log("✅ Redis connected"));
    client.on("ready",       () => console.log("✅ Redis ready"));
    client.on("reconnecting",() => console.log("🔄 Redis reconnecting..."));
    client.on("close",       () => console.warn("⚠️  Redis connection closed"));
    client.on("error",       (err) => console.error("❌ Redis error:", err.message));
  }

  return client;
}

export async function connectRedis(): Promise<void> {
  try {
    const redis = getRedis();
    await redis.connect();
    await redis.ping(); // verify connection is alive
    console.log("✅ Redis connection verified");
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    // ioredis throws if connect() called when already connected — safe to ignore
    if (error.message?.includes("already")) return;
    console.error("❌ Redis connection failed:", error);
    // Non-fatal: app starts, but Bull queues and PIN storage won't work
  }
}

// ── Typed utility helpers ─────────────────────────────────────────────────────

/** Store a string value with TTL (seconds). Used for PINs, tokens, locks. */
export async function setWithTTL(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  await getRedis().setex(key, ttlSeconds, value);
}

/** Retrieve a value. Returns null if key doesn't exist or is expired. */
export async function getValue(key: string): Promise<string | null> {
  return getRedis().get(key);
}

/** Delete a key. Used for PIN cleanup after attendance marked. */
export async function deleteKey(key: string): Promise<void> {
  await getRedis().del(key);
}

/**
 * Atomic increment with TTL set only on first increment.
 * Used for PIN brute-force protection and rate-limit counters.
 * TTL window resets only when key expires — not on every attempt.
 */
export async function incrementWithTTL(
  key: string,
  ttlSeconds: number
): Promise<number> {
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}

export default getRedis;