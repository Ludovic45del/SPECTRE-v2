/**
 * Metrology Step Queries - Tests
 * @module entities/steps/api
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@test/test-utils';
import { useMetrologyStepsByFsec, useMetrologyStep } from './metrology.queries';

describe('Metrology Step Queries', () => {
    describe('useMetrologyStepsByFsec', () => {
        it('fetches metrology steps for a FSEC', async () => {
            const fsecVersionUuid = crypto.randomUUID();
            const { result } = renderHook(() => useMetrologyStepsByFsec(fsecVersionUuid), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBeDefined();
            expect(Array.isArray(result.current.data)).toBe(true);
        });

        it('does not fetch when fsecVersionUuid is empty', () => {
            const { result } = renderHook(() => useMetrologyStepsByFsec(''), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
        });
    });

    describe('useMetrologyStep', () => {
        it('fetches a single metrology step', async () => {
            const uuid = crypto.randomUUID();
            const { result } = renderHook(() => useMetrologyStep(uuid), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBeDefined();
        });

        it('does not fetch when uuid is empty', () => {
            const { result } = renderHook(() => useMetrologyStep(''), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
        });
    });
});
