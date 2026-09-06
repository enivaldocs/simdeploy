#!/usr/bin/env bash
# Publica os pacotes públicos no npm. Requer login npm (npm login) OU
# um token de automação em ~/.npmrc / NPM_TOKEN. Rode na sua máquina.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! npm whoami >/dev/null 2>&1; then
  echo "Não autenticado no npm. Rode 'npm login' primeiro (ou configure NPM_TOKEN)." >&2
  exit 1
fi
echo "npm user: $(npm whoami)"

echo "== build =="
pnpm --filter simdeploy build
pnpm --filter @simdeploy/mcp-server build

echo "== publish simdeploy =="
( cd packages/cli && npm publish )

echo "== publish simdeploy-mcp =="
( cd packages/mcp-server && npm publish )

echo "OK — npm i -g simdeploy && npm i -g simdeploy-mcp já funcionam."
