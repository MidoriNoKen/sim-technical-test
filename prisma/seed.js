/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

async function main() {
  console.log("Start seeding...");

  // 1. Clean existing records in dependency-safe order
  console.log("Clearing existing database records...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  console.log("Database cleared.");

  // Clear Redis product cache
  try {
    console.log("Clearing Redis cache...");
    let cursor = "0";
    let allKeys = [];
    do {
      const reply = await redis.scan(cursor, "MATCH", "products:*", "COUNT", 100);
      cursor = reply[0];
      allKeys = allKeys.concat(reply[1]);
    } while (cursor !== "0");

    if (allKeys.length > 0) {
      await redis.del(...allKeys);
      console.log(`Redis cache cleared (${allKeys.length} keys)`);
    } else {
      console.log("No Redis cache keys to clear.");
    }
  } catch (error) {
    console.error("Failed to clear Redis cache:", error);
  }

  // 2. Seed Admin User
  console.log("Seeding Admin user...");
  const hashedPassword = "$2b$10$VDHRY8rjLDyRXm82AOgl2O5wLJAwFenpvpcqA1IVCXF55i.MOamfe";
  const admin = await prisma.user.upsert({
    where: { email: "admin@solutech.id" },
    update: {},
    create: {
      email: "admin@solutech.id",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin user seeded:", admin.email);

  const customer = await prisma.user.upsert({
    where: { email: "customer@solutech.id" },
    update: {},
    create: {
      email: "customer@solutech.id",
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });
  console.log("Customer user seeded:", customer.email);

  // 3. Seed Products
  console.log("Seeding products...");
  const adjectives = ["Pro", "Ultra", "Slim", "Wireless", "Mechanical", "Curved", "Portable", "Ergonomic", "Smart", "Compact", "Heavy Duty", "Premium", "High-Speed", "RGB", "Silent"];
  const categories = ["Mouse", "Keyboard", "Monitor", "USB Hub", "Headphones", "USB-C Cable", "Power Adapter", "Fast Charger", "Bluetooth Speaker", "Laptop Stand", "Desk Mat", "Webcam", "Microphone", "SSD Enclosure", "Graphic Tablet"];
  const brands = ["Logitech", "Razer", "Asus", "Sony", "Anker", "Ugreen", "Baseus", "Corsair", "Keychron", "Dell", "HP", "Samsung"];

  const productsData = [];
  const generatedNames = new Set();

  while (productsData.length < 200) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const name = `${brand} ${adj} ${cat}`;

    if (!generatedNames.has(name)) {
      generatedNames.add(name);
      const price = (Math.floor(Math.random() * 95) + 5) * 50000;
      const stock = Math.floor(Math.random() * 140) + 10;
      const description = `Premium quality ${adj.toLowerCase()} ${cat.toLowerCase()} manufactured by ${brand}. Perfect for professional and gaming setups.`;

      productsData.push({ name, description, price, stock });
    }
  }

  await prisma.product.createMany({
    data: productsData,
  });
  console.log(`Seeded ${productsData.length} products successfully.`);

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    try {
      await redis.quit();
    } catch (err) {
      console.error("Error disconnecting Redis:", err);
    }
  });
