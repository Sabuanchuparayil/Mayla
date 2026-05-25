#!/usr/bin/env bash
# Run on the Hetzner/Coolify server (inside the coolify Docker network).
# Usage: ssh user@204.168.235.151 'cd /home/Mayla && bash scripts/migrate-on-server.sh'
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Deploying Prisma migrations..."
npm run db:migrate:deploy

echo "→ Seeding admin user..."
npm run db:seed

echo "✓ Database ready."
