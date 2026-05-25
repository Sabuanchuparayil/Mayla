#!/usr/bin/env bash
# Fix known production env issues on the Hetzner server (via SSH)
set -euo pipefail

ENV_FILE="${ENV_FILE:-$(cd "$(dirname "$0")/../.." && pwd)/.env.infra}"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

SSH_HOST="${MAYLA_SSH_HOST:-204.168.235.151}"
SSH_USER="${MAYLA_SSH_USER:-root}"
REMOTE="${SSH_USER}@${SSH_HOST}"

echo "→ Updating /home/Mayla/.env on $REMOTE ..."

ssh -o BatchMode=yes "$REMOTE" "set -euo pipefail
ENV=/home/Mayla/.env
if [ ! -f \"\$ENV\" ]; then echo \"Missing \$ENV\"; exit 1; fi

python3 <<'PY'
from pathlib import Path
import re

p = Path('/home/Mayla/.env')
text = p.read_text()
match = re.search(r'^MONGODB_URL=(.*)$', text, re.M)
if match:
    url = match.group(1).strip().strip('\"')
    path_part = url.split('?', 1)[0]
    if '/mayla' not in path_part:
        base, _, qs = url.partition('?')
        url = base.rstrip('/') + '/mayla'
        if qs:
            url += '?' + qs
    if 'authSource=' not in url:
        url += ('&' if '?' in url else '?') + 'authSource=admin'
    text = re.sub(r'^MONGODB_URL=.*$', f'MONGODB_URL={url}', text, flags=re.M)
    p.write_text(text)
    print('Updated MONGODB_URL')
PY

echo '→ Recreating mayla-app container with updated env...'
docker stop mayla-app 2>/dev/null || true
docker rm mayla-app 2>/dev/null || true
docker run -d \\
  --name mayla-app \\
  --network coolify \\
  --restart unless-stopped \\
  -p 3000:3000 \\
  --env-file \"\$ENV\" \\
  -l caddy=http://204.168.235.151:3000 \\
  mayla-app

sleep 3
curl -s -o /dev/null -w 'health:%{http_code}\n' --max-time 10 http://127.0.0.1:3000/api/health || true
"

echo "✓ Production env updated and mayla-app restarted."
