# ============================================================
# Stage 1: Dependencies
# Install only production-locked dependencies
# ============================================================
FROM node:20-alpine AS deps
# libc6-compat is required for native modules on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# Use ci for reproducible installs; omit dev deps for leaner cache layer
RUN npm ci --omit=dev

# ============================================================
# Stage 2: Builder
# Build the Next.js app with ALL deps (including devDeps for build tools)
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy full deps (including devDeps needed by Next.js build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source after package install to maximize layer cache reuse
COPY . .

# Generate Prisma client before build
RUN npx prisma generate

# Build Next.js in standalone mode (output: 'standalone' in next.config.ts)
RUN npm run build

# ============================================================
# Stage 3: Production Runner (minimal, secure, non-root)
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install only essential runtime tools
# - netcat-openbsd: health-wait logic in entrypoint
# - postgresql-client: raw SQL schema execution
# - prisma CLI: db seed + migrations at startup
RUN apk add --no-cache postgresql-client dos2unix \
    && npm install -g prisma@6.2.1 --ignore-scripts

# Set production env
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user and group for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy Next.js standalone build (already bundles required node_modules subset)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and seed data
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/database ./database

# Copy entrypoint and fix permissions before dropping to non-root
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN dos2unix ./entrypoint.sh && chmod +x ./entrypoint.sh

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]