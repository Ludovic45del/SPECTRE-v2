/**
 * Repressurization Step Queries - Tests
 * @module entities/steps/api
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@test/test-utils';
import { useRepressurizationStepsByFsec, useRepressurizationStep } from './repressurization.queries';

describe('Repressurization Step Queries', () => {
    describe('useRepressurizationStepsByFsec', () => {
        it('fetches repressurization steps for a FSEC', async () => {
            const fsecVersionUuid = crypto.randomUUID();
            const { result } = renderHook(() => useRepressurizationStepsByFsec(fsecVersionUuid), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBeDefined();
            expect(Array.isArray(result.current.data)).toBe(true);
        });

        it('does not fetch when fsecVersionUuid is empty', () => {
            const { result } = renderHook(() => useRepressurizationStepsByFsec(''), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
        });
    });

    describe('useRepressurizationStep', () => {
        it('fetches a single repressurization step', async () => {
            const uuid = crypto.randomUUID();
            const { result } = renderHook(() => useRepressurizationStep(uuid), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toBeDefined();
        });

        it('does not fetch when uuid is empty', () => {
            const { result } = renderHook(() => useRepressurizationStep(''), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
        });
    });
});
