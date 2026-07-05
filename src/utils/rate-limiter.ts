import { redis } from "@/lib/redis";

// Rate limit configurations for different endpoint types
export const RATE_LIMITS = {
  // Public endpoints (login, etc.) - stricter limits
  public: {
    limit: 10,
    windowSeconds: 60, // 1 minute
  },
  // Authenticated API endpoints - moderate limits
  authenticated: {
    limit: 100,
    windowSeconds: 900, // 15 minutes
  },
  // Admin endpoints - higher limits but still protected
  admin: {
    limit: 200,
    windowSeconds: 900, // 15 minutes
  },
  // Sensitive write operations (create order, etc.) - stricter
  write: {
    limit: 30,
    windowSeconds: 300, // 5 minutes
  },
} as const;

const PREFIX = "rate-limit:";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // TTL remaining in seconds
};

export type RateLimitType = keyof typeof RATE_LIMITS;

export async function checkRateLimit(
  ip: string,
  type: RateLimitType = "authenticated"
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  const key = `${PREFIX}${type}:${ip}`;

  // Atomic increment
  const count = await redis.incr(key);
  let ttl = await redis.ttl(key);

  // If first request in the window, set expiration
  if (ttl === -1 || count === 1) {
    await redis.expire(key, config.windowSeconds);
    ttl = config.windowSeconds;
  }

  const reset = ttl > 0 ? ttl : config.windowSeconds;

  return {
    success: count <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - count),
    reset,
  };
}

export async function clearRateLimit(ip: string, type?: RateLimitType): Promise<void> {
  if (type) {
    // Clear specific rate limit type
    const key = `${PREFIX}${type}:${ip}`;
    await redis.del(key);
  } else {
    // Clear all rate limits for this IP
    const pattern = `${PREFIX}*${ip}`;
    let cursor = "0";
    do {
      const reply = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = reply[0];
      const keys = reply[1];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  }
}
