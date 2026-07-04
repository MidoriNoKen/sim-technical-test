#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres_db 5432; do
  sleep 1
done
echo "PostgreSQL is ready."

npx prisma generate
npx prisma db push --accept-data-loss

exec node server.js
