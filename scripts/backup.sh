#!/bin/bash
set -e

cd "$(dirname "$0")/.."

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/asset_${TIMESTAMP}.sql.gz"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."
docker compose -f docker-compose.prod.yml exec -T database \
  pg_dump -U "${DB_USERNAME:-asset}" "${DB_DATABASE:-asset}" | gzip > "$BACKUP_FILE"

echo "Backup saved to $BACKUP_FILE"

echo "Removing backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" \( -name "asset_*.sql.gz" -o -name "alisa_*.sql.gz" \) -mtime +${KEEP_DAYS} -delete

echo "Current backups:"
ls -lh "$BACKUP_DIR"
