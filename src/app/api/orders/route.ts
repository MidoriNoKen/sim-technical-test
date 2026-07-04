import { NextRequest } from "next/server";
import { createOrderSchema } from "@/validations/order.validation";
import * as orderService from "@/services/order.service";
import { AppError, sendResponse } from "@/utils/response";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return sendResponse(
        {
          success: false,
          message: "Unauthorized: Missing user identification",
        },
        401
      );
    }

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    const order = await orderService.createOrder(userId, validatedData.items);

    return sendResponse(
      {
        success: true,
        data: order,
        message: "Order placed successfully",
      },
      201
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendResponse(
        {
          success: false,
          message: "Invalid JSON input",
        },
        400
      );
    }

    if (error instanceof z.ZodError) {
      return sendResponse(
        {
          success: false,
          error: error.issues,
          message: "Validation failed",
        },
        400
      );
    }

    if (error instanceof AppError) {
      return sendResponse(
        {
          success: false,
          message: error.message,
        },
        error.statusCode
      );
    }

    console.error("POST Order error:", error);
    return sendResponse(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return sendResponse(
        {
          success: false,
          message: "Unauthorized: Missing user identification",
        },
        401
      );
    }

    const orders = await orderService.getUserOrders(userId);

    return sendResponse(
      {
        success: true,
        data: orders,
        message: "Orders fetched successfully",
      },
      200
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendResponse(
        {
          success: false,
          message: error.message,
        },
        error.statusCode
      );
    }

    console.error("GET Orders error:", error);
    return sendResponse(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
}
