#!/usr/bin/env bash
# Backup do PostgreSQL em formato custom (permite restore seletivo).
# Uso: ./scripts/backup-db.sh [diretório de destino]
# Restore documentado em docs/operations.md — backup sem restore testado não conta.
set -euo pipefail

DEST_DIR="${1:-./var/backups}"
mkdir -p "$DEST_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
DB_URL="${DATABASE_URL:-$(grep '^DATABASE_URL=' .env | cut -d= -f2-)}"

FILE="$DEST_DIR/simdeploy-$STAMP.dump"
pg_dump --format=custom --file="$FILE" "$DB_URL"
echo "Backup criado: $FILE ($(du -h "$FILE" | cut -f1))"
