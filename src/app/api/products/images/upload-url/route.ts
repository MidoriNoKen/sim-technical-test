import { NextRequest } from "next/server";
import { getUploadUrl } from "@/services/s3.service";
import { sendResponse } from "@/utils/response";
import { logger } from "@/utils/logger";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

    let body;
    try {
      body = await request.json();
    } catch {
      return sendResponse({ success: false, message: "Invalid JSON input" }, 400);
    }

    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return sendResponse(
        {
          success: false,
          message: "fileName and contentType are required fields",
        },
        400
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return sendResponse(
        {
          success: false,
          message: `Invalid file type. Allowed types are: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        },
        400
      );
    }

    const data = await getUploadUrl(fileName, contentType);

    return sendResponse(
      {
        success: true,
        data,
        message: "Presigned upload URL generated successfully",
      },
      200
    );
  } catch (error) {
    logger.error({ err: error }, "Error generating upload presigned URL");
    return sendResponse(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
}
