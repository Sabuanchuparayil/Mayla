#!/usr/bin/env bash
# Initialize local Homebrew PostgreSQL for Mayla (no Docker required).
set -euo pipefail

cd "$(dirname "$0")/.."

DB_USER="${POSTGRES_USER:-mayla}"
DB_PASS="${POSTGRES_PASSWORD:-mayla_secret}"
DB_NAME="${POSTGRES_DB:-mayla_db}"
PG_SUPERUSER="${PG_SUPERUSER:-$(whoami)}"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Created .env from .env.example"
fi

echo "→ Creating role/database (as ${PG_SUPERUSER})..."
psql -h localhost -U "$PG_SUPERUSER" -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

echo "→ Running migrations..."
npm run db:migrate:deploy

echo "→ Seeding admin user (admin@mayla.app / admin123!)..."
npm run db:seed

echo ""
echo "✓ Local database ready."
echo "  Note: PostGIS geo queries use haversine fallback without PostGIS; for full geo use Docker: npm run setup"
echo "  For chat/MongoDB: npm run setup:services (Docker) or brew install mongodb-community"
echo "  Run: npm run dev"
