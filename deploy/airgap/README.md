# deploy/airgap — Déploiement AIR-GAP (RHEL 9, SQLite)

Artefacts pour un déploiement hors-ligne derrière Apache + gunicorn.
**Procédure complète et ordonnée : [`DEPLOYMENT.md`](../../DEPLOYMENT.md) (racine du repo).**

| Fichier | Rôle |
|---------|------|
| `.env.airgap.example` | Modèle `.env` air-gap (SQLite). Réf. exhaustive : `backend/.env.example` |
| `build-wheels.sh` | Télécharge les wheels Python (machine connectée) pour l'install offline |
| `fix-permissions.sh` | `chmod -R a+rX` + contexte SELinux après `scp` |
| `apache-spectre.conf` | vhost httpd : frontend + reverse proxy `/api/` → gunicorn |
| `spectre-gunicorn.service` | Unité systemd pour gunicorn |
| `gunicorn.conf.py` | Config gunicorn (bind local, workers, logs) |

> Distinct de la stack Docker/PostgreSQL/nginx (VPS OVH) décrite dans
> `deploy/README.md` : ici tout est natif, sans conteneur, sans internet.
