#!/bin/sh
#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres_db 5432; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Applying manual raw SQL schema..."
PGPASSWORD=solutech_password psql -h postgres_db -U solutech_user -d solutech_db -f database/schema.sql

echo "Generating Prisma Client to sync..."
npx prisma generate

echo "Seeding the database..."
npx prisma db seed

echo "Starting Next.js stand-alone server..."
exec node server.js
