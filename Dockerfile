# Stage 1: Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Install necessary runtime tools (netcat for entrypoint wait, postgresql-client for raw sql, prisma for seed/migrations)
RUN apk add --no-cache netcat-openbsd dos2unix postgresql-client && npm install -g prisma@6.2.1

# Next.js standalone outputs all compiled code and required subset of node_modules into standalone folder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/database ./database
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Fix Windows line endings for shell script compatibility and grant execution permissions
RUN dos2unix ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 3000
ENV PORT 3000

CMD ["./entrypoint.sh"]