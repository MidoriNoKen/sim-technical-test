# E-Commerce Platform - Next.js (App Router), Prisma, PostgreSQL & Redis

A production-ready, fully containerized e-commerce application featuring a REST API, an Admin Dashboard, and a Customer Storefront, built with Next.js (App Router, Standalone Build), Prisma, PostgreSQL, and Redis caching.

---

## 🚀 Quick Start (Local Setup)

The entire application ecosystem—including the Next.js app, PostgreSQL database, and Redis cache—is fully containerized. To run the project in a single command, execute the following from the root directory:

```bash
docker compose up --build
```

### ⚙️ What the Container Entrypoint Handles Automatically:
1. **Health Check**: The `next_app` container waits for the `postgres_db` service to be completely ready and healthy.
2. **Database Initialization**: It executes the raw PostgreSQL commands in `database/schema.sql` to construct the tables manually (satisfying the manual SQL requirement).
3. **Prisma Generation**: It runs `prisma generate` to compile and synchronize the Prisma Client types.
4. **Data Seeding**: It triggers the seeder script `npx prisma db seed` to automatically seed:
   - Exactly **1 Admin User** (credentials: `admin@solutech.id` / `password123`).
   - Exactly **1 Customer User** (credentials: `customer@solutech.id` / `password123`).
   - At least **200 Products** with realistic names, descriptions, price values, and inventory stocks.
5. **Start Production Server**: Automatically boots the Next.js production standalone server on port `3000`.

---

## 🛠️ Technology Stack

* **Core**: Next.js 16 (App Router, Standalone Mode) & Node.js 20
* **Database**: PostgreSQL 16
* **ORM**: Prisma (using strict type safety)
* **Cache**: Redis (via `ioredis` client)
* **Authentication**: JWT (JSON Web Token) with HTTP-only cookies and Bearer token fallback support
* **Validation**: Zod (for type-safe request parsing)
* **Containerization**: Docker & Docker Compose (multi-stage optimized builder)

---

## 📝 Environment Variables

The project uses `.env.example` as a template for container and local environments:

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | Next.js server port inside the container | `3000` |
| `NODE_ENV` | Mode of operation | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://solutech_user:solutech_password@postgres_db:5432/solutech_db?schema=public` |
| `REDIS_URL` | Redis server connection string | `redis://redis_cache:6379` |
| `JWT_SECRET` | Signing key for authenticating JSON Web Tokens | `super_secret_solutech_key_2026` |

---

## 📐 Technical Decisions & Assumptions

### 1. Unified Full-Stack Architecture
We maintain a strict separation of concerns across files while unifying the frontend and backend in a single Next.js application:
* **Frontend Storefront & Admin (`src/app/(customer)` & `src/app/admin`)**: Fully responsive UI built with Tailwind CSS and shadcn/ui. The root `/` path serves the Customer Storefront, while `/admin` serves the management dashboard.
* **Route Handlers (`src/app/api/...`)**: Extract parameters, validate schemas via Zod, invoke Service operations, and return standardized JSON responses. All APIs are strictly scoped under the `/api` prefix.
* **Service Layer (`src/services/...`)**: Handle business logic, orchestrate db calls, manage caching, and throw semantic exceptions.
* **Repository Layer (`src/repositories/...`)**: Expose clean data-retrieval and mutation functions communicating with the database via Prisma.

### 2. Interactive Transactions & Concurrency Safety
For order creation (`POST /api/orders`), the entire operation is wrapped in a strict **Prisma Interactive Transaction** (`prisma.$transaction`).
* Stock details and pricing are fetched and computed server-side directly from the database context within the transaction to prevent manipulation of values.
* Stock decrements are executed atomically in the database (`decrement: quantity`).
* If the stock drops below zero for any of the products in the batch, the transaction is immediately rolled back and returns a `400 Bad Request`. This guarantees that no incomplete order placements or stock leaks occur during high-concurrency requests.

### 3. Soft Delete Implementation
Products are never hard deleted from the database. When an administrator calls `DELETE /api/products/[id]`, the handler updates the `deletedAt` column with the current timestamp. All product retrieval endpoints (`GET /api/products` and `GET /api/products/[id]`) explicitly filter out records where `deletedAt` is not null, keeping user-facing catalogs updated while retaining historic order item records intact.

### 4. High-Performance Redis Caching & Invalidation
* Caching is integrated within the `GET /api/products` listing endpoint. Cache keys incorporate pagination boundaries and search filters (e.g. `products:page:<p>:limit:<l>:search:<s>`) to store response segments.
* To prevent stale catalogs, all write endpoints—including **product creation**, **updates**, **soft deletes**, and **successful order placements** (which modify inventory)—invalidate and scan-clear all matching Redis product cache keys.

---

## 📁 Postman Collection

A pre-configured Postman Collection is available at the root:
* **File**: `Solutech_Backend_Test.postman_collection.json`
* **Folders**: Includes folders for `Auth`, `Products`, and `Orders` with pre-defined request payloads and headers.
* **Auto-auth script**: The login request features a test script that automatically extracts the returned JWT token and stores it in the collection variable `{{token}}`. Subsequent protected requests automatically use this variable in their `Authorization` Bearer header.

---

## ✅ Completed Deliverables Checklist

- [x] **Zero-Config Docker Setup**: Runs Postgres, Redis, and Next.js out-of-the-box.
- [x] **Raw SQL schema parity**: `database/schema.sql` verified matching schema state.
- [x] **Seeders**: Scripts seed Admin user (`admin@solutech.id` / `password123`) and 5 core products.
- [x] **Secure Authentication**: Hashed passwords (bcrypt) and protected routes using Next.js 16 `proxy` middleware with strict `ADMIN` and `CUSTOMER` role-based access control.
- [x] **Full-Stack UI**: Integrated responsive Customer Storefront and Admin Dashboard using shadcn/ui and Tailwind CSS.
- [x] **Product CRUD & Search**: Complete CRUD endpoints, pagination filters, and case-insensitive searching.
- [x] **Order Placement Transactions**: Interactive transactions with concurrent inventory checks and rollbacks.
- [x] **Redis Cache Invalidation**: Automatic scanning cache invalidation on write events.
- [x] **100% Type Safe & Linter Passing**: Strict TypeScript implementation.

---

## ⏱️ Estimated Time Spent
* **Total Time**: Approximately **12 hours** (planning, container orchestration setup, database modeling, route handler construction, Redis integration, and validation testing).
