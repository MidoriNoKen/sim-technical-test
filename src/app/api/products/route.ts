import { NextRequest } from "next/server";
import { createProductSchema, productQuerySchema } from "@/validations/product.validation";
import * as productService from "@/services/product.service";
import { AppError, sendResponse } from "@/utils/response";
import { sanitizeStrings } from "@/utils/sanitize";
import { z } from "zod";
import { logger } from "@/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      search: searchParams.get("search") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    };

    const validatedQuery = productQuerySchema.parse(query);
    const result = await productService.getProducts(validatedQuery);

    return sendResponse({
      success: true,
      data: result.items,
      message: "Products fetched successfully",
      stats: result.stats,
      ...(result.total !== undefined && {
        pagination: {
          total: result.total,
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          totalPages: Math.ceil(result.total / validatedQuery.limit),
          hasNextPage: result.hasNextPage,
        }
      })
    }, 200);
  } catch (error) {
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

    logger.error({ error }, "Unhandled GET Products Error");
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitizedBody = sanitizeStrings(body);
    const validatedData = createProductSchema.parse(sanitizedBody);

    const product = await productService.createProduct(validatedData);

    return sendResponse({
      success: true,
      data: product,
      message: "Product created successfully",
    }, 201);
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

    logger.error({ error }, "Unhandled POST Product Error");
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}
