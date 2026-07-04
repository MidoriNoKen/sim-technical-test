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
