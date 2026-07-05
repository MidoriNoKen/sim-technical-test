
import { sendResponse } from "@/utils/response";
import { logger } from "@/utils/logger";

export async function POST() {
  try {
    const response = sendResponse({
      success: true,
      message: "Logout successful",
    }, 200);

    // Clear JWT token cookie
    const isSecure = process.env.COOKIE_SECURE === "true";
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 0, // expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    logger.error({ error }, "Unhandled Logout Error");
    return sendResponse({
      success: false,
      message: "Internal server error",
    }, 500);
  }
}
