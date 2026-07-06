import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/utils/response";

// Mock clearProductCache from product service BEFORE importing service under test
vi.mock("@/services/product.service", () => ({
  clearProductCache: vi.fn().mockResolvedValue(undefined),
}));

// Mock the order repository
vi.mock("@/repositories/order.repository");

// Create a shared transaction mock - the tx object injected into $transaction callbacks
const txMock = {
  product: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  order: {
    create: vi.fn(),
  },
};

// Mock prisma: $transaction immediately invokes the callback with txMock
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: "user-uuid-1", email: "test@test.com" }) },
    $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
      callback(txMock)
    ),
  },
}));

// Import service and repository AFTER mocks are declared
import { createOrder, updateOrderStatus, deleteOrder } from "@/services/order.service";
import * as orderRepository from "@/repositories/order.repository";

// ─── Fixtures ────────────────────────────────────────────────────────────────
const mockProduct = {
  id: "product-uuid-1",
  name: "Wireless Mouse",
  price: 500000,
  stock: 10,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  description: "A wireless mouse",
};

const mockOrder = {
  id: "order-uuid-1",
  userId: "user-uuid-1",
  status: "PENDING",
  totalAmount: 1000000,
  verifiedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { email: "test@test.com" },
  verifiedBy: null,
  orderItems: [
    {
      id: "item-uuid-1",
      orderId: "order-uuid-1",
      productId: "product-uuid-1",
      quantity: 2,
      priceAtPurchase: 500000,
      product: {
        name: "Wireless Mouse",
        price: 500000,
      },
    },
  ],
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("Order Service - createOrder()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create an order successfully with sufficient stock and correct total amount", async () => {
    // Arrange
    txMock.product.findUnique.mockResolvedValue(mockProduct);
    txMock.product.update.mockResolvedValue({ ...mockProduct, stock: 8 });
    vi.mocked(orderRepository.createOrder).mockResolvedValue(mockOrder);

    // Act
    const result = await createOrder("user-uuid-1", [{ productId: "product-uuid-1", quantity: 2 }]);

    // Assert: total = price(500000) * qty(2) = 1_000_000
    expect(result.totalAmount).toBe(1000000);
    expect(result.orderItems).toHaveLength(1);
    expect(orderRepository.createOrder).toHaveBeenCalledOnce();
  });

  it("should throw AppError 400 when stock is insufficient", async () => {
    // Arrange: product has stock=1, request=5 → after decrement stock=-4
    const lowStockProduct = { ...mockProduct, stock: 1 };
    txMock.product.findUnique.mockResolvedValue(lowStockProduct);
    txMock.product.update.mockResolvedValue({ ...lowStockProduct, stock: -4 });

    // Act & Assert
    await expect(
      createOrder("user-uuid-1", [{ productId: "product-uuid-1", quantity: 5 }])
    ).rejects.toThrow(AppError);

    await expect(
      createOrder("user-uuid-1", [{ productId: "product-uuid-1", quantity: 5 }])
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("should throw AppError 404 when product does not exist (findUnique returns null)", async () => {
    // Arrange
    txMock.product.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      createOrder("user-uuid-1", [{ productId: "non-existent-uuid", quantity: 1 }])
    ).rejects.toThrow(AppError);

    await expect(
      createOrder("user-uuid-1", [{ productId: "non-existent-uuid", quantity: 1 }])
    ).rejects.toMatchObject({ statusCode: 404, message: "Product not found" });
  });

  it("should throw AppError 404 when product is soft-deleted (deletedAt is set)", async () => {
    // Arrange: product exists but is soft-deleted
    const deletedProduct = { ...mockProduct, deletedAt: new Date() };
    txMock.product.findUnique.mockResolvedValue(deletedProduct);

    // Act & Assert
    await expect(
      createOrder("user-uuid-1", [{ productId: "product-uuid-1", quantity: 1 }])
    ).rejects.toMatchObject({ statusCode: 404, message: "Product not found" });
  });
});

describe("Order Service - updateOrderStatus()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update status successfully if status is valid and different", async () => {
    // Arrange
    const mockOrderPending = { ...mockOrder, status: "PENDING" };
    const mockOrderCompleted = { ...mockOrder, status: "COMPLETED" };
    vi.mocked(orderRepository.findOrderById)
      .mockResolvedValueOnce(mockOrderPending)
      .mockResolvedValueOnce(mockOrderCompleted);
    vi.mocked(orderRepository.updateOrderStatus).mockResolvedValue(mockOrderCompleted);

    // Act
    const result = await updateOrderStatus("order-uuid-1", "user-uuid-1", "COMPLETED");

    // Assert
    expect(result?.status).toBe("COMPLETED");
    expect(orderRepository.updateOrderStatus).toHaveBeenCalledWith(txMock, "order-uuid-1", "COMPLETED", null);
  });

  it("should set verifiedById when status is VERIFIED", async () => {
    // Arrange
    const mockOrderPending = { ...mockOrder, status: "PENDING" };
    const mockOrderVerified = { ...mockOrder, status: "VERIFIED" };
    vi.mocked(orderRepository.findOrderById)
      .mockResolvedValueOnce(mockOrderPending)
      .mockResolvedValueOnce(mockOrderVerified);
    vi.mocked(orderRepository.updateOrderStatus).mockResolvedValue(mockOrderVerified);

    // Act
    const result = await updateOrderStatus("order-uuid-1", "user-uuid-1", "VERIFIED");

    // Assert
    expect(result?.status).toBe("VERIFIED");
    expect(orderRepository.updateOrderStatus).toHaveBeenCalledWith(txMock, "order-uuid-1", "VERIFIED", "user-uuid-1");
  });

  it("should throw AppError 400 if status is invalid", async () => {
    await expect(
      updateOrderStatus("order-uuid-1", "user-uuid-1", "INVALID_STATUS")
    ).rejects.toMatchObject({ statusCode: 400, message: "Invalid order status" });
  });

  it("should restock items when transitioning to CANCELLED", async () => {
    // Arrange
    const mockOrderPending = { ...mockOrder, status: "PENDING" };
    vi.mocked(orderRepository.findOrderById).mockResolvedValue(mockOrderPending);
    txMock.product.update = vi.fn().mockResolvedValue({});

    // Act
    await updateOrderStatus("order-uuid-1", "user-uuid-1", "CANCELLED");

    // Assert
    expect(txMock.product.update).toHaveBeenCalledOnce();
    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: "product-uuid-1" },
      data: { stock: { increment: 2 } },
    });
  });
});

describe("Order Service - deleteOrder()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should restock items when deleting a non-cancelled order", async () => {
    // Arrange
    const mockOrderPending = { ...mockOrder, status: "PENDING" };
    vi.mocked(orderRepository.findOrderById).mockResolvedValue(mockOrderPending);
    txMock.product.update = vi.fn().mockResolvedValue({});
    vi.mocked(orderRepository.deleteOrder).mockResolvedValue(mockOrderPending as unknown as never);

    // Act
    await deleteOrder("order-uuid-1", "user-uuid-1");

    // Assert
    expect(txMock.product.update).toHaveBeenCalledOnce();
    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: "product-uuid-1" },
      data: { stock: { increment: 2 } },
    });
    expect(orderRepository.deleteOrder).toHaveBeenCalledOnce();
  });

  it("should not restock items when deleting an already cancelled order", async () => {
    // Arrange
    const mockOrderCancelled = { ...mockOrder, status: "CANCELLED" };
    vi.mocked(orderRepository.findOrderById).mockResolvedValue(mockOrderCancelled);
    txMock.product.update = vi.fn();
    vi.mocked(orderRepository.deleteOrder).mockResolvedValue(mockOrderCancelled as unknown as never);

    // Act
    await deleteOrder("order-uuid-1", "user-uuid-1");

    // Assert
    expect(txMock.product.update).not.toHaveBeenCalled();
    expect(orderRepository.deleteOrder).toHaveBeenCalledOnce();
  });
});

