import { prisma } from "@/lib/prisma";
import * as orderRepository from "@/repositories/order.repository";
import { clearProductCache } from "@/services/product.service";
import { AppError } from "@/utils/response";

export async function createOrder(
  userId: string,
  items: { productId: string; quantity: number }[]
) {
  // Validate that the user exists before creating the order
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found. Please log in again.", 401);
  }

  const result = await prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    const preparedItems = [];

    // Group items by productId to avoid fetching the same product multiple times and simplify validation
    const itemMap = new Map<string, number>();
    for (const item of items) {
      const currentQty = itemMap.get(item.productId) || 0;
      itemMap.set(item.productId, currentQty + item.quantity);
    }

    for (const [productId, quantity] of itemMap.entries()) {
      // 1. Fetch product to ensure existence, price check, and non-deleted state
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.deletedAt !== null) {
        throw new AppError(`Product not found`, 404);
      }

      // 2. Perform atomic decrement
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      // 3. Verify stock wasn't overdrawn
      if (updatedProduct.stock < 0) {
        throw new AppError(
          `Insufficient stock for product "${product.name}". Requested: ${quantity}, available: ${product.stock}`,
          400
        );
      }

      const priceAtPurchase = product.price;
      totalAmount += priceAtPurchase * quantity;

      preparedItems.push({
        productId,
        quantity,
        priceAtPurchase,
      });
    }

    // 4. Create the order and items in db
    const order = await orderRepository.createOrder(tx, {
      userId,
      totalAmount,
      items: preparedItems,
    });

    return order;
  });

  // Invalidate cache after successful transaction commit
  await clearProductCache();

  return result;
}

export async function getUserOrders(userId: string) {
  return orderRepository.findOrdersByUserId(userId);
}

export async function getAllOrders(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  return orderRepository.findAllOrders(params);
}

export async function getOrderById(orderId: string) {
  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  return order;
}

export async function updateOrderStatus(
  orderId: string,
  userId: string,
  newStatus: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found. Please log in again.", 401);
  }

  const validStatuses = ["PENDING", "COMPLETED", "CANCELLED"];
  if (!validStatuses.includes(newStatus)) {
    throw new AppError("Invalid order status", 400);
  }

  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === newStatus) {
    return order;
  }

  await prisma.$transaction(async (tx) => {
    // 1. If transitioning TO 'CANCELLED', restock the products
    if (newStatus === "CANCELLED" && order.status !== "CANCELLED") {
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // 2. If transitioning FROM 'CANCELLED', decrement the stock
    if (order.status === "CANCELLED" && newStatus !== "CANCELLED") {
      for (const item of order.orderItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || product.deletedAt !== null) {
          throw new AppError(`Product not found or deleted`, 404);
        }

        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedProduct.stock < 0) {
          throw new AppError(
            `Insufficient stock to reopen order for product "${product.name}". Requested: ${item.quantity}, available: ${product.stock}`,
            400
          );
        }
      }
    }

    // 3. Update the order status
    return orderRepository.updateOrderStatus(tx, orderId, newStatus);
  });

  await clearProductCache();

  return orderRepository.findOrderById(orderId);
}

export async function deleteOrder(orderId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found. Please log in again.", 401);
  }

  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    if (order.status !== "CANCELLED") {
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    return orderRepository.deleteOrder(tx, orderId);
  });

  await clearProductCache();

  return result;
}

