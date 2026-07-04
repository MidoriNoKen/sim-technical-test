import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().optional().nullable(),
  price: z.number().positive("Price must be a positive number"),
  stock: z.number().int().nonnegative("Stock must be a non-negative integer"),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.preprocess((val) => Number(val || 1), z.number().int().min(1)).default(1),
  limit: z.preprocess((val) => Number(val || 10), z.number().int().min(1)).default(10),
  search: z.string().optional().nullable(),
});
