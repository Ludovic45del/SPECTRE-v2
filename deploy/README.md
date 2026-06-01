# Déploiement SPECTRE — VPS OVH

Stack : Django + Postgres + nginx (TLS auto-signé + whitelist IP), tout en Docker Compose.

## Première installation

### 1. Préparer le VPS (à faire une seule fois)

Depuis ton poste, copie le script de bootstrap sur le VPS et exécute-le :

```bash
scp deploy/scripts/bootstrap-vps.sh ubuntu@135.125.205.135:/tmp/
ssh ubuntu@135.125.205.135 'sudo bash /tmp/bootstrap-vps.sh'
```

Ce script installe Docker, ufw, fail2ban, configure le firewall (22 + 443 uniquement) et active les MAJ de sécurité auto.

Après le bootstrap, **reconnecte-toi en SSH** (pour que ton user `ubuntu` soit pris en compte dans le groupe `docker`) :

```bash
ssh ubuntu@135.125.205.135
```

### 2. Configurer le firewall OVH (manager web)

Dans l'Espace Client OVH → VPS → onglet **"Sécurité"** → **Network Firewall** :
- Activer le firewall
- Règle 1 : `accept` `tcp` `dst 22` depuis ton IP publique (SSH)
- Règle 2 : `accept` `tcp` `dst 443` depuis chaque IP autorisée (HTTPS)
- Règle 3 : `deny` tout le reste en entrée

Le ufw du VPS est une deuxième couche : si le firewall OVH passe, ufw filtre encore.

### 3. Remplir les fichiers de config locale

Sur ton poste, à la racine du repo :

```bash
cp deploy/.env.prod.example deploy/.env
$EDITOR deploy/.env                          # remplir DJANGO_SECRET_KEY, POSTGRES_PASSWORD, etc.
$EDITOR deploy/nginx/allowed_ips.conf        # ajouter `allow X.X.X.X;` pour chaque IP autorisée
```

Pour générer les secrets :

```bash
# DJANGO_SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# POSTGRES_PASSWORD
openssl rand -base64 32
```

### 4. Premier déploiement

```bash
./deploy/scripts/deploy.sh
```

Le script :
1. Vérifie que `.env` et `allowed_ips.conf` sont remplis
2. Rsync le code vers `/home/ubuntu/spectre/` sur le VPS
3. Build les images Docker (backend + frontend)
4. Démarre les conteneurs (db, backend, nginx)
5. Le backend applique automatiquement les migrations et `collectstatic`

### 5. Tester

Ouvre `https://135.125.205.135` dans ton navigateur.
- Premier accès : warning TLS (cert auto-signé) → "Avancé → Continuer".
- Si tu vois `403 Forbidden` → ton IP n'est pas dans `allowed_ips.conf`.
- Si erreur de connexion → vérifie le firewall OVH et ufw.

## Opérations courantes

### Mettre à jour le code

```bash
./deploy/scripts/deploy.sh
```

Idempotent : tu peux le relancer autant de fois que tu veux.

### Ajouter une IP à la whitelist

Édite `deploy/nginx/allowed_ips.conf` puis :

```bash
./deploy/scripts/deploy.sh   # redéploie tout
# OU (plus rapide, sans rebuild)
ssh ubuntu@135.125.205.135 'cd spectre && \
    docker compose -f deploy/docker-compose.prod.yml exec nginx nginx -s reload'
```

### Créer un superuser Django

```bash
ssh ubuntu@135.125.205.135 'cd spectre && \
    docker compose -f deploy/docker-compose.prod.yml exec backend python manage.py createsuperuser'
```

### Logs

```bash
ssh ubuntu@135.125.205.135 'cd spectre && \
    docker compose -f deploy/docker-compose.prod.yml logs -f --tail=100'
```

### Backup de la BDD

```bash
ssh ubuntu@135.125.205.135 'cd spectre && \
    docker compose -f deploy/docker-compose.prod.yml exec -T db \
    pg_dump -U spectre spectre' > backup-$(date +%F).sql
```

À combiner avec le backup automatique OVH (snapshot du VPS entier) déjà activé.

### Restore

```bash
cat backup.sql | ssh ubuntu@135.125.205.135 'cd spectre && \
    docker compose -f deploy/docker-compose.prod.yml exec -T db \
    psql -U spectre spectre'
```

## Architecture réseau

```
                Internet
                   │
        ┌──────────▼──────────┐
        │ Firewall OVH        │  ← couche 1 : filtre IP au niveau réseau
        │ (22 + 443 only)     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ ufw (VPS)           │  ← couche 2 : firewall OS
        │ (22 + 443 only)     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ nginx (TLS+whitelist│  ← couche 3 : reverse proxy + filtre IP applicatif
        │  IP applicative)    │
        └──┬───────┬──────────┘
           │       │
   /api/* ▼       ▼ /*
  ┌──────────┐  ┌──────────────┐
  │ gunicorn │  │ React (dist) │
  │ (Django) │  │   statique   │
  └─────┬────┘  └──────────────┘
        │
        ▼
  ┌──────────┐
  │ Postgres │  ← pas exposé hors du réseau Docker interne
  └──────────┘
```

## Sécurité

- HTTP (port 80) sert le challenge Let's Encrypt puis redirige vers HTTPS.
- TLS auto-signé par défaut (valide 10 ans) ; bascule possible sur Let's Encrypt (cf. ci-dessous).
- Postgres n'est joignable que depuis le réseau Docker interne (pas de mapping `ports:` sur le service `db`).
- fail2ban bannit les IP qui brute-forcent SSH.
- Mises à jour de sécurité Ubuntu automatiques activées (`unattended-upgrades`).

## Passer en HTTPS valide (Let's Encrypt)

Prérequis : un nom de domaine dont l'enregistrement DNS **A** pointe vers l'IP du VPS.

1. **Configurer le DNS** (chez le registrar) :

   | Type | Sous-domaine | Cible |
   |------|-------------|-------|
   | A | (racine) | `135.125.205.135` |
   | A | `www` | `135.125.205.135` |

   Vérifier la propagation : `dig +short testlabo.fr` doit renvoyer l'IP du VPS.

2. **Renseigner le domaine** dans `deploy/.env` :
   ```
   DOMAIN=testlabo.fr
   CERTBOT_EMAIL=ton@email.fr
   ALLOWED_HOSTS=testlabo.fr,www.testlabo.fr,135.125.205.135,localhost
   CORS_ALLOWED_ORIGINS=https://testlabo.fr,https://www.testlabo.fr
   ```

3. **Ouvrir le port 80** (challenge ACME) :
   ```bash
   ssh ubuntu@135.125.205.135 'sudo ufw allow 80/tcp'
   ```
   (+ règle `accept tcp dst 80` dans le Network Firewall OVH s'il est activé)

4. **Déployer** (pousse le domaine + la config nginx templatée) :
   ```bash
   ./deploy/scripts/deploy.sh
   ```

5. **Émettre le certificat** (une seule fois) :
   ```bash
   ssh ubuntu@135.125.205.135 'cd spectre && bash deploy/scripts/init-letsencrypt.sh'
   ```

Le renouvellement est ensuite **automatique** (service `certbot` dans le compose, tentative toutes les 12h). Accès final : `https://testlabo.fr` sans warning.
