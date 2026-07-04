/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // 1. Clean existing records in dependency-safe order
  console.log("Clearing existing database records...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  console.log("Database cleared.");

  // 2. Seed Admin User
  console.log("Seeding Admin user...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@solutech.id",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin user seeded:", admin.email);

  // 3. Seed Products
  console.log("Seeding products...");
  const productsData = [
    {
      name: "Wireless Mouse",
      description: "High performance ergonomic wireless mouse",
      price: 250000,
      stock: 50,
    },
    {
      name: "Mechanical Keyboard",
      description: "RGB Backlit mechanical keyboard with brown switches",
      price: 750000,
      stock: 30,
    },
    {
      name: "Gaming Monitor 24\"",
      description: "144Hz refresh rate gaming monitor",
      price: 2100000,
      stock: 15,
    },
    {
      name: "USB-C Hub 8-in-1",
      description: "Multi-port USB-C adapter hub",
      price: 350000,
      stock: 100,
    },
    {
      name: "Bluetooth Headphones",
      description: "Over-ear noise cancelling headphones",
      price: 1200000,
      stock: 20,
    },
  ];

  for (const product of productsData) {
    const createdProduct = await prisma.product.create({
      data: product,
    });
    console.log(`Product seeded: "${createdProduct.name}" (ID: ${createdProduct.id})`);
  }

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
