#!/usr/bin/env bash
# Configure hcloud + coolify CLI contexts from .env.infra
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.infra}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  echo "  cp .env.infra.example .env.infra"
  echo "  Add HCLOUD_TOKEN and COOLIFY_TOKEN, then re-run."
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Install $1 first."
    exit 1
  fi
}

need_cmd hcloud
need_cmd coolify

echo "→ Hetzner Cloud CLI (hcloud)"
if [ -n "${HCLOUD_TOKEN:-}" ]; then
  export HCLOUD_TOKEN
  CTX="${HCLOUD_CONTEXT:-mayla}"
  if hcloud context list -o noheader 2>/dev/null | awk '{print $2}' | grep -qx "$CTX"; then
    hcloud context use "$CTX" >/dev/null
    echo "  Using existing context: $CTX"
  else
    hcloud context create "$CTX" --token-from-env
  fi
  hcloud server list -o columns=id,name,status,ipv4,datacenter
else
  echo "  SKIP — set HCLOUD_TOKEN in .env.infra"
fi

echo ""
echo "→ Coolify CLI"
if [ -n "${COOLIFY_HOST:-}" ] && [ -n "${COOLIFY_TOKEN:-}" ]; then
  CTX="${COOLIFY_CONTEXT:-mayla-production}"
  if coolify context list 2>/dev/null | grep -q "$CTX"; then
    coolify context use "$CTX" >/dev/null
    coolify context set-token "$COOLIFY_TOKEN" >/dev/null 2>&1 || true
    echo "  Updated context: $CTX"
  else
    coolify context add "$CTX" "$COOLIFY_HOST" "$COOLIFY_TOKEN"
    coolify context use "$CTX"
  fi
  coolify context verify
else
  echo "  SKIP — set COOLIFY_HOST and COOLIFY_TOKEN in .env.infra"
fi

echo ""
echo "✓ CLI setup complete. Run: npm run infra:verify"
