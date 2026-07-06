import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function create(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data });
}

export async function findById(id: string) {
  return prisma.product.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
}

export async function update(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function softDelete(id: string) {
  return prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function findAll({
  skip,
  take,
  search,
  minPrice,
  maxPrice,
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  skip: number;
  take: number;
  search?: string | null;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price" | "createdAt" | "stock" | "name";
  sortOrder?: "asc" | "desc";
}) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(search && {
      name: {
        contains: search,
        mode: "insensitive",
      },
    }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
  };

  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
    }),
  ]);

  return { total, items };
}

export async function getStats() {
  const allProducts = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { price: true, stock: true },
  });

  const totalProducts = allProducts.length;
  const totalStockValue = allProducts.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockCount = allProducts.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = allProducts.filter(p => p.stock === 0).length;

  return {
    totalProducts,
    totalStockValue,
    lowStockCount,
    outOfStockCount,
  };
}
