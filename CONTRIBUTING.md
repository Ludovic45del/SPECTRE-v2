# Contributing to SPECTRE-v2

This document covers the CI/CD checks every PR runs through and how to
reproduce them locally before pushing. For project setup (install,
runserver, dev), see the top-level [`README.md`](./README.md).

## Pre-commit hook

Install once:

```bash
pip install pre-commit && pre-commit install
```

The hook runs Black, isort, Flake8, Prettier, ESLint and `tsc --noEmit` on
staged files only — same tools the CI runs.

## CI/CD overview

All workflows live under [`.github/workflows/`](./.github/workflows/). Each
file is scoped to one concern; they run in parallel.

| Workflow                    | Trigger                          | Purpose                                                          |
| --------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `ci.yml`                    | push (main), PR                  | Lint + test + build, backend & frontend, with coverage           |
| `mutation.yml`              | weekly + manual                  | Mutation testing on `app/domain/` via mutmut                     |
| `security-semgrep.yml`      | push (main), PR, weekly          | SAST scan, SARIF upload to the Security tab                      |
| `security-codeql.yml`       | push (main), PR, weekly          | CodeQL on Python + JS/TS                                         |
| `security-gitleaks.yml`     | push (main), PR                  | Secret scan with full git history                                |
| `quality-types.yml`         | push (main), PR                  | mypy progressive (warn-only baseline + strict allowlist)         |
| `quality-deadcode.yml`      | push (main), PR                  | Knip (frontend) + Vulture (backend), advisory                    |
| `frontend-lighthouse.yml`   | PR (frontend changes)            | Lighthouse audits with MSW-mocked backend                        |
| `perf-loadtest.yml`         | nightly + manual                 | k6 smoke + moderate load tests                                   |

## Reproducing each check locally

### Backend

```bash
cd backend && source .venv/bin/activate

# Lint (mirrors lint-backend job)
black --check --diff .
isort --check-only --diff .
flake8 app --max-line-length=120 --exclude=migrations

# Type-check (mirrors quality-types job, warn-only)
mypy app

# Dead code (mirrors quality-deadcode job, advisory)
vulture                              # config in setup.cfg [vulture]

# Tests + coverage
pytest app/tests/unit -m unit --cov=app/domain --cov=app/mapper --cov-fail-under=80
pytest app/tests/integration -m integration --cov=app --cov-fail-under=70

# Dependency CVE scan
pip-audit --requirement requirements.txt --strict
```

### Frontend

```bash
cd frontend

# Lint + format (mirrors lint-frontend job)
npm run lint                                 # ESLint
npx tsc --noEmit                             # type-check (strict on)
npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css}"

# Dead code (mirrors quality-deadcode job, advisory)
npx knip

# Tests + coverage
npm run test:coverage

# Dependency CVE scan
npm audit --audit-level=high

# Lighthouse-mode build smoke check (mirrors frontend-lighthouse job)
npm run build -- --mode lighthouse
npx vite preview --port 4173 --host 127.0.0.1   # in another terminal
npx -y @lhci/cli@latest collect --config=.lighthouserc.json
```

### Load tests (k6)

```bash
# 1. Boot the backend (see backend/README.md or repo README) on port 8000.
# 2. Seed a known user:
cd backend && python manage.py createadmin \
  --email loadtest@spectre.test --password loadtest-password-123

# 3. Run the scripts:
BASE_URL=http://localhost:8000 \
K6_USER=loadtest@spectre.test \
K6_PASSWORD=loadtest-password-123 \
k6 run load-tests/k6/smoke.js
```

See [`load-tests/README.md`](./load-tests/README.md) for the full reference.

### Security scans

```bash
# Semgrep (same rulesets as CI)
pip install semgrep
semgrep scan --config p/default --config p/security-audit \
  --config p/python --config p/django \
  --config p/javascript --config p/typescript --config p/react

# Gitleaks (uses .gitleaks.toml at repo root)
brew install gitleaks   # or go install github.com/gitleaks/gitleaks/v8@latest
gitleaks detect --source . --config .gitleaks.toml --redact

# CodeQL only runs on GitHub-hosted runners.
```

## Coverage policy

Defined in [`codecov.yml`](./codecov.yml):

- **Project coverage**: 70% global, 80% on the backend flag, 70% on the frontend flag.
- **Patch coverage** (new code in PRs): **80%**, no threshold.

The `pytest --cov-fail-under` and Vitest coverage thresholds enforce a
stricter local floor (80% backend unit, 70% backend integration) — Codecov
adds the patch-level gate on top.

## Promoting checks to required

Once each check has run cleanly on `main` for a few days, mark them as
required in **Settings → Branches → Branch protection rules → main**:

- `Lint Backend`, `Lint Frontend`, `Backend Unit Tests`, `Backend Integration Tests (PostgreSQL)`, `Frontend Unit & Component Tests`, `Build Check` *(already running, recommend required)*
- `Semgrep scan`
- `Analyze (python)`, `Analyze (javascript-typescript)` *(CodeQL)*
- `Scan for leaked secrets` *(Gitleaks)*
- `Lighthouse audits` *(PR-only, strict)*
- Codecov status checks: `codecov/project`, `codecov/patch`

Leave `mypy (progressive)`, `Knip (frontend)`, `Vulture (backend)` as
**advisory** until the legacy backlog is cleaned up.

## Required GitHub secrets

| Secret             | Used by                | Notes                                                                 |
| ------------------ | ---------------------- | --------------------------------------------------------------------- |
| `CODECOV_TOKEN`    | `ci.yml`               | Get it after activating the repo on https://app.codecov.io            |
| `GITHUB_TOKEN`     | every workflow         | Provided automatically by GitHub Actions; nothing to do               |

No paid Semgrep AppSec, Snyk or Lighthouse server token is needed for the
default OSS configuration.
