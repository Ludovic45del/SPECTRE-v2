/**
 * Smoke test — sanity check that critical endpoints respond under
 * trivial load. Runs in ~30s with a single virtual user. Use this on every
 * deploy, including PR runs if you want.
 *
 * Run locally:
 *   BASE_URL=http://localhost:8000 K6_USER=admin@spectre.test \
 *   K6_PASSWORD=changeme k6 run load-tests/k6/smoke.js
 */
import { check, group, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const USER = __ENV.K6_USER || 'loadtest@spectre.test';
const PASSWORD = __ENV.K6_PASSWORD || 'loadtest-password-123';

export const options = {
    vus: 1,
    duration: '30s',
    thresholds: {
        http_req_failed: ['rate<0.01'], // <1% of requests may fail
        http_req_duration: ['p(95)<500'], // 95th percentile under 500ms
        checks: ['rate>0.99'],
    },
};

function login() {
    const res = http.post(
        `${BASE_URL}/api/v1/auth/token/`,
        JSON.stringify({ email: USER, password: PASSWORD }),
        { headers: { 'Content-Type': 'application/json' }, tags: { name: 'auth_login' } },
    );
    check(res, { 'login 200': (r) => r.status === 200 });
    return res.json('access');
}

export function setup() {
    return { token: login() };
}

export default function (data) {
    const headers = { Authorization: `Bearer ${data.token}` };

    group('auth/me', () => {
        const res = http.get(`${BASE_URL}/api/v1/auth/me/`, { headers, tags: { name: 'auth_me' } });
        check(res, { 'me 200': (r) => r.status === 200 });
    });

    group('dashboard', () => {
        const res = http.get(`${BASE_URL}/api/v1/dashboard/`, {
            headers,
            tags: { name: 'dashboard' },
        });
        check(res, { 'dashboard 200': (r) => r.status === 200 });
    });

    sleep(1);
}
