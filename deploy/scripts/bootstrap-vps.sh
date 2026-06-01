#!/bin/bash
# Bootstrap d'un VPS Ubuntu 24.04 pour héberger SPECTRE.
#
# À exécuter UNE FOIS, au tout premier setup du serveur, en tant que `ubuntu` avec sudo :
#   sudo bash deploy/scripts/bootstrap-vps.sh
#
# Idempotent : peut être relancé sans casser une install existante.

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Doit être exécuté avec sudo (ou en root)." >&2
    exit 1
fi

echo "==> 1/6  Mise à jour APT"
apt-get update -y
apt-get upgrade -y

echo "==> 2/6  Installation des paquets de base"
apt-get install -y \
    ca-certificates curl gnupg lsb-release \
    ufw fail2ban \
    git \
    unattended-upgrades

echo "==> 3/6  Installation Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    usermod -aG docker ubuntu
    systemctl enable --now docker
else
    echo "    Docker déjà installé."
fi

echo "==> 4/6  Configuration ufw (firewall)"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (redirect HTTPS + challenge Let'\''s Encrypt)'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status verbose

echo "==> 5/6  fail2ban (protection SSH brute-force)"
systemctl enable --now fail2ban

echo "==> 6/6  Mises à jour de sécurité automatiques"
dpkg-reconfigure -plow unattended-upgrades || true

echo ""
echo "==================================================="
echo " Bootstrap terminé."
echo ""
echo " Étapes suivantes (depuis ton poste local) :"
echo "   1. Cloner le repo SPECTRE dans /home/ubuntu/spectre"
echo "   2. Remplir deploy/.env (cf. .env.prod.example)"
echo "   3. Remplir deploy/nginx/allowed_ips.conf avec tes IP"
echo "   4. docker compose -f deploy/docker-compose.prod.yml up -d --build"
echo ""
echo " /!\\ Reconnecte-toi en SSH pour que le groupe 'docker' soit pris en compte :"
echo "       exit && ssh ubuntu@<IP>"
echo "==================================================="
