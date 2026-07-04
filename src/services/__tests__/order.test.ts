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
    $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
      callback(txMock)
    ),
  },
}));

// Import service and repository AFTER mocks are declared
import { createOrder } from "@/services/order.service";
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
  totalAmount: 1000000,
  createdAt: new Date(),
  updatedAt: new Date(),
  orderItems: [
    {
      id: "item-uuid-1",
      orderId: "order-uuid-1",
      productId: "product-uuid-1",
      quantity: 2,
      priceAtPurchase: 500000,
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
