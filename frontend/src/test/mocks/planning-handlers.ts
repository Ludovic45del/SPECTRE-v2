/**
 * Planning MSW handlers & mock data factories for tests.
 */
import { http, HttpResponse } from 'msw';

export const createMockWeekState = (overrides: Record<string, unknown> = {}) => ({
    uuid: crypto.randomUUID(),
    year: 2025,
    week_num: 10,
    state: 'vacances' as const,
    ...overrides,
});

export const createMockMemberPeriod = (overrides: Record<string, unknown> = {}) => ({
    uuid: crypto.randomUUID(),
    member_name: 'Dupont Jean',
    member_role: 'Assembleur',
    year: 2025,
    period_type: 'congés' as const,
    commentaire: null,
    start_date: '2025-03-10',
    end_date: '2025-03-14',
    ...overrides,
});

export const createMockCampaignStep = (overrides: Record<string, unknown> = {}) => ({
    uuid: crypto.randomUUID(),
    campaign_uuid: crypto.randomUUID(),
    fsec_uuid: crypto.randomUUID(),
    step_label: 'Assemblage',
    year: 2025,
    start_date: '2025-04-01',
    end_date: '2025-04-15',
    ...overrides,
});

export const createMockLabSalle = (overrides: Record<string, unknown> = {}) => ({
    uuid: crypto.randomUUID(),
    name: 'A1',
    sort_order: 0,
    machines: [],
    ...overrides,
});

/** Default planning handlers — return empty arrays for all endpoints */
export const planningHandlers = [
    http.get('/api/v1/planning/week-states/', () => HttpResponse.json([])),
    http.get('/api/v1/planning/member-periods/', () => HttpResponse.json([])),
    http.get('/api/v1/planning/cell-annotations/', () => HttpResponse.json([])),
    http.get('/api/v1/planning/fsec-cell-links/', () => HttpResponse.json([])),
    http.get('/api/v1/planning/campaign-steps/', () => HttpResponse.json([])),
    http.get('/api/v1/planning/lab-salles/', () => HttpResponse.json([])),
    http.get('/api/v1/planning/lab-events/', () => HttpResponse.json([])),
    http.get('/api/v1/campaigns/', () => HttpResponse.json([])),
    http.get('/api/v1/fsecs/', () => HttpResponse.json([])),
];

/** Planning handlers with custom data */
export function planningHandlersWithData(data: {
    weekStates?: unknown[];
    memberPeriods?: unknown[];
    cellAnnotations?: unknown[];
    fsecCellLinks?: unknown[];
    campaignSteps?: unknown[];
    salles?: unknown[];
    labEvents?: unknown[];
    campaigns?: unknown[];
    fsecs?: unknown[];
}) {
    return [
        http.get('/api/v1/planning/week-states/', () => HttpResponse.json(data.weekStates ?? [])),
        http.get('/api/v1/planning/member-periods/', () => HttpResponse.json(data.memberPeriods ?? [])),
        http.get('/api/v1/planning/cell-annotations/', () => HttpResponse.json(data.cellAnnotations ?? [])),
        http.get('/api/v1/planning/fsec-cell-links/', () => HttpResponse.json(data.fsecCellLinks ?? [])),
        http.get('/api/v1/planning/campaign-steps/', () => HttpResponse.json(data.campaignSteps ?? [])),
        http.get('/api/v1/planning/lab-salles/', () => HttpResponse.json(data.salles ?? [])),
        http.get('/api/v1/planning/lab-events/', () => HttpResponse.json(data.labEvents ?? [])),
        http.get('/api/v1/campaigns/', () => HttpResponse.json(data.campaigns ?? [])),
        http.get('/api/v1/fsecs/', () => HttpResponse.json(data.fsecs ?? [])),
    ];
}
