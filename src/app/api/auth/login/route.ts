import { NextRequest } from "next/server";
import { loginSchema } from "@/validations/auth.validation";
import { login } from "@/services/auth.service";
import { AppError, sendResponse } from "@/utils/response";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const result = await login(validatedData);

    const response = sendResponse({
      success: true,
      data: result,
      message: "Login successful",
    }, 200);

    // Set JWT token as an HTTP-only cookie
    response.cookies.set("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day in seconds
      path: "/",
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendResponse({
        success: false,
        error: error.errors,
        message: "Validation failed",
      }, 400);
    }

    if (error instanceof AppError) {
      return sendResponse({
        success: false,
        message: error.message,
      }, error.statusCode);
    }

    console.error("Login error:", error);
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}
