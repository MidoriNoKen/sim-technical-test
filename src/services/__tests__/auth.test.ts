import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "@/services/auth.service";
import { AppError } from "@/utils/response";

// Mock dependencies
vi.mock("@/repositories/user.repository");
vi.mock("@/utils/hash");
vi.mock("@/utils/jwt");

import * as userRepository from "@/repositories/user.repository";
import * as hashUtils from "@/utils/hash";
import * as jwtUtils from "@/utils/jwt";

const mockUser = {
  id: "user-uuid-1",
  email: "admin@solutech.id",
  password: "$2a$10$hashedpassword",
  role: "ADMIN" as const,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("Auth Service - login()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return token and user object on successful login", async () => {
    // Arrange
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(hashUtils.comparePassword).mockResolvedValue(true);
    vi.mocked(jwtUtils.signToken).mockReturnValue("signed.jwt.token");

    // Act
    const result = await login({ email: "admin@solutech.id", password: "password123" });

    // Assert
    expect(result.token).toBe("signed.jwt.token");
    expect(result.user.id).toBe(mockUser.id);
    expect(result.user.email).toBe(mockUser.email);
    // Ensure password is NOT returned
    expect(result.user).not.toHaveProperty("password");
    expect(userRepository.findUserByEmail).toHaveBeenCalledWith("admin@solutech.id");
  });

  it("should throw AppError 401 when email is not found", async () => {
    // Arrange
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

    // Act & Assert
    await expect(
      login({ email: "nonexistent@example.com", password: "any_password" })
    ).rejects.toThrow(AppError);

    await expect(
      login({ email: "nonexistent@example.com", password: "any_password" })
    ).rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password" });
  });

  it("should throw AppError 401 when password is incorrect", async () => {
    // Arrange
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(hashUtils.comparePassword).mockResolvedValue(false);

    // Act & Assert
    await expect(
      login({ email: "admin@solutech.id", password: "wrong_password" })
    ).rejects.toThrow(AppError);

    await expect(
      login({ email: "admin@solutech.id", password: "wrong_password" })
    ).rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password" });
  });
});
