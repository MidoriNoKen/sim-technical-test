import { NextRequest } from "next/server";
import { updateProductSchema } from "@/validations/product.validation";
import * as productService from "@/services/product.service";
import { AppError, sendResponse } from "@/utils/response";
import { z } from "zod";
import { logger } from "@/utils/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Validate UUID format
    const idValidation = z.string().uuid().safeParse(id);
    if (!idValidation.success) {
      return sendResponse({
        success: false,
        message: "Invalid ID format. Must be a valid UUID.",
      }, 400);
    }

    const product = await productService.getProductById(id);

    return sendResponse({
      success: true,
      data: product,
      message: "Product fetched successfully",
    }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return sendResponse({
        success: false,
        message: error.message,
      }, error.statusCode);
    }

    logger.error({ error }, "Unhandled GET Product by ID Error");
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Validate UUID format
    const idValidation = z.string().uuid().safeParse(id);
    if (!idValidation.success) {
      return sendResponse({
        success: false,
        message: "Invalid ID format. Must be a valid UUID.",
      }, 400);
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    const product = await productService.updateProduct(id, validatedData);

    return sendResponse({
      success: true,
      data: product,
      message: "Product updated successfully",
    }, 200);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendResponse({
        success: false,
        message: "Invalid JSON input",
      }, 400);
    }

    if (error instanceof z.ZodError) {
      return sendResponse({
        success: false,
        error: error.issues,
        message: "Validation failed",
      }, 400);
    }

    if (error instanceof AppError) {
      return sendResponse({
        success: false,
        message: error.message,
      }, error.statusCode);
    }

    logger.error({ error }, "Unhandled PUT Product Error");
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Validate UUID format
    const idValidation = z.string().uuid().safeParse(id);
    if (!idValidation.success) {
      return sendResponse({
        success: false,
        message: "Invalid ID format. Must be a valid UUID.",
      }, 400);
    }

    await productService.deleteProduct(id);

    return sendResponse({
      success: true,
      message: "Product deleted successfully",
    }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return sendResponse({
        success: false,
        message: error.message,
      }, error.statusCode);
    }

    logger.error({ error }, "Unhandled DELETE Product Error");
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}
