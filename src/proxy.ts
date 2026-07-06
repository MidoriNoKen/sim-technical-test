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

/**
 * Sets security headers on a response (Helmet-equivalent for Next.js).
 */
function setSecurityHeaders(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0"); // Deprecated but still set for legacy clients
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // CSP: allow self-hosted scripts, styles (including inline for Next.js), fonts, and data URIs.
  // Avoid 'none' which completely breaks Next.js CSS and JS loading.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js runtime
      "style-src 'self' 'unsafe-inline'",               // unsafe-inline needed by Tailwind/Next.js
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://*.amazonaws.com",
      "connect-src 'self' https://*.amazonaws.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join("; ")
  );
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", isProduction ? "max-age=31536000; includeSubDomains" : "max-age=0");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.delete("X-Powered-By");
}

const MAX_BODY_SIZE = 100_000; // 100KB max request body

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Extract client IP address from headers (x-forwarded-for set by reverse proxy)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

  // 1. Request body size limiting for write methods (bypass for multipart/form-data uploads)
  if (["POST", "PUT", "PATCH"].includes(method)) {
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");
    
    const contentLength = request.headers.get("content-length");
    if (!isMultipart && contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      logger.warn({ method, url: pathname, ip, contentLength }, "Request body too large");
      const response = NextResponse.json(
        { success: false, message: "Request body too large" },
        { status: 413 }
      );
      setSecurityHeaders(response);
      return response;
    }
  }

  // 2. Logging incoming requests
  logger.info({ method, url: pathname, ip }, "Incoming API Request");

  // Determine route types
  const isOrdersRoute = pathname.startsWith("/api/orders");
  const isProductsRoute = pathname.startsWith("/api/products");
  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname === "/" || pathname === "/cart" || pathname === "/orders" || pathname.startsWith("/products/");
  const isApiRoute = pathname.startsWith("/api/");

  // 3. Redis-based rate limiting check with endpoint-specific limits
  let rateLimitHeaders: Record<string, string> = {};
  try {
    // Determine rate limit type based on endpoint
    let rateLimitType: "public" | "authenticated" | "admin" | "write" = "authenticated";

    if (pathname === "/api/auth/login") {
      rateLimitType = "public";
    } else if (isAdminRoute) {
      rateLimitType = "admin";
    } else if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      rateLimitType = "write";
    }

    const rateLimit = await checkRateLimit(ip, rateLimitType);
    rateLimitHeaders = {
      "X-RateLimit-Limit": rateLimit.limit.toString(),
      "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      "Retry-After": rateLimit.reset.toString(),
    };
    if (!rateLimit.success) {
      logger.warn({ method, url: pathname, ip, type: rateLimitType }, "Rate limit exceeded");
      const response = NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders }
      );
      setSecurityHeaders(response);
      return response;
    }
  } catch (error) {
    logger.error({ error, ip }, "Rate limiter check failed (fail-open)");
  }

  // Intercept requests to protected routes (e.g., /api/orders, /api/products, /admin)

  if (isOrdersRoute || isProductsRoute || isAdminRoute) {
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
      // For page routes, redirect to login page instead of returning JSON
      if (isAdminRoute || isCustomerRoute) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        setSecurityHeaders(response);
        return response;
      }

      const response = NextResponse.json(
        { success: false, message: "Unauthorized: Token missing" },
        { status: 401, headers: rateLimitHeaders }
      );
      setSecurityHeaders(response);
      return response;
    }

    try {
      // Validate token using jose
      const secretKey = getSecretKey();
      const { payload } = await jwtVerify(token, secretKey);

      // For admin routes, check if user has admin role
      if (isAdminRoute && payload.role !== "ADMIN") {
        const response = NextResponse.json(
          { success: false, message: "Forbidden: Admin access required" },
          { status: 403, headers: rateLimitHeaders }
        );
        setSecurityHeaders(response);
        return response;
      }

      // For customer routes, optionally we could restrict admins from accessing them (or just let them)
      if (isCustomerRoute && payload.role !== "CUSTOMER") {
        // Redirect admin to admin dashboard if they try to access storefront
        const response = NextResponse.redirect(new URL("/admin/products", request.url));
        setSecurityHeaders(response);
        return response;
      }

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
      setSecurityHeaders(response);
      return response;
    } catch {
      // For page routes, redirect to login page on invalid token
      if (isAdminRoute || isCustomerRoute) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        setSecurityHeaders(response);
        return response;
      }

      const response = NextResponse.json(
        { success: false, message: "Unauthorized: Invalid or expired token" },
        { status: 401, headers: rateLimitHeaders }
      );
      setSecurityHeaders(response);
      return response;
    }
  }

  const response = NextResponse.next();
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  setSecurityHeaders(response);
  return response;
}

// Match API routes, admin routes, and customer page routes
export const config = {
  matcher: [
    "/",
    "/cart",
    "/orders",
    "/products/:path*",
    "/api/:path*",
    "/admin/:path*",
  ],
};
