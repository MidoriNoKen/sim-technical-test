import { redis } from "@/lib/redis";

const LIMIT = 100;
const WINDOW_SECONDS = 900; // 15 minutes
const PREFIX = "rate-limit:";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // TTL remaining in seconds
};

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const key = `${PREFIX}${ip}`;

  // Atomic increment
  const count = await redis.incr(key);

  // If first request in the window, set expiration
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  const ttl = await redis.ttl(key);
  const reset = ttl > 0 ? ttl : WINDOW_SECONDS;

  return {
    success: count <= LIMIT,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - count),
    reset,
  };
}
