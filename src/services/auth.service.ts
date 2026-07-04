import { findUserByEmail } from "@/repositories/user.repository";
import { comparePassword } from "@/utils/hash";
import { signToken } from "@/utils/jwt";
import { AppError } from "@/utils/response";
import { z } from "zod";
import { loginSchema } from "@/validations/auth.validation";

export async function login(data: z.infer<typeof loginSchema>) {
  const user = await findUserByEmail(data.email);
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken({ userId: user.id, role: user.role });

  // Exclude password from returned user object
  const { password: _, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword,
  };
}
