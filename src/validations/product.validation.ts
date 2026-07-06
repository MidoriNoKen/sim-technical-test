import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(200, "Name must not exceed 200 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(100_000_000, "Price must not exceed 100 million"),
  stock: z
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock must be a non-negative integer")
    .max(1_000_000, "Stock must not exceed 1 million"),
  images: z
    .array(z.string())
    .max(10, "A product can have a maximum of 10 images")
    .optional()
    .default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.preprocess((val) => Number(val || 1), z.number().int().min(1)).default(1),
  limit: z.preprocess((val) => Number(val || 10), z.number().int().min(1).max(100)).default(10),
  search: z.string().optional().nullable(),
  minPrice: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().nonnegative().optional()),
  maxPrice: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().nonnegative().optional()),
  sortBy: z.enum(["price", "createdAt", "stock", "name"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
