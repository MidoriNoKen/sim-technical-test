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

  // Extract client IP address from headers (Traefik sets X-Real-Ip and X-Forwarded-For)
  const ip = 
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
    "127.0.0.1";

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
  const isLoginRoute = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api/");

  // 3. Redis-based rate limiting check with endpoint-specific limits
  let rateLimitHeaders: Record<string, string> = {};
  try {
    // Determine rate limit type based on endpoint
    let rateLimitType: import("@/utils/rate-limiter").RateLimitType = "page";

    if (pathname.startsWith("/api")) {
      if (pathname === "/api/auth/login") {
        rateLimitType = "public";
      } else if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        rateLimitType = "write";
      } else {
        rateLimitType = "api";
      }
    } else {
      rateLimitType = "page";
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

  // Intercept requests to protected routes (e.g., /api/orders, /api/products, /admin) and apply redirects for customer/login

  if (isOrdersRoute || isProductsRoute || isAdminRoute || isCustomerRoute || isLoginRoute) {
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
      // Allow unauthenticated access to /login ONLY
      if (isLoginRoute) {
        const response = NextResponse.next();
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        setSecurityHeaders(response);
        return response;
      }

      // For page routes, redirect to login page
      if (isAdminRoute || isCustomerRoute) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        setSecurityHeaders(response);
        return response;
      }
      
      // For API routes, return 401 JSON
      if (isOrdersRoute || isProductsRoute) {
        const response = NextResponse.json(
          { success: false, message: "Unauthorized: Token missing" },
          { status: 401, headers: rateLimitHeaders }
        );
        setSecurityHeaders(response);
        return response;
      }

      const response = NextResponse.next();
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      setSecurityHeaders(response);
      return response;
    }

    try {
      // Validate token using jose
      const secretKey = getSecretKey();
      const { payload } = await jwtVerify(token, secretKey);
      const role = payload.role as string;

      // Handle authenticated user at /login
      if (isLoginRoute) {
        const redirectUrl = role === "ADMIN" ? "/admin" : "/";
        const response = NextResponse.redirect(new URL(redirectUrl, request.url));
        setSecurityHeaders(response);
        return response;
      }

      // For admin routes, check if user has admin role
      if (isAdminRoute && role !== "ADMIN") {
        // Redirect customer to customer dashboard if they try to access admin
        if (role === "CUSTOMER") {
          const response = NextResponse.redirect(new URL("/", request.url));
          setSecurityHeaders(response);
          return response;
        }

        const response = NextResponse.json(
          { success: false, message: "Forbidden: Admin access required" },
          { status: 403, headers: rateLimitHeaders }
        );
        setSecurityHeaders(response);
        return response;
      }

      // For customer routes, restrict admins from accessing them
      if (isCustomerRoute && role !== "CUSTOMER") {
        // Redirect admin to admin dashboard if they try to access storefront
        const response = NextResponse.redirect(new URL("/admin", request.url));
        setSecurityHeaders(response);
        return response;
      }

      // Clone request headers and insert user info
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-user-role", role);

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
      if (isAdminRoute || pathname === "/orders") {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        setSecurityHeaders(response);
        return response;
      }

      if (isOrdersRoute || isProductsRoute) {
        const response = NextResponse.json(
          { success: false, message: "Unauthorized: Invalid or expired token" },
          { status: 401, headers: rateLimitHeaders }
        );
        setSecurityHeaders(response);
        return response;
      }

      // Fallback for customer routes with invalid token (just wipe it out? Let them pass as unauth)
      const response = NextResponse.next();
      response.cookies.delete("token");
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
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

// Match all request paths except for static assets and images
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
