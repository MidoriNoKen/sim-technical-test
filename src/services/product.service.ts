import * as productRepository from "@/repositories/product.repository";
import { redis } from "@/lib/redis";
import { AppError } from "@/utils/response";
import { Prisma } from "@prisma/client";

// Cache helpers
const CACHE_PREFIX = "products:";

async function clearProductCache() {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log("Product caches invalidated successfully");
    }
  } catch (error) {
    console.error("Failed to invalidate product caches:", error);
  }
}

export async function createProduct(data: Prisma.ProductCreateInput) {
  const product = await productRepository.create(data);
  await clearProductCache();
  return product;
}

export async function getProducts(query: {
  page: number;
  limit: number;
  search?: string | null;
}) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;
  const take = limit;

  // Construct cache key
  const cacheKey = `${CACHE_PREFIX}page:${page}:limit:${limit}:search:${search || "none"}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("Redis cache hit for key:", cacheKey);
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.error("Redis fetch error:", error);
  }

  // Cache miss
  console.log("Redis cache miss for key:", cacheKey);
  const result = await productRepository.findAll({ skip, take, search });

  // Store in cache for 1 hour (3600 seconds)
  try {
    await redis.setex(cacheKey, 3600, JSON.stringify(result));
  } catch (error) {
    console.error("Redis store error:", error);
  }

  return result;
}

export async function getProductById(id: string) {
  const product = await productRepository.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
}

export async function updateProduct(id: string, data: Prisma.ProductUpdateInput) {
  // Ensure product exists
  await getProductById(id);

  const updatedProduct = await productRepository.update(id, data);
  await clearProductCache();
  return updatedProduct;
}

export async function deleteProduct(id: string) {
  // Ensure product exists
  await getProductById(id);

  const deletedProduct = await productRepository.softDelete(id);
  await clearProductCache();
  return deletedProduct;
}
