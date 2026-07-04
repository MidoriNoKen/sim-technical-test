import { NextRequest } from "next/server";
import { createProductSchema, productQuerySchema } from "@/validations/product.validation";
import * as productService from "@/services/product.service";
import { AppError, sendResponse } from "@/utils/response";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const validatedQuery = productQuerySchema.parse(query);
    const result = await productService.getProducts(validatedQuery);

    return sendResponse({
      success: true,
      data: result.items,
      message: "Products fetched successfully",
      ...(result.total !== undefined && {
        pagination: {
          total: result.total,
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          totalPages: Math.ceil(result.total / validatedQuery.limit),
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

    console.error("GET Products error:", error);
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

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

    console.error("POST Product error:", error);
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}
