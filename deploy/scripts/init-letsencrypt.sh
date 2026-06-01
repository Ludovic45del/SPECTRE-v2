#!/bin/bash
# Première émission du certificat Let's Encrypt.
#
# À lancer UNE FOIS sur le VPS, après que :
#   1. Le DNS du domaine pointe vers le VPS (vérifier avec : dig +short DOMAIN)
#   2. deploy/.env contient DOMAIN et CERTBOT_EMAIL remplis
#   3. Le port 80 est ouvert (ufw allow 80/tcp + firewall OVH si activé)
#   4. La stack tourne (docker compose up -d)
#
# Usage (sur le VPS) :
#   cd ~/spectre && bash deploy/scripts/init-letsencrypt.sh
#
# Le renouvellement ensuite est automatique (service certbot dans le compose).

set -euo pipefail

cd "$(dirname "$0")/../.."
COMPOSE="docker compose -f deploy/docker-compose.prod.yml"

DOMAIN=$(grep -E '^DOMAIN=' deploy/.env | cut -d= -f2- | tr -d '[:space:]')
CERTBOT_EMAIL=$(grep -E '^CERTBOT_EMAIL=' deploy/.env | cut -d= -f2- | tr -d '[:space:]')

if [ -z "$DOMAIN" ]; then
    echo "Erreur : DOMAIN vide dans deploy/.env" >&2
    exit 1
fi
if [ -z "$CERTBOT_EMAIL" ]; then
    echo "Erreur : CERTBOT_EMAIL vide dans deploy/.env" >&2
    exit 1
fi

echo "==> Vérification DNS : $DOMAIN doit pointer vers ce VPS"
RESOLVED=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)
echo "    $DOMAIN → ${RESOLVED:-<non résolu>}"
echo "    (si l'IP ne correspond pas au VPS, le challenge échouera)"

echo "==> nginx doit tourner pour servir le challenge ACME sur le port 80"
$COMPOSE up -d nginx

echo "==> Émission du certificat Let's Encrypt pour $DOMAIN et www.$DOMAIN"
$COMPOSE run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --email "$CERTBOT_EMAIL" \
    --agree-tos --no-eff-email --non-interactive

echo "==> Redémarrage de nginx pour activer le certificat Let's Encrypt"
$COMPOSE restart nginx

echo ""
echo "==================================================="
echo " Certificat Let's Encrypt actif."
echo " Accès : https://$DOMAIN  (cadenas vert, sans warning)"
echo " Renouvellement automatique géré par le service 'certbot'."
echo "==================================================="
