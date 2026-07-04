import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_solutech_key_2026";
const encoder = new TextEncoder();
const secretKey = encoder.encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept requests to protected routes (e.g., /api/orders, and potentially others)
  const isOrdersRoute = pathname.startsWith("/api/orders");

  if (isOrdersRoute) {
    let token: string | null = null;

    // 1. Check Authorization Header
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2. Check Cookie if header token not found
    if (!token) {
      const tokenCookie = request.cookies.get("token");
      if (tokenCookie) {
        token = tokenCookie.value;
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
      const { payload } = await jwtVerify(token, secretKey);
      
      // Clone request headers and insert user info (optional, but useful for downstream)
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-user-role", payload.role as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
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
