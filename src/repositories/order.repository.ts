import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type OrderItemInput = {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
};

export async function createOrder(
  tx: Prisma.TransactionClient,
  data: {
    userId: string;
    totalAmount: number;
    items: OrderItemInput[];
  }
) {
  return tx.order.create({
    data: {
      userId: data.userId,
      totalAmount: data.totalAmount,
      orderItems: {
        createMany: {
          data: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          })),
        },
      },
    },
    include: {
      orderItems: true,
    },
  });
}

export async function findOrdersByUserId(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
