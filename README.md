# Solutech E-Commerce Platform - Next.js, Prisma, PostgreSQL & Redis

Sebuah platform e-commerce *production-ready* yang mencakup REST API, Admin Dashboard, dan Customer Storefront. Proyek ini dibangun menggunakan Next.js (App Router), Prisma ORM, PostgreSQL, dan Redis *caching* untuk memenuhi persyaratan **Solutech Technical Test (Backend Developer)**.

---

## 📖 Penjelasan Singkat
Proyek ini mengadopsi arsitektur Full-Stack terpadu di mana frontend dan backend berada di dalam satu aplikasi Next.js:
- **Backend (REST API):** Dibangun dengan prinsip RESTful, menggunakan validasi ketat (Zod), keamanan autentikasi JWT (HTTP-only cookies & Bearer token fallback), manipulasi transaksi order secara aman dengan *Prisma Interactive Transaction*, dan integrasi *cache* via Redis.
- **Frontend (UI):** Menggunakan Tailwind CSS dan `shadcn/ui` untuk membangun antarmuka modern. Memiliki dua sisi: Admin Dashboard untuk manajemen data, dan Customer Storefront untuk pengalaman berbelanja.

---

## 📂 Struktur Proyek & Rute
Struktur *repository* ini dirancang menggunakan *Layered Architecture* yang sangat jelas dan terpisah:
- `database/schema.sql` : Berisi skema *raw SQL* perintah pembuatan seluruh tabel (memenuhi requirement pembuatan table secara manual).
- `prisma/` : Konfigurasi model ORM dan skrip data awal (Seeder di `seed.js`).
- `src/app/api/` : **Route Handlers** (Controller API). Seluruh endpoint REST API diakses melalui path `/api/...` dan mengembalikan standar JSON.
- `src/app/(customer)/` : **Frontend Customer Storefront**. Merupakan halaman publik / pembeli yang diakses pada rute root `/`.
- `src/app/admin/` : **Frontend Admin Dashboard**. Merupakan halaman manajemen yang diakses pada rute `/admin`.
- `src/services/` : **Service Layer** menangani seluruh *business logic*, validasi kondisi stok, dan mekanisme Redis *caching*.
- `src/repositories/` : **Repository Layer** menyediakan abstraksi fungsi CRUD langsung ke database via Prisma Client.
- `src/validations/` : Terpusatnya berbagai skema **Zod** untuk memvalidasi *request body* dan *query parameters* dari API.

---

## 🚀 Cara Setup dan Menjalankan Proyek

Sebelum mulai, Anda perlu menyalin konfigurasi environment. Duplikat file `.env.example` lalu ubah namanya menjadi `.env`.
Isi dasar dari `.env` mencakup kredensial database, Redis, dan JWT:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://solutech_user:solutech_password@localhost:5432/solutech_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super_secret_solutech_key_2026"
```

Proyek ini dapat diakses melalui website berikut https://ecommerce.diata.my.id. Selain itu, proyek ini dirancang agar sangat fleksibel dan dapat dijalankan dengan dua cara berikut:

### Cara 1: Menjalankan via Docker (Direkomendasikan & Sangat Instan)
Seluruh lingkungan sistem sudah terbungkus rapi (PostgreSQL, Redis, dan Next.js). Anda tidak perlu menginstall database secara manual.
Dari dalam *root folder* proyek, cukup jalankan:
```bash
docker compose up -d --build
```
**Apa yang terjadi di balik layar (Entrypoint Otomatis)?**
1. Docker akan menunggu hingga *container* PostgreSQL siap.
2. Otomatis mengeksekusi `database/schema.sql` untuk membuat tabel database.
3. Otomatis menjalankan `npx prisma generate` untuk *type safety*.
4. Otomatis memanggil *seeder* (`npx prisma db seed`) yang menghasilkan:
   - 1 Akun Admin (`admin@solutech.id` / `password123`).
   - 1 Akun Customer (`customer@solutech.id` / `password123`).
   - 200 Produk dummy siap pakai (dengan harga Rupiah dan stok acak).
5. Next.js production mode (standalone) menyala di `http://localhost:3000`.

### Cara 2: Menjalankan secara Lokal (Tanpa Docker)
Jika ingin menjalankan dari PC lokal, pastikan **Node.js (v20+)**, **PostgreSQL**, dan **Redis Server** telah ter-install dan menyala.
1. Sesuaikan variabel `DATABASE_URL` dan `REDIS_URL` di file `.env` ke kredensial PostgreSQL/Redis lokal Anda.
2. Install seluruh dependensi proyek:
   ```bash
   npm install
   ```
3. Buat seluruh tabel secara manual ke dalam PostgreSQL menggunakan skrip SQL yang disediakan. Contoh menggunakan CLI `psql`:
   ```bash
   psql -U username_postgres -d nama_database_anda -f database/schema.sql
   ```
4. Generate Prisma Client agar sinkron dengan database:
   ```bash
   npx prisma generate
   ```
5. Masukkan data *seeding* (user dan 200 produk):
   ```bash
   npx prisma db seed
   ```
6. Jalankan proyek melalui *Development Server*:
   ```bash
   npm run dev
   ```
   Aplikasi dan API dapat diakses di `http://localhost:3000`.

---

## 📝 Proses Pengerjaan via GitHub Issues
Proses penyelesaian technical test ini dirancang sedemikian rupa untuk meniru lingkungan kolaborasi *software engineering* dunia nyata.
Saya memecah kompleksitas proyek menggunakan **GitHub Issues** (Task Breakdown), seperti:
1. Setup infrastruktur, Docker, dan CI.
2. Perancangan skema Database (SQL & Prisma).
3. Pembuatan API Layer (Service & Repository).
4. Integrasi Redis Caching dan Soft Deletes.
5. Pengembangan UI untuk Admin Dashboard.
6. Pengembangan UI Customer Storefront & Checkout Flow.

Saya mengerjakan proyek ini dengan cara membuat *branch* terpisah (misal: `feat/product-management`) untuk masing-masing **Issue**. Setelah kode di dalam *branch* tersebut dites dan berfungsi, saya membuka *Pull Request* dan melakukan *merge* kode ke *branch* utama (`main`). 
**History commit progresif** di *repository* ini adalah representasi dari runtutan proses berpikir analitis saya setiap tahapan pengerjaan.

---

## ⚙️ Keputusan Teknis, Asumsi & Trade-Offs

Saya memahami bahwa kesempurnaan dikalahkan oleh efisiensi, oleh karena itu ada beberapa keputusan (*trade-off*) yang diambil:

1. **Kenapa Membangun Full-Stack (Bukan Hanya Backend)?**
   *Requirement* tes menyatakan bahwa frontend sifatnya opsional untuk Admin. Namun, saya memutuskan untuk membangun UI sepenuhnya (Admin Dashboard & Customer E-Commerce) menggunakan Next.js App Router agar tim penilai bisa langsung **mensimulasikan alur penggunaan E-commerce dengan mulus** tanpa harus meraba-raba melalui Postman (meski koleksi Postman tetap disediakan secara lengkap menggunakan Collection Postman maupun Swagger di `/api-docs`). Hal ini juga membuktikan fleksibilitas sistem yang dibangun.
2. **Interactive Transaction pada Order (`prisma.$transaction`):**
   Ini adalah inti logika bisnis (kebenaran *stok* & *transaction*). Saat pembuatan order, pengecekan ketersediaan stok, kalkulasi total harga, dan pemotongan inventaris, **seluruhnya dibungkus dalam transaksi database di dalam database**. Apabila pada detik yang sama stok tiba-tiba kurang (*concurrency/race condition*), transaksi otomatis melakukan *rollback* total. Ini menjamin keamanan fatal pada E-commerce.
3. **Konsep Soft Delete Produk:**
   Produk tidak pernah dihapus permanen. Endpoint `DELETE` hanya mengisi timestamp pada kolom `deletedAt`. Tujuannya agar histori pembelian (Order Items) yang merujuk pada produk tersebut tidak menjadi kosong / *error*. Endpoint *read* secara otomatis memfilter *record* ini, namun database admin tetap utuh.
4. **Keamanan Autentikasi JWT Fleksibel:**
   Respons API memberikan JWT dalam bentuk **HTTP-only cookie** untuk keamanan frontend anti-XSS yang terproteksi Next.js Middleware. Namun, rute API juga dilakukan via **Authorization Bearer Token**, agar penguji dapat dengan mudah mengetes API *protected* melalui Postman.
5. **Jalan Pintas Keterbatasan Waktu (*Trade-offs*):**
   - Proses invalidasi *cache* Redis masih menggunakan pola `SCAN` lalu `DEL` untuk menghapus semua keys `products:*` setiap kali terjadi aksi *write* (seperti order berhasil). Dalam skala masif jutaan key, operasi `SCAN` mungkin memberi sedikit *overhead*. Karena skala ini dibuat ringkas, jalan ini diambil untuk efisiensi *development* yang stabil.
   - Manajemen keranjang (*Shopping Cart*) pada UI dikelola via *React State/Context* di sisi lokal *(client-side)* sebelum ditembak menjadi Order. Di e-commerce raksasa, cart biasanya disimpan ke *persistent state* seperti Redis agar konsisten lintas-*device*. Saya melewatkannya karena di luar porsi tes.
  
---

## 🤖 Pemanfaatan AI

Pengerjaan yang dilakukan pada proyek ini memanfaatkan AI (Gemini) untuk membantu proses berpikir dan penyelesaian tugas repetitif secepat mungkin. Saya memiliki alur kerja seoarang Project Manager, Backend Developer, Frontend Developer, DevOps, dan QA Tester, tetapi proses pengerjaan ideal tiap posisi memerlukan waktu yang cukup banyak sehingga saya memerlukan bantuan AI untuk mempercepat pengerjaan dengan pengawasan sedetail mungkin. Menurut saya, era saat ini dan beberapa dekade berikutnya, AI akan dimanfaatkan sepenuhnya dalam membantu developer menyelesaikan pembangunan aplikasi secepat mungkin. Berdasarkan pengalaman saya, ini sangat dibutuhkan oleh start-up teknologi untuk mengejar ketertinggalan layanan bisnisnya sesingkat mungkin untuk mendapatkan benefit sebaik mungkin. Meskipun begitu, pemanfaatan AI perlu diperhatikan lebih lanjut, terutama dalam sisi detail dan keamanan.

---

## ✅ Daftar Fitur Terlampir (Selesai/Belum)

**Requirement Wajib (Wajib & Selesai):**
- [x] Tech Stack Terpenuhi: Next.js + TS, PostgreSQL, Prisma, Layered Architecture.
- [x] Input Validation (via Zod).
- [x] Autentikasi JWT (Login) & Proteksi Rute (Role-Based Access).
- [x] Product API (CRUD, Soft Delete, Pagination, Search Name).
- [x] Order API (Submit Order List + Quantity, Transaksi Stok, List User Orders).
- [x] Error Handling konsisten via kustom class `AppError`.
- [x] Skrip SQL untuk *Create Table* & *Seeder* Data awal di `seed.js`.
- [x] File `.env.example` dan *Postman Collection*.

**Requirement Nilai Tambah / Opsional (Semua Diselesaikan):**
- [x] **Redis Caching**: Endpoint `GET /api/products` di-cache menggunakan Redis untuk respons super kilat.
- [x] **Unit Testing**: Suite testing terpisah via *Vitest* (mencakup service product, order, auth).
- [x] **Rate Limiting & Logging**: Terhindar dari *brute-force request*.
- [x] **Frontend Sederhana (Over-delivered)**: Dashboard Admin komprehensif **serta** Frontend E-Commerce untuk Customer siap pakai berbalut *Tailwind CSS*.

---

## ⏱️ Estimasi Waktu Pengerjaan
Pengerjaan keseluruhan modul, infrastruktur docker, arsitektur REST, *caching*, desain UI Frontend penuh, dan pengujian memakan estimasi waktu kumulatif sekitar **16 - 20 Jam kerja**.

---
*Dibuat & Dikembangkan untuk Solutech Technical Test.*
