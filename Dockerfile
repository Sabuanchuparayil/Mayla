# ─── Base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
# libc6-compat is needed by some native deps (sharp, prisma) on alpine
RUN apk add --no-cache libc6-compat

# ─── Dependencies ─────────────────────────────────────────────────────────────
# No lockfile is committed, so use `npm install`. Full deps are required
# because the build step (`next build`) needs the dev toolchain.
FROM base AS deps
COPY package.json ./
RUN npm install

# ─── Builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy connection strings so neither `prisma generate` nor `next build`
# attempts to reach a real database during the image build.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV REDIS_URL="redis://localhost:6379"
ENV MONGODB_URL="mongodb://localhost:27017/build"
ENV STRIPE_SECRET_KEY="sk_test_dummy"
ENV STRIPE_WEBHOOK_SECRET="whsec_dummy"
ENV JWT_SECRET="dummy_build_secret"
ENV NEXT_TELEMETRY_DISABLED=1

# The Prisma client is gitignored, so generate it fresh inside the image.
RUN npx prisma generate
RUN npm run build

# ─── Runner ───────────────────────────────────────────────────────────────────
# Runtime executes the custom Socket.IO server directly from TypeScript via tsx,
# so the src/ tree and tsconfig (for the "@/*" path alias) must ship in the image.
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.server.json ./tsconfig.server.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
