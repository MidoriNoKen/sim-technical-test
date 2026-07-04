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
}

export function sendResponse<T>(
  { success, data, error, message }: ApiResponseOptions<T>,
  status: number = 200
) {
  return NextResponse.json(
    {
      success,
      ...(data !== undefined && { data }),
      ...(error !== undefined && { error }),
      ...(message !== undefined && { message }),
    },
    { status }
  );
}
