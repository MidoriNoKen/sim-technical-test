import { NextRequest } from "next/server";
import * as orderService from "@/services/order.service";
import { AppError, sendResponse } from "@/utils/response";
import { logger } from "@/utils/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = _request.headers.get("x-user-id");
    if (!userId) {
      return sendResponse(
        {
          success: false,
          message: "Unauthorized: Missing user identification",
        },
        401
      );
    }

    const { id } = await params;
    const orders = await orderService.getUserOrders(userId);
    const order = orders.find((o) => o.id === id);

    if (!order) {
      return sendResponse(
        {
          success: false,
          message: "Order not found",
        },
        404
      );
    }

    return sendResponse(
      {
        success: true,
        data: order,
        message: "Order fetched successfully",
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

    logger.error({ error }, "Unhandled GET Order Error");
    return sendResponse(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
}