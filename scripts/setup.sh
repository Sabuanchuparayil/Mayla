#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "✗ Docker is required but not installed."
  echo "  For Mac without Docker, run: npm run setup:local"
  echo "  Or install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if [ ! -f .env ]; then
  echo "→ Creating .env from .env.example..."
  cp .env.example .env
fi

echo "→ Starting infrastructure (PostGIS, Redis, MongoDB)..."
docker compose up -d

echo "→ Waiting for PostGIS..."
until docker compose exec -T postgres pg_isready -U mayla -d mayla_db >/dev/null 2>&1; do
  sleep 1
done

echo "→ Running database migrations..."
npm run db:migrate:deploy

echo "→ Seeding admin user (admin@mayla.app / admin123!)..."
npm run db:seed

echo ""
echo "✓ Setup complete. Run: npm run dev"
echo "  Health: http://localhost:3000/api/health"
echo "  Tests:  npm run test:flows"
