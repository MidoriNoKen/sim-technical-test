import { NextResponse } from "next/server";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export interface ApiResponseOptions<T = unknown> {
  success: boolean;
  data?: T;
  error?: unknown;
  message?: string;
  stats?: any;
  pagination?: any;
}

/**
 * Sanitizes error details for production responses to prevent leaking
 * internal stack traces or sensitive database information.
 */
function sanitizeErrorForProduction(error: unknown): unknown {
  if (process.env.NODE_ENV !== "production") {
    return error;
  }

  // In production, never expose raw error objects that might contain stack traces
  if (error instanceof Error) {
    return "An internal error occurred";
  }

  // If it's a plain object, only allow safe serializable values
  if (typeof error === "object" && error !== null) {
    return "An internal error occurred";
  }

  return error;
}

export function sendResponse<T>(
  { success, data, error, message, stats, pagination }: ApiResponseOptions<T>,
  status: number = 200
) {
  return NextResponse.json(
    {
      success,
      ...(data !== undefined && { data }),
      ...(error !== undefined && { error: sanitizeErrorForProduction(error) }),
      ...(message !== undefined && { message }),
      ...(stats !== undefined && { stats }),
      ...(pagination !== undefined && { pagination }),
    },
    { status }
  );
}
