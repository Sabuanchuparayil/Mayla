# Mayla — Project Brief for AI Coding Assistants

## Project Overview

Mayla is a verified social discovery (dating) PWA targeting the Middle East market. Every user is selfie-verified, every photo is face-matched, and the app runs entirely as a Progressive Web App — no app store dependency.

## Live Deployment

- **URL:** https://validation-vault-maintains-calcium.trycloudflare.com
- **Server:** Hetzner CPX32 (4 vCPU, 8GB RAM, 160GB SSD), Helsinki
- **Server IP:** 204.168.235.151
- **OS:** Ubuntu 26.04 LTS
- **Container Runtime:** Docker (managed via Coolify v4.1.0)
- **Reverse Proxy:** Cloudflare Tunnel (cloudflared as systemd service)

## Tech Stack

### Frontend

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Real-time:** Socket.IO Client
- **Runtime:** Custom Node.js server (`server.ts` compiled via `tsx`)

### Backend

- **Runtime:** Node.js 20 (Alpine) via Docker
- **API:** Next.js API Routes (all routes use `export const dynamic = 'force-dynamic'`)
- **Authentication:** JWT (`jose`) — access tokens (15 min) + refresh tokens (30 days)
- **OTP:** Redis-backed, 6-digit, 5-minute TTL (hardcoded to `123456` for testing)
- **Validation:** Zod
- **File Upload:** AWS S3 (Bahrain region `me-south-1`)
- **Face Verification:** AWS Rekognition (`MOCK_VERIFICATION=true` in dev)
- **Payments:** Stripe (test mode)

### Databases

**IMPORTANT: We use PostGIS, NOT plain PostgreSQL.**

| Database | Image | Purpose |
|----------|-------|---------|
| PostGIS | `postgis/postgis:17-3.5-alpine` | Users, profiles, matches, payments, geo-queries |
| Redis 7 | `redis:7` | Sessions, cache, OTP, rate limiting, BullMQ |
| MongoDB 7 | `mongo:7` | Chat messages (high write volume) |

### PostGIS Details

- **ORM:** Prisma with `@prisma/adapter-pg` (pg Pool)
- **Geo Extension:** PostGIS — `geography(Point,4326)` type
- **Geo Queries:** `ST_DWithin`, `ST_DDistance` for proximity
- **Schema:** `prisma/schema.prisma`
- **Migration:** `npx prisma migrate deploy`
- **Client:** `npx prisma generate` (output gitignored, generated at build)
- **Proxy Pattern:** `db` export uses Proxy to lazy-initialize PrismaClient

### Redis Details

- **Client:** ioredis with `lazyConnect: true`
- **Connection:** `REDIS_URL` env var
- **Used for:** OTP, rate limiting, session cache, BullMQ, presence

### MongoDB Details

- **Client:** Mongoose
- **Connection:** `MONGODB_URL` (falls back to `MONGODB_URI`)
- **Used for:** Chat messages only (`Message` model)
- **Pattern:** `connectMongoDB()` — lazy, called only when needed

## Project Structure

```
mayla/
├── prisma/                    # PostGIS schema & migrations
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, verify pages
│   │   ├── (app)/             # Authenticated pages (discover, nearby, chat)
│   │   ├── (onboarding)/      # Onboarding flow
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes (all force-dynamic)
│   │   └── actions/           # Server actions
│   ├── components/
│   ├── lib/                   # db, redis, mongodb, auth, otp, rate-limit, stripe, queues, socket-io
│   ├── socket/                # WebSocket handlers
│   ├── models/                # Mongoose models
│   └── hooks/
├── server.ts                  # Custom Node.js server (Next.js + Socket.IO)
├── Dockerfile
└── docker-compose.yml
```

## Build & Deploy

- Multi-stage Docker: deps → builder → runner
- Dummy env vars during build (no DB connections at build time)
- `npx prisma generate` during build
- `CMD ["npx", "tsx", "server.ts"]`
- All API routes: `export const dynamic = 'force-dynamic'`
- Docker network: `coolify` — app joins this network for internal DB hostnames

## Critical Rules

1. **Database is PostGIS** — use `postgis/postgis:17-3.5-alpine`. Geo uses PostGIS functions.
2. **Lazy DB clients** — Proxy for Prisma, `lazyConnect` for Redis, function call for MongoDB.
3. **All API routes** must include `export const dynamic = 'force-dynamic'` as the first line.
4. **Cookies:** `secure: false` during HTTP testing; `secure: true` in production HTTPS.
5. **Server uses `tsx`** — no separate tsc step for `server.ts`.
6. **OTP hardcoded to `123456`** for testing — remove before production.

See also `@AGENTS.md` for Next.js version-specific notes.
