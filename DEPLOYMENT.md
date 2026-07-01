# Déploiement SPECTRE — Serveur AIR-GAP (RHEL 9, SQLite)

Runbook séquentiel pour un déploiement **à froid** sur un serveur RHEL 9 **sans
accès internet**. Stack : Django 5.1 (SQLite) + gunicorn + whitenoise, derrière
Apache (httpd) en reverse proxy. Auth Kerberos/SSO gérée par Apache (IT).

> Toutes les commandes supposent l'arborescence cible `/opt/spectre` et un
> utilisateur applicatif `spectre`. Adapter si besoin (répercuter dans le vhost
> Apache et le service systemd).

Arborescence cible :

```
/opt/spectre/
├── backend/            # code Django (ce repo, dossier backend/)
│   ├── .env            # config (créée à l'étape 4)
│   ├── staticfiles/    # STATIC_ROOT (généré à l'étape 7)
│   └── media/          # MEDIA_ROOT (uploads)
├── frontend/dist/      # build React (préparé hors-ligne, cf. étape 1)
├── deploy/airgap/      # configs Apache / systemd / scripts
├── wheels/             # wheels Python pré-téléchargées (cf. étape 1)
├── venv/               # venv Python 3.11 (créé à l'étape 3)
└── data/               # fichier SQLite (hors arborescence servie)
```

---

## 0. Prérequis serveur (une fois, en tant qu'admin)

```bash
# Python 3.11 (le python système RHEL 9 est en 3.9 → venv dédié 3.11).
sudo dnf install -y python3.11 httpd
# Modules Apache pour le reverse proxy (généralement déjà présents).
#   mod_proxy, mod_proxy_http, mod_headers, mod_dir

# Utilisateur applicatif dédié + arborescence.
sudo useradd --system --home-dir /opt/spectre --shell /sbin/nologin spectre || true
sudo mkdir -p /opt/spectre/data
```

---

## 1. Préparer le paquet de déploiement (sur une machine CONNECTÉE)

Les wheels Python **et** le build frontend doivent être préparés sur une machine
avec internet (idéalement même plateforme : RHEL 9 / Python 3.11 / x86_64), puis
transférés par `scp`.

```bash
# a) Wheels Python de production (dossier wheels/)
bash deploy/airgap/build-wheels.sh          # PYTHON=python3.11 si besoin

# b) Build du frontend React (nécessite node/npm ; produit frontend/dist/)
cd frontend && npm ci && npm run build && cd ..

# c) Transfert vers le serveur (code + wheels + dist)
scp -r backend deploy wheels frontend/dist spectre-server:/tmp/spectre-upload/
# puis, sur le serveur :
sudo mkdir -p /opt/spectre/frontend
sudo cp -r /tmp/spectre-upload/backend  /opt/spectre/
sudo cp -r /tmp/spectre-upload/deploy   /opt/spectre/
sudo cp -r /tmp/spectre-upload/wheels   /opt/spectre/
sudo cp -r /tmp/spectre-upload/dist     /opt/spectre/frontend/dist
```

---

## 2. Propriété & dossiers applicatifs

Donner la propriété de l'arborescence à l'utilisateur applicatif — les fichiers
transférés par `scp` arrivent souvent en `drwx------`, sans ça ni `spectre` ni
Apache ne peuvent les lire — et créer les dossiers inscriptibles au runtime.

```bash
sudo chown -R spectre:spectre /opt/spectre
sudo -u spectre mkdir -p \
    /opt/spectre/backend/media /opt/spectre/backend/staticfiles /opt/spectre/data
```

> Le `chmod a+rX` + le contexte SELinux (lecture par Apache) sont appliqués plus
> tard (**étape 9**), une fois les statiques générés par `collectstatic`.

---

## 3. Créer le venv 3.11 et installer les dépendances (OFFLINE)

```bash
sudo -u spectre python3.11 -m venv /opt/spectre/venv

# Mise à jour pip/setuptools/wheel depuis les wheels locales (sans internet).
sudo -u spectre /opt/spectre/venv/bin/pip install \
    --no-index --find-links /opt/spectre/wheels --upgrade pip setuptools wheel

# Dépendances de production (SQLite) — strictement offline.
sudo -u spectre /opt/spectre/venv/bin/pip install \
    --no-index --find-links /opt/spectre/wheels \
    -r /opt/spectre/backend/requirements-prod.txt
```

---

## 4. Créer le fichier `.env`

```bash
sudo -u spectre cp /opt/spectre/deploy/airgap/.env.airgap.example /opt/spectre/backend/.env
sudo -u spectre /opt/spectre/venv/bin/python -c \
  'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
# → coller la valeur dans DJANGO_SECRET_KEY, ajuster ALLOWED_HOSTS / SQLITE_PATH.
sudo -u spectre "${EDITOR:-vi}" /opt/spectre/backend/.env
```

Points clés (référence complète : `backend/.env.example`) :
`USE_SQLITE=True`, `DEBUG=False`, `SECURE_SSL_REDIRECT=False` (réseau interne HTTP),
`SQLITE_PATH=/opt/spectre/data/db.sqlite3`.

Les commandes suivantes s'exécutent dans le dossier backend :

```bash
cd /opt/spectre/backend
run() { sudo -u spectre /opt/spectre/venv/bin/python manage.py "$@"; }
```

---

## 5. Appliquer les migrations (crée la base SQLite + les groupes RBAC)

```bash
run migrate --noinput
```

> La migration `0085_seed_rbac_groups` crée automatiquement les groupes de
> permission `admin` / `operateur` / `lecteur` : plus besoin d'`initdb` pour que
> la création de compte fonctionne.

---

## 6. Charger les données de référence (référentiels campagne/FSEC)

```bash
run initdb
```

> Idempotent (réexécutable). Seed via la bibliothèque standard `csv` : ne
> nécessite ni pandas ni PostgreSQL.

---

## 7. Collecter les fichiers statiques (whitenoise)

```bash
run collectstatic --noinput
```

> Storage compressé + manifeste (`CompressedManifestStaticFilesStorage`).
> Génère `staticfiles/` (statiques Django admin/DRF inclus), servi par Apache.

---

## 8. Créer le premier compte administrateur (chef de laboratoire)

```bash
run createadmin <username> --first-name "Prénom" --last-name "Nom"
# Mot de passe temporaire affiché une fois → à changer à la 1re connexion.
```

> ⚠ Utiliser `createadmin` (compte applicatif chef_labo), **pas**
> `createsuperuser`. L'admin Django n'est monté qu'en `DEBUG`.

---

## 9. Corriger permissions & contexte SELinux (⚠ piège récurrent)

Les statiques existent maintenant : rendre l'arborescence lisible par Apache
(`chmod -R a+rX`) et étiqueter les dossiers servis pour SELinux (RHEL 9 en
enforcing par défaut). Le script crée aussi `media/` et `staticfiles/` s'ils
manquent, puis autorise le proxy Apache→gunicorn (`httpd_can_network_connect`).

```bash
sudo bash /opt/spectre/deploy/airgap/fix-permissions.sh /opt/spectre spectre
```

---

## 10. Lancer gunicorn via systemd

```bash
sudo cp /opt/spectre/deploy/airgap/spectre-gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now spectre-gunicorn
sudo systemctl status spectre-gunicorn        # doit être "active (running)"
# Test local direct (avant Apache) :
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/v1/
```

---

## 11. Configurer Apache (reverse proxy + frontend)

```bash
sudo cp /opt/spectre/deploy/airgap/apache-spectre.conf /etc/httpd/conf.d/spectre.conf
sudo "${EDITOR:-vi}" /etc/httpd/conf.d/spectre.conf   # ajuster ServerName + chemins
sudo apachectl configtest                              # "Syntax OK"
sudo systemctl enable --now httpd
sudo systemctl reload httpd
```

Si le pare-feu est actif :

```bash
sudo firewall-cmd --permanent --add-service=http && sudo firewall-cmd --reload
```

---

## 12. Vérification finale

```bash
curl -sS -o /dev/null -w "frontend: %{http_code}\n" http://spectre.intra.cea.fr/
curl -sS -o /dev/null -w "api:      %{http_code}\n" http://spectre.intra.cea.fr/api/v1/
```

Ouvrir `http://spectre.intra.cea.fr/` dans un navigateur et se connecter avec le
compte de l'étape 8.

---

## Mémo permissions (après chaque `scp` de mise à jour)

```bash
sudo chown -R spectre:spectre /opt/spectre
sudo bash /opt/spectre/deploy/airgap/fix-permissions.sh /opt/spectre spectre
sudo systemctl restart spectre-gunicorn && sudo systemctl reload httpd
```

## Dépannage rapide

| Symptôme | Cause probable | Correctif |
|----------|----------------|-----------|
| 403 / page blanche | dossiers `drwx------` ou contexte SELinux manquant | étape 9 (`fix-permissions.sh`) |
| 503 sur `/api/` | gunicorn arrêté / SELinux bloque le proxy | `systemctl status spectre-gunicorn` ; `setsebool -P httpd_can_network_connect on` |
| Boucle de redirection https | `SECURE_SSL_REDIRECT=True` en HTTP interne | mettre `False` dans `.env` |
| `Group matching query does not exist` | base sans migration 0085 | `run migrate` (corrigé par cette version) |
| `database is locked` | écritures SQLite concurrentes | réduire `workers` (gunicorn.conf.py) |
| Upload d'image échoue | Pillow absent | vérifier `requirements-prod.txt` installé |
| Export PDF fiche livraison KO | WeasyPrint non installé (optionnel) | cf. `deploy/airgap/build-wheels.sh` (note WeasyPrint) |
