# CLAUDE.md - SPECTRE Project Guide

## Project Overview

SPECTRE (also referred to as CIBLE internally) is a full-stack web application for managing scientific/industrial campaigns, FSECs (Functional & Structural Evaluation Components), failure analysis (FA), and lab planning/scheduling. The backend is a Django REST API and the frontend is a React TypeScript SPA.

## Exigences qualité

Cette application est développée pour répondre aux **exigences de qualité d'une grande entreprise industrielle**. Cela implique :

- **Robustesse** : gestion systématique des erreurs, aucun crash silencieux, logging structuré
- **Traçabilité** : chaque requête possède un ID unique (RequestIDMiddleware), audit trail sur les opérations critiques
- **Maintenabilité** : architecture Clean Architecture stricte, séparation des couches, code testable et découplé
- **Couverture de tests** : seuils minimaux imposés (80% unit backend, 70% integration, 80% lines frontend)
- **Sécurité** : JWT avec refresh token, validation systématique des entrées (Serializers + Zod), pas de données sensibles en clair
- **CI/CD rigoureux** : pipeline multi-étapes avec lint, tests unitaires, intégration et build avant tout merge
- **Conventions strictes** : formatage automatique (Black, isort, ESLint), pre-commit hooks, revue de code obligatoire
- **Fiabilité des données** : transactions atomiques sur les écritures, contraintes d'intégrité en base, validation métier dans les services

## Contexte d'utilisation

- **Réseau fermé** (pas d'accès Internet en production)
- **30 utilisateurs max** simultanés
- **Volumétrie sur 10 ans** : ~5 000 FSECs, ~500 campagnes, ~2 000 FAs

## Tech Stack

| Layer      | Technology                                                       |
|------------|------------------------------------------------------------------|
| Backend    | Python 3.11, Django 5.1, Django REST Framework 3.15              |
| Frontend   | React 18.3, TypeScript 5.5, Vite 5.3                            |
| Auth       | JWT via djangorestframework-simplejwt                            |
| Database   | PostgreSQL 16+, configuré via env vars (cf. backend/.env.example) |
| State      | TanStack React Query (server), Zustand (client)                  |
| UI         | MUI 6 (Material UI) + Emotion CSS-in-JS                         |
| Testing    | pytest + factory-boy (backend), Vitest (frontend)                |
| Linting    | Black + isort + Flake8 (backend), ESLint + TypeScript (frontend) |

## Repository Structure

```
SPECTRE/
├── backend/                  # Django REST API
│   ├── config/               # Django settings, urls, wsgi
│   ├── app/
│   │   ├── api/              # REST controllers (ViewSets) + serializers
│   │   ├── core/             # Middleware, structured logging
│   │   ├── domain/           # Pure business logic (services, beans, interfaces)
│   │   ├── mapper/           # Data mapping: Entity <-> Bean <-> API
│   │   ├── repository/       # ORM entities + repository implementations
│   │   ├── management/       # Django management commands (initdb, demo)
│   │   ├── data/             # CSV seed data for referential tables
│   │   ├── migrations/       # Django database migrations
│   │   └── tests/            # Test suite (unit, integration, service)
│   ├── manage.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── pytest.ini
├── frontend/                 # React SPA (Feature-Sliced Design)
│   ├── src/
│   │   ├── app/              # App config, layout, router, providers
│   │   ├── pages/            # Route-level page components
│   │   ├── features/         # Business features (forms, filters, modals)
│   │   ├── entities/         # Domain models, API queries, Zod schemas
│   │   ├── widgets/          # Reusable UI components
│   │   ├── shared/           # API client, theme, utilities, constants
│   │   └── test/             # Test setup, utils, MSW mocks
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .github/workflows/ci.yml  # CI pipeline
└── .pre-commit-config.yaml   # Pre-commit hooks
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# For dev tools (pandas/sqlalchemy for DB seeding):
pip install -r requirements-dev.txt

# Copy and edit environment variables
cp .env.example .env
# Set DEBUG=true for local development

python manage.py migrate --settings=config.settings
python manage.py initdb      # Load referential data from CSVs
python manage.py demo         # Optional: load demo data
python manage.py runserver 8000
```

### Frontend

```bash
cd frontend
npm ci
npm run dev    # Starts on http://localhost:3000, proxies /api to :8000
```

## Common Commands

### Backend

```bash
# Run all tests
cd backend && pytest

# Run by category
pytest app/tests/unit -v -m unit
pytest app/tests/integration -v -m integration
pytest app/tests/service -v -m service

# Run with coverage
pytest app/tests/unit -v -m unit --cov=app --cov-report=term-missing --cov-fail-under=80

# Linting
black --check --diff .
isort --check-only --diff .
flake8 app --max-line-length=120 --exclude=migrations

# Format code
black .
isort --profile=black --line-length=120 .

# Database
python manage.py makemigrations
python manage.py migrate --settings=config.settings
```

### Frontend

```bash
cd frontend

# Development
npm run dev           # Dev server (port 3000)
npm run build         # TypeScript check + Vite build

# Testing
npm run test          # Vitest watch mode
npm run test:coverage # Vitest with coverage

# Linting
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript type check
```

## Architecture

### Backend - Clean Architecture (Layered)

The backend follows Clean Architecture with strict layer boundaries:

```
API Controllers  -->  Domain Services  -->  Repository Interfaces
  (app/api/)         (app/domain/*/       (app/domain/*/
                      services/)           interface/)
       |                    |                     |
  Serializers          Beans (DTOs)         Repository Impls
  (validation)     (app/domain/*/          (app/repository/*/
                    models/)                repositories/)
       |                    |                     |
       +--------  Mappers  -+-----  ORM Entities  +
                (app/mapper/)       (app/repository/*/
                                     models/)
```

**Key conventions:**
- **Controllers** (`app/api/`): DRF ViewSets that handle HTTP. Named `*Controller`. Instantiate their own repository.
- **Services** (`app/domain/*/services/`): Pure functions. No HTTP context, no ORM imports. Accept repository interface as first argument.
- **Beans** (`app/domain/*/models/`): Python `@dataclass` DTOs. Named `*Bean`. No framework dependencies.
- **Repository interfaces** (`app/domain/*/interface/`): Abstract base classes defining data access contracts. Named `I*Repository`.
- **Repository implementations** (`app/repository/*/repositories/`): Django ORM implementations. Use `@transaction.atomic` for writes.
- **Entities** (`app/repository/*/models/`): Django `models.Model` classes. Named `*Entity`. Map to database tables.
- **Mappers** (`app/mapper/`): Convert between Entity, Bean, and API dict formats. Three directions: `entity_to_bean`, `bean_to_entity`, `api_to_bean`, `bean_to_api`.
- **Serializers** (`app/api/*/serializers.py`): DRF serializers for **input validation only**. Response serialization is handled by mappers.

**Domain modules:** `campaign`, `fsec`, `fa`, `steps`, `planning`, `embase` (inclut `etalonnage`), `dashboard` (lecture seule), `user`

### Frontend - Feature-Sliced Design (FSD)

The frontend uses FSD architecture with path aliases:

| Alias        | Path              | Purpose                                    |
|--------------|-------------------|--------------------------------------------|
| `@app`       | `src/app`         | App config, providers, router, layout       |
| `@pages`     | `src/pages`       | Full-page route components                  |
| `@features`  | `src/features`    | Business logic features (forms, filters)    |
| `@entities`  | `src/entities`    | Domain models, API hooks, Zod schemas       |
| `@widgets`   | `src/widgets`     | Reusable UI components                      |
| `@shared`    | `src/shared`      | API client, theme, utilities                |
| `@test`      | `src/test`        | Test setup, utilities, MSW mocks            |

**Key conventions:**
- **API client** (`@shared/api/client.ts`): Fetch wrapper with JWT injection, auto-refresh on 401, Zod response validation.
- **Query hooks** (`@entities/*/api/*.queries.ts`): TanStack Query hooks for data fetching. Query keys defined in `*.keys.ts`.
- **Schemas** (`@entities/*/model/*.schema.ts`): Zod schemas for runtime validation of API responses.
- **Stores** (`@features/*/model/*.store.ts`): Zustand stores for client-side state (filters, modals, auth).
- **Components**: Use `memo()` for optimization, `useCallback` for handlers, React Hook Form + Zod for forms.
- **Styling**: MUI `sx` prop and Emotion. No CSS files. Theme defined in `@shared/ui/theme.ts`.
- **Routing**: React Router v6 with lazy-loaded pages. Protected/public route wrappers.

## API Endpoints

Base URL: `/api/v1/`

| Resource                          | Endpoint                           |
|-----------------------------------|------------------------------------|
| Auth (JWT)                        | `/auth/token/`, `/auth/token/refresh/`, `/auth/token/verify/` |
| Auth - Change password            | `/auth/change-password/`           |
| Auth - Set initial password       | `/auth/set-initial-password/`      |
| Auth - Current user               | `/auth/me/`                        |
| Auth - Dashboard preferences      | `/auth/dashboard-preferences/`     |
| Campaigns                         | `/campaigns/`                      |
| Campaign Teams                    | `/campaign-teams/`                 |
| Campaign Documents                | `/campaign-documents/`             |
| FSECs                             | `/fsecs/`                          |
| FSEC Teams                        | `/fsec-teams/`                     |
| FSEC Documents                    | `/fsec-documents/`                 |
| FAs (Failure Analysis)            | `/fas/`                            |
| Embases                           | `/embases/`                        |
| Etalonnages                       | `/etalonnages/`                    |
| Assembly Steps                    | `/assembly-steps/`                 |
| Metrology Steps                   | `/metrology-steps/`                |
| Sealing Steps                     | `/sealing-steps/`                  |
| Pictures Steps                    | `/pictures-steps/`                 |
| Photo Views                       | `/photo-views/`                    |
| Airtightness Test LP Steps        | `/airtightness-test-lp-steps/`     |
| Gas Filling BP Steps              | `/gas-filling-bp-steps/`           |
| Gas Filling HP Steps              | `/gas-filling-hp-steps/`           |
| Permeation Steps                  | `/permeation-steps/`               |
| Depressurization Steps            | `/depressurization-steps/`         |
| Repressurization Steps            | `/repressurization-steps/`         |
| All Gas Steps (aggregated)        | `/all-gas-steps/`                  |
| Dashboard (aggregated read-only)  | `/dashboard/`                      |
| Users (admin)                     | `/users/`                          |
| Planning                          | `/planning/` (sub-routes for week-states, members, etc.) |

All endpoints support standard REST operations (GET list, GET detail, POST, PUT, PATCH, DELETE) with UUID-based lookups.

## Error Handling

Backend domain exceptions are automatically converted to JSON responses by `ErrorHandlerMiddleware`:

| Exception             | HTTP Status | Error Code Pattern          |
|-----------------------|-------------|-----------------------------|
| `NotFoundException`   | 404         | `<RESOURCE>_NOT_FOUND`      |
| `ConflictException`   | 409         | `CONFLICT_<FIELD>`          |
| `ValidationException` | 400         | `VALIDATION_ERROR_<FIELD>`  |
| `InvalidDataException`| 400         | `INVALID_DATA`              |

Response format: `{ "error": "...", "type": "...", "code": "...", "status": N }`

## Testing Strategy

### Backend (pytest)

Three test tiers marked with pytest markers:

- **`@pytest.mark.unit`**: Fast tests, no DB. Mock repositories. Located in `app/tests/unit/`. Coverage threshold: 80%.
- **`@pytest.mark.integration`**: Real DB via Django test client. Located in `app/tests/integration/`. Coverage threshold: 70%.
- **`@pytest.mark.service`**: Workflow-level tests with mocked repositories. Located in `app/tests/service/`.

**Patterns:**
- Fixtures in `app/tests/conftest.py` (sample beans, mock repositories).
- Factory Boy factories in `app/tests/factories.py` for generating test data.
- Unit tests mock the repository interface and test service functions directly.
- Integration tests use the Django test client against real API endpoints.

### Frontend (Vitest)

- **Unit/Component tests**: Vitest with @testing-library/react. MSW for API mocking. Coverage thresholds: 80% lines, 75% branches, 85% functions.

**Patterns:**
- Custom `renderWithProviders()` wraps components with QueryClient, Router, Localization.
- `setup()` helper adds `userEvent` for interaction testing.
- MSW handlers defined in `src/test/mocks/handlers.ts`.

## Code Style

### Backend (Python)

- **Formatter**: Black, line length 120
- **Import sorting**: isort, profile=black, line length 120
- **Linter**: Flake8, max line length 120, migrations excluded
- **Language**: French comments and docstrings are common (project is French-origin)
- **Naming**: snake_case for functions/variables, PascalCase for classes
- **Domain objects**: `*Bean` suffix for DTOs, `*Entity` suffix for ORM models, `*Controller` suffix for API views

### Frontend (TypeScript)

- **Strict mode**: enabled (noUnusedLocals, noUnusedParameters)
- **Linter**: ESLint with TypeScript and React plugins
- **Component files**: PascalCase `.tsx`
- **Hook/utility files**: camelCase `.ts`
- **Imports**: Use FSD path aliases (`@entities/`, `@features/`, etc.)

## CI Pipeline (.github/workflows/ci.yml)

Triggers on push/PR to `main` and `develop`:

1. **lint-backend**: Black + isort + Flake8
2. **lint-frontend**: ESLint + TypeScript check
3. **test-backend-unit** (needs lint): pytest unit, 80% coverage
4. **test-backend-integration** (needs lint): pytest integration, 70% coverage
5. **test-backend-service** (needs unit + integration): pytest service
6. **test-frontend-unit** (needs lint): Vitest with coverage
7. **build**: Frontend production build check

## Pre-commit Hooks

Configured in `.pre-commit-config.yaml`:
- Black, isort, Flake8 (backend files only)
- trailing-whitespace, end-of-file-fixer, check-yaml, check-json
- check-added-large-files (max 1000KB), check-merge-conflict, detect-private-key
- ESLint + TypeScript check (frontend files only)

## Key Configuration

### Backend Environment (.env)

```
DJANGO_SECRET_KEY=...        # Required in production
DEBUG=true                   # For local development
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DB_ENGINE=django.db.backends.postgresql
DB_NAME=spectre              # Required
DB_USER=spectre
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5432
```

### Frontend Proxy

Vite dev server on port 3000 proxies `/api` requests to `http://localhost:8000` (Django backend).

## Adding a New Domain Feature

Pour le workflow détaillé avec templates de code et validation gates à chaque étape, voir le skill `spectre-dev-assistant/SKILL.md` (Use Case 1).

**Résumé des étapes** : Bean → Repository interface → Service → Entity → Repository impl → Mapper → Serializer → Controller → Route → Migration → Tests (backend), puis Schema Zod → Query keys → Query hooks → Feature components → Page → Route (frontend).