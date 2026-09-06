#!/bin/bash
# Deploy do SimDeploy para a VPS de produção (roda na SUA máquina).
# Uso: ./deploy/deploy-production.sh [host]
set -euo pipefail

HOST="${1:-root@2.25.174.154}"
KEY="${SIMDEPLOY_SSH_KEY:-$HOME/.ssh/simdeploy_prod}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SSH=(ssh -i "$KEY" -o BatchMode=yes "$HOST")

echo "== Sincronizando código =="
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .turbo --exclude var \
  --exclude .git --exclude .env --exclude "*.log" --exclude dist \
  -e "ssh -i $KEY" "$REPO_DIR/" "$HOST":/opt/simdeploy/repo/

echo "== Build e migração na VPS =="
"${SSH[@]}" bash -s << 'REMOTE'
set -euo pipefail
cd /opt/simdeploy/repo
ln -sf /opt/simdeploy/.env .env
ln -sf /opt/simdeploy/.env apps/dashboard/.env
export PATH="/usr/bin:$PATH"
pnpm install --frozen-lockfile=false 2>&1 | tail -2
pnpm --filter @simdeploy/db exec dotenv -e /opt/simdeploy/.env -- prisma migrate deploy 2>&1 | tail -2
pnpm --filter @simdeploy/db exec dotenv -e /opt/simdeploy/.env -- prisma generate >/dev/null
pnpm db:seed 2>&1 | tail -3
pnpm --filter @simdeploy/dashboard build 2>&1 | tail -5
systemctl restart simdeploy
systemctl restart caddy
sleep 3
systemctl is-active simdeploy caddy
curl -s -o /dev/null -w "local health: %{http_code}\n" http://127.0.0.1:3000/
REMOTE

echo "Deploy OK"
