import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock s3 service
vi.mock("@/services/s3.service", () => ({
  getPresignedUrlsForKeys: vi.fn(async (keys: string[]) => keys),
  deleteKeysFromS3: vi.fn().mockResolvedValue(undefined),
}));

// Mock the product repository
vi.mock("@/repositories/product.repository");

// Mock redis
vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    scan: vi.fn(),
    del: vi.fn(),
  },
}));

// Import service, repository, and mocked modules AFTER mocks are declared
import { getProducts } from "@/services/product.service";
import * as productRepository from "@/repositories/product.repository";
import { redis } from "@/lib/redis";

// ─── Fixtures ────────────────────────────────────────────────────────────────
const mockProduct = {
  id: "product-uuid-1",
  name: "Wireless Mouse",
  price: 500000,
  stock: 10,
  images: ["img-key-1"],
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  description: "A wireless mouse",
};

describe("Product Service - getProducts()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should retrieve products from DB on cache miss and store them in cache", async () => {
    // Arrange
    vi.mocked(redis.get).mockResolvedValue(null);
    const mockRepoResult = {
      total: 1,
      items: [mockProduct],
    };
    vi.mocked(productRepository.findAll).mockResolvedValue(mockRepoResult);

    // Act
    const result = await getProducts({
      page: 1,
      limit: 10,
      search: "Mouse",
      minPrice: 100000,
      maxPrice: 600000,
      sortBy: "price",
      sortOrder: "asc",
    });

    // Assert
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.hasNextPage).toBe(false);
    expect(productRepository.findAll).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      search: "Mouse",
      minPrice: 100000,
      maxPrice: 600000,
      sortBy: "price",
      sortOrder: "asc",
    });
    expect(vi.mocked(redis.setex)).toHaveBeenCalledOnce();
  });

  it("should retrieve products from cache on cache hit without calling DB", async () => {
    // Arrange
    const cachedResult = {
      total: 15,
      items: [mockProduct],
      hasNextPage: true,
    };
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedResult));

    // Act
    const result = await getProducts({
      page: 1,
      limit: 10,
    });

    // Assert
    expect(result.total).toBe(15);
    expect(result.items).toHaveLength(1);
    expect(result.hasNextPage).toBe(true);
    expect(productRepository.findAll).not.toHaveBeenCalled();
  });
});
