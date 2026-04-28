# Guide de déploiement SPECTRE

Guide complet de déploiement sur un serveur Linux pour la mise en production de l'application **SPECTRE** (gestion de campagnes industrielles, FSECs, FAs, planning laboratoire).

> Cible : réseau fermé / intranet, ~30 utilisateurs simultanés, volumétrie 10 ans (~5 000 FSECs, ~500 campagnes, ~2 000 FAs).

---

## 1. Vue d'ensemble

### 1.1 Stack applicative

| Composant | Technologie | Rôle en production |
|-----------|-------------|--------------------|
| Backend | Django 5.1 + DRF 3.15 (Python 3.11) | API REST `/api/v1/`, auth JWT |
| Frontend | React 18 + TypeScript 5.5 + Vite 5.3 + MUI 6 | SPA buildée en assets statiques |
| Base de données | PostgreSQL 16+ | Persistance |
| Serveur applicatif | Gunicorn 22 | WSGI Django |
| Fichiers statiques | WhiteNoise 6.7 (Django) | `STATIC_ROOT` compressé/manifesté |
| Reverse proxy / TLS | Nginx | HTTPS, frontend statique, proxy `/api` |
| Supervision | systemd | Démarrage auto, redémarrage, logs |

### 1.2 Topologie cible (serveur unique)

```
                     ┌────────────────────────────────────────┐
       HTTPS 443     │             Nginx (reverse proxy)      │
   ────────────────► │  /         → /var/www/spectre (SPA)    │
                     │  /api/*    → 127.0.0.1:8000 (gunicorn) │
                     │  /static/* → /var/www/spectre/static   │
                     └─────────────┬──────────────────────────┘
                                   │ proxy_pass
                                   ▼
                     ┌────────────────────────────────────────┐
                     │   Gunicorn (3 workers)  systemd        │
                     │   spectre.service                      │
                     └─────────────┬──────────────────────────┘
                                   │ psycopg2
                                   ▼
                     ┌────────────────────────────────────────┐
                     │            PostgreSQL 16               │
                     └────────────────────────────────────────┘
```

Pour un déploiement à 2 nœuds (web + DB), il suffit de pointer `DB_HOST` vers la base distante et d'ouvrir le port 5432 entre les deux machines.

---

## 2. Prérequis serveur

### 2.1 Matériel recommandé

| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| vCPU | 2 | 4 |
| RAM | 4 Go | 8 Go |
| Disque | 40 Go SSD | 80 Go SSD |
| Réseau | 1 Gbit interne | 1 Gbit interne |

### 2.2 Système

- **OS** : Ubuntu 22.04 LTS ou 24.04 LTS (Debian 12 OK, ajuster les noms de paquets).
- **Accès** : SSH avec compte sudo non-root.
- **Pare-feu** : ufw, ports 22 / 80 / 443 ouverts. PostgreSQL (5432) **fermé** au public.
- **DNS** interne : un nom FQDN (ex. `spectre.intra.entreprise.local`).
- **Certificat TLS** : interne (PKI d'entreprise) ou Let's Encrypt si exposé.

### 2.3 Comptes de service

```bash
sudo adduser --system --group --home /opt/spectre --shell /bin/bash spectre
sudo mkdir -p /opt/spectre /var/www/spectre /var/log/spectre
sudo chown -R spectre:spectre /opt/spectre /var/log/spectre
sudo chown -R www-data:www-data /var/www/spectre
```

---

## 3. Installation des dépendances système

```bash
sudo apt update && sudo apt upgrade -y

# Outils & runtimes
sudo apt install -y \
    git curl build-essential \
    python3.11 python3.11-venv python3.11-dev \
    postgresql-16 postgresql-contrib \
    nginx \
    ufw \
    libpq-dev

# Node.js 20 LTS pour builder le frontend (sur le serveur de build ou le serveur cible)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

> **Variante** : builder le frontend sur une machine de CI puis transférer uniquement `frontend/dist/` vers le serveur. Dans ce cas Node.js n'est pas requis sur le serveur de prod.

### Pare-feu

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 4. Base de données PostgreSQL

### 4.1 Création du rôle et de la base

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE spectre WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE spectre OWNER spectre ENCODING 'UTF8' LC_COLLATE 'fr_FR.UTF-8' LC_CTYPE 'fr_FR.UTF-8' TEMPLATE template0;
ALTER DATABASE spectre SET timezone TO 'Europe/Paris';
SQL
```

> Si la locale `fr_FR.UTF-8` n'est pas disponible : `sudo locale-gen fr_FR.UTF-8 && sudo update-locale`.

### 4.2 Durcissement (optionnel mais conseillé)

`/etc/postgresql/16/main/pg_hba.conf` — n'autoriser que les connexions locales :

```
local   all             spectre                                 scram-sha-256
host    spectre         spectre         127.0.0.1/32            scram-sha-256
```

```bash
sudo systemctl restart postgresql
```

### 4.3 Vérification

```bash
PGPASSWORD='CHANGE_ME_STRONG_PASSWORD' psql -h 127.0.0.1 -U spectre -d spectre -c '\conninfo'
```

---

## 5. Déploiement du backend

### 5.1 Récupération du code

```bash
sudo -u spectre -i
cd /opt/spectre
git clone <URL_DU_DEPOT> app
cd app
git checkout main   # ou le tag de release : git checkout v1.0.0
```

### 5.2 Environnement Python

```bash
cd /opt/spectre/app/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip wheel
pip install -r requirements.txt
```

### 5.3 Fichier `.env` de production

```bash
cp .env.example .env
chmod 600 .env
```

Contenu attendu (`/opt/spectre/app/backend/.env`) :

```dotenv
# === SECURITÉ (OBLIGATOIRES) ===
DJANGO_SECRET_KEY=<généré ci-dessous>
ALLOWED_HOSTS=spectre.intra.entreprise.local
DEBUG=false

# === BASE DE DONNÉES ===
DB_ENGINE=django.db.backends.postgresql
DB_NAME=spectre
DB_USER=spectre
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_HOST=127.0.0.1
DB_PORT=5432

# === CORS ===
# Mettre l'URL publique du frontend (servie par nginx)
CORS_ALLOWED_ORIGINS=https://spectre.intra.entreprise.local

# === HTTPS ===
# Si nginx termine TLS et envoie X-Forwarded-Proto : laisser True
SECURE_SSL_REDIRECT=true

# === STATIC ===
STATIC_ROOT=/var/www/spectre/static

# === JWT (optionnel — défaut = SECRET_KEY) ===
# JWT_SIGNING_KEY=<clé dédiée recommandée>
```

Génération de la `DJANGO_SECRET_KEY` :

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 5.4 Migrations & données initiales

```bash
cd /opt/spectre/app/backend
source .venv/bin/activate

# Schéma
python manage.py migrate --noinput

# Référentiels métier (CSV) + groupes RBAC
python manage.py initdb

# Création du premier compte (chef de labo)
python manage.py createadmin admin --first-name Admin --last-name Spectre
# Le mot de passe initial est affiché en sortie : à transmettre à l'utilisateur
# qui devra le changer à la 1re connexion (ForcePasswordChangeMiddleware).

# Collecte des fichiers statiques (Django admin + WhiteNoise)
python manage.py collectstatic --noinput
```

> **NB** : la commande `demo` (jeu de données factice) **ne doit pas** être exécutée en production.

### 5.5 Service systemd Gunicorn

`/etc/systemd/system/spectre.service` :

```ini
[Unit]
Description=SPECTRE Gunicorn (Django WSGI)
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=notify
User=spectre
Group=spectre
WorkingDirectory=/opt/spectre/app/backend
EnvironmentFile=/opt/spectre/app/backend/.env
ExecStart=/opt/spectre/app/backend/.venv/bin/gunicorn config.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 3 \
    --threads 2 \
    --timeout 60 \
    --access-logfile /var/log/spectre/access.log \
    --error-logfile  /var/log/spectre/error.log \
    --capture-output
Restart=on-failure
RestartSec=5
# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/log/spectre /var/www/spectre

[Install]
WantedBy=multi-user.target
```

> **Dimensionnement** : règle classique `workers = 2*CPU + 1`. Pour 30 users simultanés sur 4 vCPU, 3 workers + 2 threads (≈ 6–9 requêtes en parallèle) sont largement suffisants.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now spectre
sudo systemctl status spectre
```

Test direct :

```bash
curl -I http://127.0.0.1:8000/api/v1/health/  # ou un endpoint connu
```

---

## 6. Déploiement du frontend

### 6.1 Build de production

```bash
cd /opt/spectre/app/frontend
npm ci
npm run build       # produit frontend/dist/
```

> Le build est statique : aucune variable d'environnement React n'est requise — l'API est appelée en relatif (`/api/...`) et c'est nginx qui route.

### 6.2 Publication

```bash
sudo rm -rf /var/www/spectre/html
sudo mkdir -p /var/www/spectre/html
sudo cp -r /opt/spectre/app/frontend/dist/* /var/www/spectre/html/
sudo chown -R www-data:www-data /var/www/spectre/html
```

---

## 7. Reverse proxy Nginx + HTTPS

### 7.1 Certificat TLS

- **PKI interne** : copier `fullchain.pem` et `privkey.pem` dans `/etc/ssl/spectre/`.
- **Let's Encrypt** (si exposé) :

  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d spectre.intra.entreprise.local
  ```

### 7.2 Configuration `/etc/nginx/sites-available/spectre`

```nginx
# Redirection HTTP -> HTTPS
server {
    listen 80;
    server_name spectre.intra.entreprise.local;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name spectre.intra.entreprise.local;

    ssl_certificate     /etc/ssl/spectre/fullchain.pem;
    ssl_certificate_key /etc/ssl/spectre/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Tailles & timeouts (imports CSV plafonnés à 2.5 Mo côté Django)
    client_max_body_size 5m;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;

    # Logs
    access_log /var/log/nginx/spectre.access.log;
    error_log  /var/log/nginx/spectre.error.log;

    # ---- Frontend SPA ----
    root /var/www/spectre/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache long sur les assets versionnés (Vite émet des hash)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ---- Static Django (admin, DRF browsable si activé) ----
    location /static/ {
        alias /var/www/spectre/static/;
        expires 30d;
        access_log off;
    }

    # ---- API Django ----
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.3 Activation

```bash
sudo ln -s /etc/nginx/sites-available/spectre /etc/nginx/sites-enabled/spectre
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Vérification post-déploiement

### 8.1 Smoke tests

```bash
# Backend joignable
curl -kI https://spectre.intra.entreprise.local/api/v1/

# Frontend servi
curl -kI https://spectre.intra.entreprise.local/

# Auth JWT
curl -kX POST https://spectre.intra.entreprise.local/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<mot_de_passe_initial>"}'
```

Réponse attendue : un JSON contenant `access` et `refresh`.

### 8.2 Checklist fonctionnelle

- [ ] Connexion admin via le navigateur, page de changement de mot de passe forcée.
- [ ] Création d'un utilisateur opérateur depuis l'UI.
- [ ] Création d'une campagne / FSEC / FA → persistée en base.
- [ ] Refresh de la page sur une route deep-link (`/campagnes/123`) → SPA recharge correctement (`try_files`).
- [ ] Headers HSTS, X-Frame-Options, CSP présents (`curl -I`).

---

## 9. Logs, sauvegardes, exploitation

### 9.1 Logs

| Source | Fichier |
|--------|---------|
| Gunicorn access | `/var/log/spectre/access.log` |
| Gunicorn / Django (stderr structuré JSON) | `/var/log/spectre/error.log` + `journalctl -u spectre` |
| Nginx | `/var/log/nginx/spectre.{access,error}.log` |
| PostgreSQL | `/var/log/postgresql/postgresql-16-main.log` |

Rotation via logrotate — `/etc/logrotate.d/spectre` :

```
/var/log/spectre/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su spectre spectre
}
```

### 9.2 Sauvegarde PostgreSQL

Job cron `/etc/cron.d/spectre-backup` :

```
0 2 * * * postgres pg_dump -Fc spectre > /var/backups/spectre/spectre-$(date +\%Y\%m\%d).dump && find /var/backups/spectre -mtime +14 -delete
```

```bash
sudo mkdir -p /var/backups/spectre
sudo chown postgres:postgres /var/backups/spectre
```

Restauration :

```bash
sudo -u postgres pg_restore -d spectre -c /var/backups/spectre/spectre-YYYYMMDD.dump
```

### 9.3 Supervision minimale

- `systemctl status spectre nginx postgresql` dans une routine de check.
- `journalctl -u spectre -f` pour le suivi temps réel.
- Endpoint santé : prévoir un appel automatisé sur `/api/v1/` avec alerte si HTTP ≠ 2xx pendant 2 cycles.

---

## 10. Mises à jour applicatives

Procédure standard (downtime ~30 s) :

```bash
sudo -u spectre -i
cd /opt/spectre/app
git fetch --tags
git checkout v1.x.y

# --- backend ---
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
deactivate
exit

# --- frontend ---
cd /opt/spectre/app/frontend
npm ci
npm run build
sudo rsync -a --delete /opt/spectre/app/frontend/dist/ /var/www/spectre/html/

# --- redémarrage ---
sudo systemctl restart spectre
sudo systemctl reload nginx
```

> **Rollback** : `git checkout <tag_précédent>` + relancer les étapes ci-dessus. Les migrations Django sont (par convention dans ce repo) compatibles N-1 ; en cas de migration destructive, restaurer le dump PostgreSQL avant rollback.

---

## 11. Checklist de sécurité production

- [ ] `DEBUG=false` dans `.env` (sinon l'admin Django est exposé, cf. `config/urls.py:55`).
- [ ] `DJANGO_SECRET_KEY` aléatoire et **non** committée.
- [ ] `ALLOWED_HOSTS` limité au FQDN réel.
- [ ] `CORS_ALLOWED_ORIGINS` limité à l'origine du frontend.
- [ ] HTTPS forcé (`SECURE_SSL_REDIRECT=true`), HSTS actif (automatique si `DEBUG=false`).
- [ ] Mot de passe PostgreSQL fort, pas d'accès réseau public au 5432.
- [ ] `.env` en `chmod 600`, propriétaire `spectre`.
- [ ] Compte admin initial : mot de passe changé à la 1re connexion (forcé par middleware).
- [ ] Sauvegardes testées (`pg_restore` sur env de test).
- [ ] Mises à jour OS automatiques (`unattended-upgrades`).
- [ ] Rate-limiting actif (déjà configuré : 5/min login, 100/h anon, 1000/h user).

---

## 12. Annexe — Variante Docker (optionnelle)

Pour des environnements préférant la containerisation, un `docker-compose.yml` minimal :

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: spectre
      POSTGRES_USER: spectre
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: ["pgdata:/var/lib/postgresql/data"]

  backend:
    build: ./backend
    restart: unless-stopped
    env_file: ./backend/.env
    depends_on: [db]
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
    volumes: ["static:/var/www/spectre/static"]

  frontend:
    image: nginx:1.27-alpine
    restart: unless-stopped
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - static:/var/www/spectre/static:ro
    ports: ["443:443", "80:80"]
    depends_on: [backend]

volumes:
  pgdata:
  static:
```

> Cette variante n'est pas la cible officielle de ce guide ; elle est fournie à titre indicatif si l'infrastructure d'accueil est containerisée.

---

## 13. Récapitulatif rapide

```bash
# 1. Système
sudo apt install -y python3.11 python3.11-venv postgresql-16 nginx nodejs

# 2. Base
sudo -u postgres createuser -P spectre && sudo -u postgres createdb -O spectre spectre

# 3. Backend
git clone <repo> /opt/spectre/app
cd /opt/spectre/app/backend && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env && vim .env       # DEBUG=false, SECRET_KEY, DB, ALLOWED_HOSTS
python manage.py migrate && python manage.py initdb
python manage.py createadmin admin
python manage.py collectstatic --noinput

# 4. Service
sudo cp deploy/spectre.service /etc/systemd/system/ && sudo systemctl enable --now spectre

# 5. Frontend
cd /opt/spectre/app/frontend && npm ci && npm run build
sudo cp -r dist/* /var/www/spectre/html/

# 6. Nginx
sudo cp deploy/nginx-spectre.conf /etc/nginx/sites-available/spectre
sudo ln -s /etc/nginx/sites-available/spectre /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Pour toute question : se référer à `claude.md` (architecture / conventions) et `CONTRIBUTING.md` (workflow de dev).
