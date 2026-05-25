#!/usr/bin/env bash
# Verify Mayla infrastructure via hcloud, Coolify CLI, and SSH
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.infra}"
PASS=0
FAIL=0
SKIP=0
WARN=0

pass() { echo "✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "❌ $1"; FAIL=$((FAIL + 1)); }
skip() { echo "⏭️  $1"; SKIP=$((SKIP + 1)); }
warn() { echo "⚠️  $1"; WARN=$((WARN + 1)); }

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

SSH_HOST="${MAYLA_SSH_HOST:-204.168.235.151}"
SSH_USER="${MAYLA_SSH_USER:-root}"
SERVER_ID="${HCLOUD_SERVER_ID:-132875183}"

echo "========================================"
echo "  MAYLA INFRASTRUCTURE VERIFICATION"
echo "  $(date)"
echo "========================================"

echo ""
echo "--- Hetzner (hcloud) ---"
if command -v hcloud >/dev/null 2>&1 && hcloud context list -o noheader 2>/dev/null | grep -q .; then
  if hcloud server describe "$SERVER_ID" -o format='{{.Name}} {{.Status}} {{.PublicNet.IPv4.IP}} {{.ServerType.Name}} {{.Datacenter.Name}}' 2>/dev/null; then
    pass "hcloud server $SERVER_ID reachable"
  else
    fail "hcloud could not describe server $SERVER_ID"
  fi
  hcloud server list -o columns=id,name,status,ipv4,datacenter 2>/dev/null || true
else
  skip "hcloud not configured — add HCLOUD_TOKEN to .env.infra and run npm run infra:setup-cli"
fi

echo ""
echo "--- Coolify ---"
if command -v coolify >/dev/null 2>&1; then
  if coolify context verify >/dev/null 2>&1; then
    pass "Coolify API connected ($(coolify context version 2>/dev/null || echo unknown))"
    coolify project list 2>/dev/null || true
    echo ""
    coolify resource list 2>/dev/null || true
    UNHEALTHY=$(coolify resource list --format json 2>/dev/null | python3 -c "
import json,sys
data=json.load(sys.stdin)
bad=[r for r in data if 'unhealthy' in r.get('status','') or 'exited' in r.get('status','')]
print(len(bad))
" 2>/dev/null || echo 0)
    if [ "${UNHEALTHY:-0}" = "0" ]; then
      pass "All Coolify resources healthy"
    else
      warn "$UNHEALTHY unhealthy Coolify resource(s) — run: coolify resource list"
    fi
  else
    fail "Coolify context verify failed — enable API in Coolify UI and check COOLIFY_TOKEN"
  fi
else
  skip "coolify CLI not installed"
fi

echo ""
echo "--- Server SSH (${SSH_USER}@${SSH_HOST}) ---"
if ssh -o BatchMode=yes -o ConnectTimeout=8 "${SSH_USER}@${SSH_HOST}" 'set -e
echo "hostname: $(hostname)"
docker ps --format "table {{.Names}}\t{{.Status}}" | head -12
if docker inspect mayla-app --format "{{range \$k,\$v := .NetworkSettings.Networks}}{{printf \"mayla-app network: %s\n\" \$k}}{{end}}" 2>/dev/null | grep -q coolify; then
  echo "mayla-app: on coolify network"
else
  echo "mayla-app: NOT on coolify network"
  exit 2
fi
curl -s -o /dev/null -w "mayla health HTTP:%{http_code}\n" --max-time 5 http://127.0.0.1:3000/api/health || echo "mayla health: unreachable"
curl -s -o /dev/null -w "coolify UI HTTP:%{http_code}\n" --max-time 5 http://127.0.0.1:8000/api/v1/health || true
' 2>/dev/null; then
  pass "SSH checks passed"
else
  fail "SSH checks failed (key, host, or container layout)"
fi

echo ""
echo "--- Production env warnings ---"
if ssh -o BatchMode=yes -o ConnectTimeout=8 "${SSH_USER}@${SSH_HOST}" 'grep -E "^JWT_SECRET=|^MONGODB_URL=" /home/Mayla/.env 2>/dev/null' 2>/dev/null | sed 's/:[^:@]*@/:***@/g'; then
  if ssh -o BatchMode=yes "${SSH_USER}@${SSH_HOST}" 'grep -q "change_this" /home/Mayla/.env 2>/dev/null'; then
    warn "Production JWT secrets still use placeholder values — rotate before launch"
  fi
  if ssh -o BatchMode=yes "${SSH_USER}@${SSH_HOST}" 'grep "MONGODB_URL" /home/Mayla/.env | grep -qv "/mayla"'; then
    warn "MONGODB_URL missing database name /mayla — run npm run infra:fix-prod-env"
  else
    pass "MONGODB_URL includes database path"
  fi
else
  skip "Could not read /home/Mayla/.env on server"
fi

echo ""
echo "========================================"
echo "  RESULTS: $PASS passed | $FAIL failed | $WARN warnings | $SKIP skipped"
echo "========================================"

[ "$FAIL" -eq 0 ]
