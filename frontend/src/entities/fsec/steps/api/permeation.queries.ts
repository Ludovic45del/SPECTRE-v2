/**
 * Permeation Steps Queries - TanStack Query Hooks
 * @module entities/steps/api
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';
import { stepKeys } from './steps.keys';
import { PermeationStepListSchema, PermeationStepSchema, PermeationStep } from '../model';

// ============================================================================
// PERMEATION STEPS (Step ID: 12)
// ============================================================================

export function usePermeationStepsByFsec(fsecVersionUuid: string) {
    return useQuery({
        queryKey: stepKeys.permeation.byFsec(fsecVersionUuid),
        queryFn: async ({ signal }): Promise<PermeationStep[]> => {
            const data = await api.get(`/permeation-steps/fsec/${fsecVersionUuid}/`, undefined, signal);
            return PermeationStepListSchema.parse(data);
        },
        enabled: Boolean(fsecVersionUuid),
        ...QUERY_CACHE_CONFIG,
    });
}

export function usePermeationStep(uuid: string) {
    return useQuery({
        queryKey: stepKeys.permeation.detail(uuid),
        queryFn: async ({ signal }): Promise<PermeationStep> => {
            const data = await api.get(`/permeation-steps/${uuid}/`, undefined, signal);
            return PermeationStepSchema.parse(data);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}

interface CreatePermeationStepInput {
    fsecVersionId: string;
    gasType?: string | null;
    targetPressure?: number | null;
    operator?: string | null;
    startDate?: Date | null;
    estimatedEndDate?: Date | null;
    sensorPressure?: number | null;
    computedShotPressure?: number | null;
}

interface UpdatePermeationStepInput extends CreatePermeationStepInput {
    uuid: string;
}

export function useCreatePermeationStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreatePermeationStepInput): Promise<PermeationStep> => {
            const apiData = {
                fsec_version_id: input.fsecVersionId,
                gas_type: input.gasType ?? null,
                target_pressure: input.targetPressure ?? null,
                operator: input.operator ?? null,
                start_date: input.startDate?.toISOString().split('T')[0] ?? null,
                estimated_end_date: input.estimatedEndDate?.toISOString().split('T')[0] ?? null,
                sensor_pressure: input.sensorPressure ?? null,
                computed_shot_pressure: input.computedShotPressure ?? null,
            };
            const response = await api.post('/permeation-steps/', apiData);
            return PermeationStepSchema.parse(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.permeation.byFsec(variables.fsecVersionId),
            });
        },
    });
}

export function useUpdatePermeationStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdatePermeationStepInput): Promise<PermeationStep> => {
            const apiData = {
                fsec_version_id: input.fsecVersionId,
                gas_type: input.gasType ?? null,
                target_pressure: input.targetPressure ?? null,
                operator: input.operator ?? null,
                start_date: input.startDate?.toISOString().split('T')[0] ?? null,
                estimated_end_date: input.estimatedEndDate?.toISOString().split('T')[0] ?? null,
                sensor_pressure: input.sensorPressure ?? null,
                computed_shot_pressure: input.computedShotPressure ?? null,
            };
            const response = await api.put(`/permeation-steps/${input.uuid}/`, apiData);
            return PermeationStepSchema.parse(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.permeation.detail(variables.uuid),
            });
            queryClient.invalidateQueries({
                queryKey: stepKeys.permeation.byFsec(variables.fsecVersionId),
            });
        },
    });
}

export function useDeletePermeationStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { uuid: string; fsecVersionId: string }): Promise<void> => {
            await api.delete(`/permeation-steps/${data.uuid}/`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.permeation.byFsec(variables.fsecVersionId),
            });
        },
    });
}
