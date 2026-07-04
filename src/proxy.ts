import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { logger } from "@/utils/logger";
import { checkRateLimit } from "@/utils/rate-limiter";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production!");
    }
    return new TextEncoder().encode("super_secret_solutech_key_2026");
  }
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Extract client IP address from headers (x-forwarded-for set by reverse proxy)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

  // 1. Logging incoming requests
  logger.info({ method, url: pathname, ip }, "Incoming API Request");

  // 2. Redis-based rate limiting check
  let rateLimitHeaders: Record<string, string> = {};
  try {
    const rateLimit = await checkRateLimit(ip);
    rateLimitHeaders = {
      "X-RateLimit-Limit": rateLimit.limit.toString(),
      "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      "Retry-After": rateLimit.reset.toString(),
    };
    if (!rateLimit.success) {
      logger.warn({ method, url: pathname, ip }, "Rate limit exceeded");
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders }
      );
    }
  } catch (error) {
    logger.error({ error, ip }, "Rate limiter check failed (fail-open)");
  }

  // Intercept requests to protected routes (e.g., /api/orders, /api/products)
  const isOrdersRoute = pathname.startsWith("/api/orders");
  const isProductsRoute = pathname.startsWith("/api/products");

  if (isOrdersRoute || isProductsRoute) {
    let token: string | null = null;

    // 1. Check Authorization Header
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check Cookie if header token not found
    if (!token) {
      const tokenCookie = request.cookies.get("token");
      if (tokenCookie) {
        token = tokenCookie.value.trim();
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Token missing" },
        { status: 401, headers: rateLimitHeaders }
      );
    }

    try {
      // Validate token using jose
      const secretKey = getSecretKey();
      const { payload } = await jwtVerify(token, secretKey);
      
      // Clone request headers and insert user info
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-user-role", payload.role as string);

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      // Attach rate limit headers to pass-through response
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    } catch {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid or expired token" },
        { status: 401, headers: rateLimitHeaders }
      );
    }
  }

  const response = NextResponse.next();
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Match all API routes except public auth endpoints
export const config = {
  matcher: "/api/:path*",
};
