import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Invalid product ID format"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
      })
    )
    .min(1, "Order must contain at least one item"),
});

export const orderQuerySchema = z.object({
  page: z.preprocess((val) => Number(val || 1), z.number().int().min(1)).default(1),
  limit: z.preprocess((val) => Number(val || 10), z.number().int().min(1).max(100)).default(10),
  search: z.string().optional().nullable(),
  status: z.enum(["PENDING", "VERIFIED", "COMPLETED", "CANCELLED"]).optional().nullable(),
  minAmount: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().nonnegative().optional()),
  maxAmount: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().nonnegative().optional()),
  sortBy: z.enum(["totalAmount", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
