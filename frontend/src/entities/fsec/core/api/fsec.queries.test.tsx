/**
 * FSEC Queries Tests
 *
 * Tests for TanStack Query hooks for FSEC operations using MSW.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { useFsecs, useFsec, useFsecsByCampaign, useCreateFsec, useUpdateFsec, useDeleteFsec } from './fsec.queries';
import { createQueryWrapper, server } from '@test/test-utils';

// Mock data matching FsecApiSchema
const mockFsec = {
    version_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    fsec_uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'FSEC Test 001',
    campaign_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    status_id: 0,
    category_id: 0,
    rack_id: null,
    comments: 'Test comments',
    is_active: true,
    depressurization_failed: null,
    created_at: '2025-01-15T10:00:00Z',
    last_updated: '2025-01-15T10:00:00Z',
    delivery_date: null,
    shooting_date: null,
    preshooting_pressure: null,
    experience_srxx: null,
    localisation: null,
};

const mockFsecList = [
    mockFsec,
    {
        ...mockFsec,
        version_uuid: 'd4e5f6a7-b8c9-0123-defa-234567890123',
        fsec_uuid: 'e5f6a7b8-c9d0-1234-efab-345678901234',
        name: 'FSEC Test 002',
    },
    {
        ...mockFsec,
        version_uuid: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
        fsec_uuid: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
        name: 'FSEC Test 003',
    },
];

const campaignUuid = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const versionUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// ============================================================================
// useFsecs TESTS
// ============================================================================

describe('useFsecs', () => {
    beforeEach(() => {
        server.use(
            http.get('/api/v1/fsecs/', () => {
                return HttpResponse.json(mockFsecList);
            }),
        );
    });

    it('should fetch all FSECs', async () => {
        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsecs(), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(3);
        expect(result.current.data?.[0].name).toBe('FSEC Test 001');
    });

    it('should handle empty response', async () => {
        server.use(
            http.get('/api/v1/fsecs/', () => {
                return HttpResponse.json([]);
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsecs(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(0);
    });

    it('should handle server error', async () => {
        server.use(
            http.get('/api/v1/fsecs/', () => {
                return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsecs(), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('should return JSON content type', async () => {
        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsecs(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(Array.isArray(result.current.data)).toBe(true);
    });
});

// ============================================================================
// useFsec TESTS
// ============================================================================

describe('useFsec', () => {
    beforeEach(() => {
        server.use(
            http.get(`/api/v1/fsecs/${versionUuid}/`, () => {
                return HttpResponse.json(mockFsec);
            }),
        );
    });

    it('should fetch single FSEC by version UUID', async () => {
        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsec(versionUuid), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.versionUuid).toBe(versionUuid);
        expect(result.current.data?.name).toBe('FSEC Test 001');
    });

    it('should not fetch when versionUuid is empty', async () => {
        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsec(''), { wrapper });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('should handle 404 error', async () => {
        server.use(
            http.get(`/api/v1/fsecs/${versionUuid}/`, () => {
                return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsec(versionUuid), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('should handle server error', async () => {
        server.use(
            http.get(`/api/v1/fsecs/${versionUuid}/`, () => {
                return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsec(versionUuid), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ============================================================================
// useFsecsByCampaign TESTS
// ============================================================================

describe('useFsecsByCampaign', () => {
    beforeEach(() => {
        server.use(
            http.get(`/api/v1/fsecs/campaign/${campaignUuid}/`, () => {
                return HttpResponse.json(mockFsecList);
            }),
        );
    });

    it('should fetch FSECs by campaign UUID', async () => {
        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsecsByCampaign(campaignUuid), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(3);
    });

    it('should not fetch when campaignUuid is empty', async () => {
        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsecsByCampaign(''), { wrapper });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('should handle empty response', async () => {
        server.use(
            http.get(`/api/v1/fsecs/campaign/${campaignUuid}/`, () => {
                return HttpResponse.json([]);
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsecsByCampaign(campaignUuid), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(0);
    });

    it('should handle server error', async () => {
        server.use(
            http.get(`/api/v1/fsecs/campaign/${campaignUuid}/`, () => {
                return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsecsByCampaign(campaignUuid), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ============================================================================
// useCreateFsec TESTS
// ============================================================================

describe('useCreateFsec', () => {
    it('should create FSEC successfully', async () => {
        server.use(
            http.post('/api/v1/fsecs/', async ({ request }) => {
                const body = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json(
                    {
                        ...mockFsec,
                        version_uuid: '11111111-2222-3333-4444-555555555555',
                        fsec_uuid: '66666666-7777-8888-9999-aaaaaaaaaaaa',
                        ...body,
                    },
                    { status: 201 },
                );
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useCreateFsec(), { wrapper });

        const newFsec = {
            name: 'New FSEC',
            campaignId: campaignUuid,
            statusId: 0,
            categoryId: 1,
            rackId: null,
            comments: 'New FSEC comments',
        };

        result.current.mutate(newFsec);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.name).toBe('New FSEC');
    });

    it('should handle validation error', async () => {
        server.use(
            http.post('/api/v1/fsecs/', () => {
                return HttpResponse.json({ error: 'Validation Error' }, { status: 400 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useCreateFsec(), { wrapper });

        result.current.mutate({
            name: '',
            campaignId: '',
            statusId: 0,
            categoryId: 0,
            rackId: null,
            comments: null,
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('should handle server error', async () => {
        server.use(
            http.post('/api/v1/fsecs/', () => {
                return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useCreateFsec(), { wrapper });

        result.current.mutate({
            name: 'Test FSEC',
            campaignId: campaignUuid,
            statusId: 0,
            categoryId: 0,
            rackId: null,
            comments: null,
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ============================================================================
// useUpdateFsec TESTS
// ============================================================================

describe('useUpdateFsec', () => {
    it('should update FSEC successfully', async () => {
        server.use(
            http.put(`/api/v1/fsecs/${versionUuid}/`, async ({ request }) => {
                const body = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json({
                    ...mockFsec,
                    ...body,
                });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useUpdateFsec(), { wrapper });

        result.current.mutate({
            versionUuid: versionUuid,
            data: {
                name: 'Updated FSEC',
                campaignId: campaignUuid,
                statusId: 1,
                categoryId: 0,
                rackId: null,
                comments: 'Updated comments',
            },
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.name).toBe('Updated FSEC');
    });

    it('should handle not found error', async () => {
        server.use(
            http.put('/api/v1/fsecs/:uuid/', () => {
                return new HttpResponse(null, { status: 404 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useUpdateFsec(), { wrapper });

        result.current.mutate({
            versionUuid: 'non-existent-uuid',
            data: {
                name: 'Test',
                campaignId: campaignUuid,
                statusId: 0,
                categoryId: 0,
                rackId: null,
                comments: null,
            },
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('should handle server error', async () => {
        server.use(
            http.put(`/api/v1/fsecs/${versionUuid}/`, () => {
                return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useUpdateFsec(), { wrapper });

        result.current.mutate({
            versionUuid: versionUuid,
            data: {
                name: 'Test',
                campaignId: campaignUuid,
                statusId: 0,
                categoryId: 0,
                rackId: null,
                comments: null,
            },
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ============================================================================
// useDeleteFsec TESTS
// ============================================================================

describe('useDeleteFsec', () => {
    it('should delete FSEC successfully', async () => {
        let deleteCalled = false;

        server.use(
            http.delete(`/api/v1/fsecs/${versionUuid}/`, () => {
                deleteCalled = true;
                return new HttpResponse(null, { status: 204 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteFsec(), { wrapper });

        result.current.mutate(versionUuid);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(deleteCalled).toBe(true);
    });

    it('should handle not found error', async () => {
        server.use(
            http.delete('/api/v1/fsecs/:uuid/', () => {
                return new HttpResponse(null, { status: 404 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteFsec(), { wrapper });

        result.current.mutate('non-existent-uuid');

        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('should handle server error', async () => {
        server.use(
            http.delete('/api/v1/fsecs/:uuid/', () => {
                return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteFsec(), { wrapper });

        result.current.mutate(versionUuid);

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ============================================================================
// CACHE INVALIDATION TESTS
// ============================================================================

describe('Cache Invalidation', () => {
    it('should invalidate FSEC list query after create', async () => {
        let fetchCount = 0;

        server.use(
            http.get('/api/v1/fsecs/', () => {
                fetchCount++;
                return HttpResponse.json(mockFsecList);
            }),
            http.post('/api/v1/fsecs/', () => {
                return HttpResponse.json(mockFsec, { status: 201 });
            }),
        );

        const wrapper = createQueryWrapper();

        // First, fetch the list
        const { result: listResult } = renderHook(() => useFsecs(), { wrapper });
        await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

        const initialFetchCount = fetchCount;

        // Then create a new FSEC
        const { result: createResult } = renderHook(() => useCreateFsec(), { wrapper });
        createResult.current.mutate({
            name: 'New FSEC',
            campaignId: campaignUuid,
            statusId: 0,
            categoryId: 0,
            rackId: null,
            comments: null,
        });

        await waitFor(() => expect(createResult.current.isSuccess).toBe(true));

        // The list should be refetched due to invalidation
        await waitFor(() => expect(fetchCount).toBeGreaterThan(initialFetchCount));
    });

    it('should invalidate FSEC detail query after update', async () => {
        let detailFetchCount = 0;

        server.use(
            http.get(`/api/v1/fsecs/${versionUuid}/`, () => {
                detailFetchCount++;
                return HttpResponse.json(mockFsec);
            }),
            http.put(`/api/v1/fsecs/${versionUuid}/`, () => {
                return HttpResponse.json({ ...mockFsec, name: 'Updated' });
            }),
        );

        const wrapper = createQueryWrapper();

        // First, fetch the detail
        const { result: detailResult } = renderHook(() => useFsec(versionUuid), { wrapper });
        await waitFor(() => expect(detailResult.current.isSuccess).toBe(true));

        const initialFetchCount = detailFetchCount;

        // Then update the FSEC
        const { result: updateResult } = renderHook(() => useUpdateFsec(), { wrapper });
        updateResult.current.mutate({
            versionUuid: versionUuid,
            data: {
                name: 'Updated FSEC',
                campaignId: campaignUuid,
                statusId: 0,
                categoryId: 0,
                rackId: null,
                comments: null,
            },
        });

        await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));

        // The detail should be refetched due to invalidation
        await waitFor(() => expect(detailFetchCount).toBeGreaterThan(initialFetchCount));
    });

    it('should invalidate campaign FSECs query after create', async () => {
        let campaignFetchCount = 0;

        server.use(
            http.get(`/api/v1/fsecs/campaign/${campaignUuid}/`, () => {
                campaignFetchCount++;
                return HttpResponse.json(mockFsecList);
            }),
            http.post('/api/v1/fsecs/', () => {
                return HttpResponse.json(mockFsec, { status: 201 });
            }),
        );

        const wrapper = createQueryWrapper();

        // First, fetch campaign FSECs
        const { result: campaignResult } = renderHook(() => useFsecsByCampaign(campaignUuid), { wrapper });
        await waitFor(() => expect(campaignResult.current.isSuccess).toBe(true));

        const initialFetchCount = campaignFetchCount;

        // Then create a new FSEC
        const { result: createResult } = renderHook(() => useCreateFsec(), { wrapper });
        createResult.current.mutate({
            name: 'New FSEC',
            campaignId: campaignUuid,
            statusId: 0,
            categoryId: 0,
            rackId: null,
            comments: null,
        });

        await waitFor(() => expect(createResult.current.isSuccess).toBe(true));

        // The campaign list should be refetched due to invalidation
        await waitFor(() => expect(campaignFetchCount).toBeGreaterThan(initialFetchCount));
    });

    it('should invalidate list query after delete', async () => {
        let fetchCount = 0;

        server.use(
            http.get('/api/v1/fsecs/', () => {
                fetchCount++;
                return HttpResponse.json(mockFsecList);
            }),
            http.delete(`/api/v1/fsecs/${versionUuid}/`, () => {
                return new HttpResponse(null, { status: 204 });
            }),
        );

        const wrapper = createQueryWrapper();

        // First, fetch the list
        const { result: listResult } = renderHook(() => useFsecs(), { wrapper });
        await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

        const initialFetchCount = fetchCount;

        // Then delete a FSEC
        const { result: deleteResult } = renderHook(() => useDeleteFsec(), { wrapper });
        deleteResult.current.mutate(versionUuid);

        await waitFor(() => expect(deleteResult.current.isSuccess).toBe(true));

        // The list should be refetched due to invalidation
        await waitFor(() => expect(fetchCount).toBeGreaterThan(initialFetchCount));
    });
});

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe('Schema Validation', () => {
    it('should parse FSEC response with all fields', async () => {
        const fullFsec = {
            ...mockFsec,
            version_uuid: '12345678-abcd-1234-abcd-123456789012',
            fsec_uuid: '87654321-dcba-4321-dcba-210987654321',
            name: 'Full FSEC',
            status_id: 1,
            category_id: 2,
            rack_id: 5,
            comments: 'Full comments',
            depressurization_failed: false,
        };

        server.use(
            http.get(`/api/v1/fsecs/${versionUuid}/`, () => {
                return HttpResponse.json(fullFsec);
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsec(versionUuid), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.versionUuid).toBe('12345678-abcd-1234-abcd-123456789012');
        expect(result.current.data?.statusId).toBe(1);
        expect(result.current.data?.categoryId).toBe(2);
        expect(result.current.data?.rackId).toBe(5);
        expect(result.current.data?.depressurizationFailed).toBe(false);
    });

    it('should handle nullable fields', async () => {
        const fsecWithNulls = {
            ...mockFsec,
            name: 'FSEC with nulls',
            rack_id: null,
            comments: null,
            depressurization_failed: null,
        };

        server.use(
            http.get(`/api/v1/fsecs/${versionUuid}/`, () => {
                return HttpResponse.json(fsecWithNulls);
            }),
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useFsec(versionUuid), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.rackId).toBeNull();
        expect(result.current.data?.comments).toBeNull();
        expect(result.current.data?.depressurizationFailed).toBeNull();
    });
});
