# SPECTRE

Application web full-stack de gestion de campagnes industrielles, FSECs (Functional & Structural Evaluation Components), analyses de défaillance (FA), embases et planning laboratoire.

Destinée à un usage **en réseau fermé** (30 utilisateurs simultanés max, volumétrie sur 10 ans : ~5 000 FSECs, ~500 campagnes, ~2 000 FAs).

## Stack

- **Backend** : Python 3.11 / Django 5.1 / Django REST Framework 3.15
- **Frontend** : React 18.3 / TypeScript 5.5 / Vite 5.3 / MUI 6
- **Base de données** : PostgreSQL 16+
- **Auth** : JWT (djangorestframework-simplejwt)
- **Tests** : pytest + factory-boy (backend), Vitest + MSW (frontend)

Architecture backend : Clean Architecture (api → domain → mapper → repository).
Architecture frontend : Feature-Sliced Design (`@app`, `@pages`, `@features`, `@entities`, `@widgets`, `@shared`).

## Installation (Linux / WSL)

### 1. PostgreSQL

```bash
sudo apt install postgresql-16
sudo -u postgres createuser -P spectre     # définir un mot de passe
sudo -u postgres createdb -O spectre spectre
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt        # outils de dev (pandas, sqlalchemy pour seeding)

cp .env.example .env
# Éditer .env : DJANGO_SECRET_KEY, DB_PASSWORD, DEBUG=true en dev

python manage.py migrate --settings=config.settings
python manage.py initdb                    # Charge les référentiels CSV
python manage.py demo                      # Optionnel : données de démo
python manage.py runserver 8000
```

### 3. Frontend

```bash
cd frontend
npm ci
npm run dev                                # http://localhost:3000 (proxy /api → :8000)
```

## Tests

```bash
# Backend (pytest)
cd backend
pytest app/tests/unit -v -m unit                    # seuil 80%
pytest app/tests/integration -v -m integration      # seuil 70%
pytest app/tests/service -v -m service

# Frontend (Vitest)
cd frontend
npm run test                                        # watch mode
npm run test:coverage                               # seuils : 80% lines, 75% branches, 85% functions
```

## Linting & format

```bash
# Backend
cd backend
black .
isort --profile=black --line-length=120 .
flake8 app --max-line-length=120 --exclude=migrations

# Frontend
cd frontend
npm run lint
npx tsc --noEmit
```

Pre-commit hooks configurés dans `.pre-commit-config.yaml`.

## Documentation

- [claude.md](claude.md) — guide de développement détaillé (architecture, conventions, workflow)
- [spectre-dev-assistant/SKILL.md](spectre-dev-assistant/SKILL.md) — workflows pas-à-pas pour nouvelles entités, bug fixes, refactoring
- [spectre-dev-assistant/references/architecture.md](spectre-dev-assistant/references/architecture.md) — règles d'architecture
- [spectre-dev-assistant/references/conventions.md](spectre-dev-assistant/references/conventions.md) — conventions de code
