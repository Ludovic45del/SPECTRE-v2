/**
 * Repressurization Steps Queries - TanStack Query Hooks
 * @module entities/steps/api
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';
import { stepKeys } from './steps.keys';
import { RepressurizationStepListSchema, RepressurizationStepSchema, RepressurizationStep } from '../model';

// ============================================================================
// REPRESSURIZATION STEPS (Step ID: 14)
// ============================================================================

export function useRepressurizationStepsByFsec(fsecVersionUuid: string) {
    return useQuery({
        queryKey: stepKeys.repressurization.byFsec(fsecVersionUuid),
        queryFn: async ({ signal }): Promise<RepressurizationStep[]> => {
            const data = await api.get(`/repressurization-steps/fsec/${fsecVersionUuid}/`, undefined, signal);
            return RepressurizationStepListSchema.parse(data);
        },
        enabled: Boolean(fsecVersionUuid),
        ...QUERY_CACHE_CONFIG,
    });
}

export function useRepressurizationStep(uuid: string) {
    return useQuery({
        queryKey: stepKeys.repressurization.detail(uuid),
        queryFn: async ({ signal }): Promise<RepressurizationStep> => {
            const data = await api.get(`/repressurization-steps/${uuid}/`, undefined, signal);
            return RepressurizationStepSchema.parse(data);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}

interface CreateRepressurizationStepInput {
    fsecVersionId: string;
    operator?: string | null;
    gasType?: string | null;
    startDate?: Date | null;
    estimatedEndDate?: Date | null;
    sensorPressure?: number | null;
    computedPressure?: number | null;
}

interface UpdateRepressurizationStepInput extends CreateRepressurizationStepInput {
    uuid: string;
}

export function useCreateRepressurizationStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateRepressurizationStepInput): Promise<RepressurizationStep> => {
            const apiData = {
                fsec_version_id: input.fsecVersionId,
                operator: input.operator ?? null,
                gas_type: input.gasType ?? null,
                start_date: input.startDate?.toISOString().split('T')[0] ?? null,
                estimated_end_date: input.estimatedEndDate?.toISOString().split('T')[0] ?? null,
                sensor_pressure: input.sensorPressure ?? null,
                computed_pressure: input.computedPressure ?? null,
            };
            const response = await api.post('/repressurization-steps/', apiData);
            return RepressurizationStepSchema.parse(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.repressurization.byFsec(variables.fsecVersionId),
            });
        },
    });
}

export function useUpdateRepressurizationStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateRepressurizationStepInput): Promise<RepressurizationStep> => {
            const apiData = {
                fsec_version_id: input.fsecVersionId,
                operator: input.operator ?? null,
                gas_type: input.gasType ?? null,
                start_date: input.startDate?.toISOString().split('T')[0] ?? null,
                estimated_end_date: input.estimatedEndDate?.toISOString().split('T')[0] ?? null,
                sensor_pressure: input.sensorPressure ?? null,
                computed_pressure: input.computedPressure ?? null,
            };
            const response = await api.put(`/repressurization-steps/${input.uuid}/`, apiData);
            return RepressurizationStepSchema.parse(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.repressurization.detail(variables.uuid),
            });
            queryClient.invalidateQueries({
                queryKey: stepKeys.repressurization.byFsec(variables.fsecVersionId),
            });
        },
    });
}

export function useDeleteRepressurizationStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { uuid: string; fsecVersionId: string }): Promise<void> => {
            await api.delete(`/repressurization-steps/${data.uuid}/`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.repressurization.byFsec(variables.fsecVersionId),
            });
        },
    });
}
