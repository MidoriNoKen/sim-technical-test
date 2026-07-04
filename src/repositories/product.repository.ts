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
}: {
  skip: number;
  take: number;
  search?: string | null;
}) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(search && {
      name: {
        contains: search,
        mode: "insensitive",
      },
    }),
  };

  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { total, items };
}
