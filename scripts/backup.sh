#!/usr/bin/env bash
# ==============================================================================
# VIDEOJET MAROC INDUSTRIAL PLATFORM - AUTOMATED DATABASE BACKUP SCRIPT
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${POSTGRES_DB:-videojet_db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "================================================================="
echo " [VIDEOJET MAROC] Démarrage de la sauvegarde PostgreSQL..."
echo " Base de données : ${DB_NAME}"
echo " Destination     : ${BACKUP_FILE}"
echo "================================================================="

# Check if running with Docker container or local pg_dump
if docker ps --format '{{.Names}}' | grep -q "^videojet_postgres$"; then
  echo "=> Détection du conteneur Docker 'videojet_postgres'..."
  docker exec -t videojet_postgres pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
  echo "=> Utilisation de pg_dump en local..."
  PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
fi

BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "=> Sauvegarde terminée avec succès ! Taille : ${BACKUP_SIZE}"

# Purge backups older than RETENTION_DAYS
echo "=> Nettoyage des sauvegardes datant de plus de ${RETENTION_DAYS} jours..."
find "${BACKUP_DIR}" -type f -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "================================================================="
echo " [OK] Procédure de sauvegarde terminée."
echo " Pour restaurer : gunzip -c ${BACKUP_FILE} | psql -U ${DB_USER} -d ${DB_NAME}"
echo "================================================================="
