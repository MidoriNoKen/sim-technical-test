import jwt from "jsonwebtoken";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production!");
    }
    return "super_secret_solutech_key_2026";
  }
  return secret;
}

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "1d" });
}

export function verifyToken(token: string): unknown {
  return jwt.verify(token, getSecret());
}
