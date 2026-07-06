import { NextRequest } from "next/server";
import { createOrderSchema, orderQuerySchema } from "@/validations/order.validation";
import * as orderService from "@/services/order.service";
import { AppError, sendResponse } from "@/utils/response";
import { z } from "zod";
import { logger } from "@/utils/logger";

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

    logger.error({ error }, "Unhandled POST Order Error");
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

    const userRole = request.headers.get("x-user-role");

    // Admin can see all orders with pagination
    if (userRole === "ADMIN") {
      const { searchParams } = new URL(request.url);
      const query = {
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
        search: searchParams.get("search") || undefined,
        status: searchParams.get("status") || undefined,
        minAmount: searchParams.get("minAmount") || undefined,
        maxAmount: searchParams.get("maxAmount") || undefined,
        sortBy: searchParams.get("sortBy") || undefined,
        sortOrder: searchParams.get("sortOrder") || undefined,
      };

      const validatedQuery = orderQuerySchema.parse(query);
      const result = await orderService.getAllOrders(validatedQuery);

      return sendResponse(
        {
          success: true,
          data: result.data,
          message: "Orders fetched successfully",
          ...(result.pagination && {
            pagination: result.pagination,
          }),
        },
        200
      );
    }

    // Regular user can only see their own orders
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

    logger.error({ error }, "Unhandled GET Orders Error");
    return sendResponse(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
}
