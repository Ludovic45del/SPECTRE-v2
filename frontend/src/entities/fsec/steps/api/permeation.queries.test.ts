/**
 * Permeation Step Queries - Tests
 * @module entities/steps/api
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@test/test-utils';
import { usePermeationStepsByFsec, usePermeationStep } from './permeation.queries';

describe('Permeation Step Queries', () => {
    describe('usePermeationStepsByFsec', () => {
        it('fetches permeation steps for a FSEC', async () => {
            const fsecVersionUuid = crypto.randomUUID();
            const { result } = renderHook(() => usePermeationStepsByFsec(fsecVersionUuid), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBeDefined();
            expect(Array.isArray(result.current.data)).toBe(true);
        });

        it('does not fetch when fsecVersionUuid is empty', () => {
            const { result } = renderHook(() => usePermeationStepsByFsec(''), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
        });
    });

    describe('usePermeationStep', () => {
        it('fetches a single permeation step', async () => {
            const uuid = crypto.randomUUID();
            const { result } = renderHook(() => usePermeationStep(uuid), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBeDefined();
        });

        it('does not fetch when uuid is empty', () => {
            const { result } = renderHook(() => usePermeationStep(''), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
        });
    });
});
