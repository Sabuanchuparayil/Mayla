#!/usr/bin/env bash
# Start optional local services (MongoDB, Redis) via Docker for chat / full stack dev.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed."
  echo ""
  echo "Options:"
  echo "  • Install Docker Desktop, then re-run: npm run setup:services"
  echo "  • Or install MongoDB locally: brew install mongodb-community && brew services start mongodb-community"
  echo "  • Chat works without Mongo until you need messaging; auth and profiles still work."
  exit 1
fi

echo "→ Starting MongoDB (and Redis if not already running) via docker compose..."
docker compose up -d mongodb redis

echo ""
echo "→ Waiting for MongoDB..."
for _ in $(seq 1 30); do
  if docker compose exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q 1; then
    break
  fi
  sleep 1
done

echo ""
echo "✓ Services running."
echo "  MongoDB: mongodb://mayla:mongo_secret@localhost:27017/mayla_db?authSource=admin"
echo "  Redis:   redis://:redis_secret@localhost:6379"
echo ""
echo "Update .env if needed:"
echo '  MONGODB_URL="mongodb://mayla:mongo_secret@localhost:27017/mayla_db?authSource=admin"'
echo '  REDIS_URL="redis://:redis_secret@localhost:6379"'
