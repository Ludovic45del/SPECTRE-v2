/**
 * Moderate load — ramp up to 50 concurrent users over 5 minutes against the
 * read-heavy collection endpoints (campaigns, fsecs, fas, dashboard,
 * etalonnages). Useful as a nightly perf signal.
 *
 * Run locally:
 *   BASE_URL=http://localhost:8000 K6_USER=admin@spectre.test \
 *   K6_PASSWORD=changeme k6 run load-tests/k6/moderate.js
 */
import { check, group, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const USER = __ENV.K6_USER || 'loadtest@spectre.test';
const PASSWORD = __ENV.K6_PASSWORD || 'loadtest-password-123';

export const options = {
    stages: [
        { duration: '1m', target: 10 }, // warm-up
        { duration: '2m', target: 50 }, // ramp to peak
        { duration: '1m', target: 50 }, // steady state
        { duration: '1m', target: 0 }, // ramp down
    ],
    thresholds: {
        http_req_failed: ['rate<0.02'], // <2% errors at peak
        http_req_duration: ['p(95)<1000', 'p(99)<2000'],
        checks: ['rate>0.98'],
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

const READ_ENDPOINTS = [
    { path: '/api/v1/campaigns/', name: 'campaigns_list' },
    { path: '/api/v1/fsecs/', name: 'fsecs_list' },
    { path: '/api/v1/fas/', name: 'fas_list' },
    { path: '/api/v1/embases/', name: 'embases_list' },
    { path: '/api/v1/etalonnages/', name: 'etalonnages_list' },
    { path: '/api/v1/dashboard/', name: 'dashboard' },
];

export default function (data) {
    const headers = { Authorization: `Bearer ${data.token}` };

    for (const ep of READ_ENDPOINTS) {
        group(ep.name, () => {
            const res = http.get(`${BASE_URL}${ep.path}`, { headers, tags: { name: ep.name } });
            check(res, { [`${ep.name} 2xx`]: (r) => r.status >= 200 && r.status < 300 });
        });
    }

    sleep(Math.random() * 2 + 1); // 1-3s think time per iteration
}
