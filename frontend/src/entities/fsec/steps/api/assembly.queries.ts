/**
 * Assembly Step Queries - TanStack Query Hooks
 * @module entities/steps/api
 *
 * Endpoint verified: /api/assembly-steps/fsec/{fsec_id}/
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';
import { AssemblyStep, AssemblyStepSchema, AssemblyStepListSchema } from '../model';
import { stepKeys } from './steps.keys';

/**
 * Fetch assembly steps by FSEC version UUID
 */
export function useAssemblyStepsByFsec(fsecVersionUuid: string) {
    return useQuery({
        queryKey: stepKeys.assembly.byFsec(fsecVersionUuid),
        queryFn: async ({ signal }): Promise<AssemblyStep[]> => {
            const data = await api.get(`/assembly-steps/fsec/${fsecVersionUuid}/`, undefined, signal);
            return AssemblyStepListSchema.parse(data);
        },
        enabled: Boolean(fsecVersionUuid),
        ...QUERY_CACHE_CONFIG,
    });
}

/**
 * Fetch single assembly step by UUID
 */
export function useAssemblyStep(uuid: string) {
    return useQuery({
        queryKey: stepKeys.assembly.detail(uuid),
        queryFn: async ({ signal }): Promise<AssemblyStep> => {
            const data = await api.get(`/assembly-steps/${uuid}/`, undefined, signal);
            return AssemblyStepSchema.parse(data);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}

interface CreateAssemblyStepInput {
    fsecVersionId: string;
    hydrometricTemperature?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
    comments?: string | null;
    assemblyBenchIds?: number[];
}

interface UpdateAssemblyStepInput extends CreateAssemblyStepInput {
    uuid: string;
}

/**
 * Create assembly step
 */
export function useCreateAssemblyStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateAssemblyStepInput): Promise<AssemblyStep> => {
            const apiData = {
                fsec_version_id: input.fsecVersionId,
                hydrometric_temperature: input.hydrometricTemperature ?? null,
                start_date: input.startDate?.toISOString().split('T')[0] ?? null,
                end_date: input.endDate?.toISOString().split('T')[0] ?? null,
                comments: input.comments ?? null,
                assembly_bench_ids: input.assemblyBenchIds ?? [],
            };
            const response = await api.post('/assembly-steps/', apiData);
            return AssemblyStepSchema.parse(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.assembly.byFsec(variables.fsecVersionId),
            });
        },
    });
}

/**
 * Update assembly step
 */
export function useUpdateAssemblyStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateAssemblyStepInput): Promise<AssemblyStep> => {
            const apiData = {
                fsec_version_id: input.fsecVersionId,
                hydrometric_temperature: input.hydrometricTemperature ?? null,
                start_date: input.startDate?.toISOString().split('T')[0] ?? null,
                end_date: input.endDate?.toISOString().split('T')[0] ?? null,
                comments: input.comments ?? null,
                assembly_bench_ids: input.assemblyBenchIds ?? [],
            };
            const response = await api.put(`/assembly-steps/${input.uuid}/`, apiData);
            return AssemblyStepSchema.parse(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.assembly.detail(variables.uuid),
            });
            queryClient.invalidateQueries({
                queryKey: stepKeys.assembly.byFsec(variables.fsecVersionId),
            });
        },
    });
}

/**
 * Delete assembly step
 */
export function useDeleteAssemblyStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { uuid: string; fsecVersionId: string }): Promise<void> => {
            await api.delete(`/assembly-steps/${data.uuid}/`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.assembly.byFsec(variables.fsecVersionId),
            });
        },
    });
}
