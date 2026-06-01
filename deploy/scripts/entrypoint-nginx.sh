#!/bin/sh
# Entrypoint nginx :
#  1. Génère un certificat auto-signé de secours si absent.
#  2. Choisit le certificat à servir : Let's Encrypt si disponible, sinon auto-signé.
#  3. Génère nginx.conf depuis le template (substitution de DOMAIN + chemins de cert).
set -e

TLS_DIR=/etc/nginx/tls
SELF_CRT="$TLS_DIR/server.crt"
SELF_KEY="$TLS_DIR/server.key"
DOMAIN="${DOMAIN:-}"
LE_LIVE="/etc/letsencrypt/live/$DOMAIN"

mkdir -p "$TLS_DIR"

# 1. Certificat auto-signé de secours (toujours présent pour que nginx démarre,
#    même avant la première émission Let's Encrypt).
if [ ! -f "$SELF_CRT" ] || [ ! -f "$SELF_KEY" ]; then
    echo "[entrypoint] Génération du certificat auto-signé de secours..."
    CN="${DOMAIN:-${VPS_PUBLIC_IP:-localhost}}"
    openssl req -x509 -nodes -newkey rsa:2048 \
        -keyout "$SELF_KEY" \
        -out "$SELF_CRT" \
        -days 3650 \
        -subj "/C=FR/ST=France/L=Paris/O=SPECTRE/CN=$CN" \
        -addext "subjectAltName=DNS:${CN},DNS:localhost"
    chmod 600 "$SELF_KEY"
fi

# 2. Sélection du certificat servi par nginx.
if [ -n "$DOMAIN" ] && [ -f "$LE_LIVE/fullchain.pem" ]; then
    export SSL_CERT="$LE_LIVE/fullchain.pem"
    export SSL_KEY="$LE_LIVE/privkey.pem"
    echo "[entrypoint] Certificat Let's Encrypt actif pour $DOMAIN"
else
    export SSL_CERT="$SELF_CRT"
    export SSL_KEY="$SELF_KEY"
    echo "[entrypoint] Certificat auto-signé (Let's Encrypt pas encore émis)"
fi

# server_name : domaine si défini, sinon catch-all "_"
export DOMAIN="${DOMAIN:-_}"

# 3. Génération de nginx.conf depuis le template.
#    On ne substitue QUE ces 3 variables pour préserver les $host, $remote_addr,
#    etc. qui sont des variables nginx (et non des variables shell).
envsubst '${DOMAIN} ${SSL_CERT} ${SSL_KEY}' \
    < /etc/nginx/nginx.conf.template \
    > /etc/nginx/nginx.conf

exec "$@"
