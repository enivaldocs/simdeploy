#!/bin/bash
# Provisionamento da VPS de produção do SimDeploy (Ubuntu 24.04).
# Idempotente: pode rodar de novo com segurança.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "== Pacotes base =="
apt-get update -y
apt-get install -y curl git ca-certificates gnupg postgresql postgresql-contrib

echo "== Node 22 =="
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
npm i -g pnpm@10 >/dev/null

echo "== Caddy =="
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y && apt-get install -y caddy
fi

echo "== PostgreSQL: role e database =="
DB_PASS_FILE=/root/.simdeploy-db-pass
if [[ ! -f "$DB_PASS_FILE" ]]; then
  openssl rand -hex 24 > "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
fi
DB_PASS="$(cat "$DB_PASS_FILE")"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='simdeploy'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER simdeploy WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -c "ALTER USER simdeploy WITH PASSWORD '${DB_PASS}';" >/dev/null
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='simdeploy'" | grep -q 1 \
  || sudo -u postgres createdb -O simdeploy simdeploy

echo "== .env de produção (secrets gerados AQUI, nunca copiados do dev) =="
APP_DIR=/opt/simdeploy
mkdir -p "$APP_DIR"
ENV_FILE="$APP_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" << EOF
DATABASE_URL=postgresql://simdeploy:${DB_PASS}@localhost:5432/simdeploy
APP_URL=https://simdeploy.com
AUTH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 24)
ADMIN_EMAILS=yesmonetize.enivaldo@gmail.com
NODE_ENV=production
EOF
  chmod 600 "$ENV_FILE"
  echo ".env criado (Stripe/GitHub entram depois via deploy/secrets)"
else
  echo ".env já existe — preservado"
fi

echo "== Firewall =="
if command -v ufw >/dev/null; then
  ufw allow 22/tcp >/dev/null || true
  ufw allow 80/tcp >/dev/null || true
  ufw allow 443/tcp >/dev/null || true
  yes | ufw enable >/dev/null 2>&1 || true
fi

echo "== systemd unit =="
cp "$APP_DIR/repo/deploy/simdeploy.service" /etc/systemd/system/simdeploy.service
systemctl daemon-reload
systemctl enable simdeploy >/dev/null

echo "== Caddy config =="
# VPS compartilhada: o deploy/Caddyfile já traz o import de /etc/caddy/sites/*,
# então regravar aqui preserva os blocos de outros apps (SuaVPN etc.).
mkdir -p /etc/caddy/sites
cp "$APP_DIR/repo/deploy/Caddyfile" /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl enable caddy >/dev/null

echo "== Cron dos background jobs (a cada 15min) =="
CRON_SECRET=$(grep '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2)
cat > /etc/cron.d/simdeploy-jobs << EOF
*/15 * * * * root curl -s -X POST -H "Authorization: Bearer ${CRON_SECRET}" http://localhost:3000/api/jobs/run > /var/log/simdeploy-jobs.log 2>&1
EOF

echo "Provision OK"
