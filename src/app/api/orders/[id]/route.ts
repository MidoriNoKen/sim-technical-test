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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return sendResponse(
        {
          success: false,
          message: "Status field is required",
        },
        400
      );
    }

    const order = await orderService.updateOrderStatus(id, userId, body.status);

    return sendResponse(
      {
        success: true,
        data: order,
        message: "Order status updated successfully",
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

    logger.error({ error }, "Unhandled PUT Order Error");
    return sendResponse(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await orderService.deleteOrder(id, userId);

    return sendResponse(
      {
        success: true,
        message: "Order deleted successfully",
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

    logger.error({ error }, "Unhandled DELETE Order Error");
    return sendResponse(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
}