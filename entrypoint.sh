#!/bin/sh
set -e

POSTGRES_HOST="${POSTGRES_HOST:-postgres_db}"
POSTGRES_USER="${POSTGRES_USER:-solutech_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-solutech_password}"
POSTGRES_DB="${POSTGRES_DB:-solutech_db}"

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD="$POSTGRES_PASSWORD" pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Applying manual raw SQL schema..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f database/schema.sql

echo "Running Prisma migrations (if any)..."
npx prisma migrate deploy 2>/dev/null || true

echo "Seeding the database..."
npx prisma db seed 2>/dev/null || true

echo "Starting Next.js stand-alone server..."
exec node server.js
