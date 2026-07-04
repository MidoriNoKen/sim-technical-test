import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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
        { status: 401 }
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

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Match all API routes except public auth endpoints
export const config = {
  matcher: "/api/:path*",
};
