/**
 * Sealing Step Queries - Tests
 * @module entities/steps/api
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@test/test-utils';
import { useSealingStepByMetrology, useSealingStep } from './sealing.queries';

describe('Sealing Step Queries', () => {
    describe('useSealingStepByMetrology', () => {
        it('fetches sealing step for a metrology step', async () => {
            const metrologyStepId = crypto.randomUUID();
            const { result } = renderHook(() => useSealingStepByMetrology(metrologyStepId), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBeDefined();
        });

        it('does not fetch when metrologyStepId is empty', () => {
            const { result } = renderHook(() => useSealingStepByMetrology(''), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
        });
    });

    describe('useSealingStep', () => {
        it('fetches a single sealing step', async () => {
            const uuid = crypto.randomUUID();
            const { result } = renderHook(() => useSealingStep(uuid), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBeDefined();
        });

        it('does not fetch when uuid is empty', () => {
            const { result } = renderHook(() => useSealingStep(''), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
        });
    });
});
