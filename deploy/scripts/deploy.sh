#!/bin/bash
# Déploiement SPECTRE sur le VPS.
#
# Usage (depuis ton poste local, à la racine du repo) :
#   ./deploy/scripts/deploy.sh
#
# Prérequis :
#   - VPS bootstrappé (cf. bootstrap-vps.sh)
#   - deploy/.env rempli localement
#   - deploy/nginx/allowed_ips.conf rempli localement
#   - clé SSH ubuntu@<VPS_IP> qui marche
#
# Stratégie : rsync du code vers le VPS, puis docker compose up sur le VPS.

set -euo pipefail

VPS_HOST="${VPS_HOST:-ubuntu@135.125.205.135}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/spectre}"
LOCAL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "==> Vérifications préalables"
if [ ! -f "$LOCAL_ROOT/deploy/.env" ]; then
    echo "Erreur : deploy/.env introuvable. Copie deploy/.env.prod.example et remplis-le." >&2
    exit 1
fi
echo "==> Synchronisation du code vers $VPS_HOST:$REMOTE_DIR"
ssh "$VPS_HOST" "mkdir -p $REMOTE_DIR"
rsync -avz --delete \
    --exclude '.git/' \
    --exclude '.venv/' \
    --exclude '__pycache__/' \
    --exclude '*.pyc' \
    --exclude 'node_modules/' \
    --exclude 'frontend/dist/' \
    --exclude 'backend/staticfiles/' \
    --exclude 'backend/.env' \
    --exclude '.vite/' \
    --exclude 'coverage/' \
    --exclude '.pytest_cache/' \
    --exclude '.mypy_cache/' \
    "$LOCAL_ROOT/" "$VPS_HOST:$REMOTE_DIR/"

echo "==> Build et démarrage des conteneurs"
ssh "$VPS_HOST" "cd $REMOTE_DIR && docker compose -f deploy/docker-compose.prod.yml up -d --build"

echo "==> État des conteneurs"
ssh "$VPS_HOST" "cd $REMOTE_DIR && docker compose -f deploy/docker-compose.prod.yml ps"

echo ""
echo "==================================================="
echo " Déploiement terminé."
echo " Accès : https://$(echo $VPS_HOST | cut -d@ -f2)"
echo " (le navigateur affichera un warning TLS auto-signé — accepte-le)"
echo "==================================================="
