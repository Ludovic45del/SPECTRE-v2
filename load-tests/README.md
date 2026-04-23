# Load tests (k6)

Performance tests for the SPECTRE backend API.

## Scripts

| Script                | Profile                            | Use                                  |
| --------------------- | ---------------------------------- | ------------------------------------ |
| `k6/smoke.js`         | 1 VU · 30 s                        | Sanity check on every deploy         |
| `k6/moderate.js`      | Ramp 0 → 50 VUs · 5 min            | Nightly performance signal           |

## Running locally

Install [k6](https://k6.io/docs/get-started/installation/), then start the
backend (see top-level `README.md`) and a known user:

```bash
cd backend
python manage.py createadmin --email loadtest@spectre.test --password loadtest-password-123
python manage.py runserver 8000
```

Run the smoke test:

```bash
BASE_URL=http://localhost:8000 \
K6_USER=loadtest@spectre.test \
K6_PASSWORD=loadtest-password-123 \
k6 run load-tests/k6/smoke.js
```

## CI

Triggered by `.github/workflows/perf-loadtest.yml`:

- **Nightly** at 02:00 UTC against a backend booted inside the runner.
- **`workflow_dispatch`** with an optional `base_url` input to target an
  external environment (default: in-runner backend).

JSON summaries are uploaded as artifacts (30-day retention).
