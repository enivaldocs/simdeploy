#!/usr/bin/env bash
# Deployment safety: roda ANTES de qualquer deploy de produção.
# Falha em qualquer etapa aborta o deploy.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== lint =="
pnpm lint

echo "== typecheck =="
pnpm typecheck

echo "== tests =="
pnpm test

echo "== build =="
pnpm build

echo "== migration validation (diff contra o schema) =="
# Migração pendente ou drift entre schema e migrations aborta aqui.
pnpm --filter @autocloud/db exec dotenv -e ../../.env -- prisma migrate status

echo ""
echo "Preflight OK — seguro para deploy."
