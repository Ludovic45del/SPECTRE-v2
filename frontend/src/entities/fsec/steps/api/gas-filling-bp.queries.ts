/**
 * Gas Filling BP (Low Pressure) Steps Queries - TanStack Query Hooks
 * @module entities/steps/api
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';
import { stepKeys } from './steps.keys';
import { GasFillingBpStepListSchema, GasFillingBpStepSchema, GasFillingBpStep } from '../model';

// ============================================================================
// GAS FILLING BP (LOW PRESSURE) STEPS (Step ID: 11)
// ============================================================================

export function useGasFillingBpStepsByFsec(fsecVersionUuid: string) {
    return useQuery({
        queryKey: stepKeys.gasFillingBp.byFsec(fsecVersionUuid),
        queryFn: async ({ signal }): Promise<GasFillingBpStep[]> => {
            const data = await api.get(`/gas-filling-bp-steps/fsec/${fsecVersionUuid}/`, undefined, signal);
            return GasFillingBpStepListSchema.parse(data);
        },
        enabled: Boolean(fsecVersionUuid),
        ...QUERY_CACHE_CONFIG,
    });
}

export function useGasFillingBpStep(uuid: string) {
    return useQuery({
        queryKey: stepKeys.gasFillingBp.detail(uuid),
        queryFn: async ({ signal }): Promise<GasFillingBpStep> => {
            const data = await api.get(`/gas-filling-bp-steps/${uuid}/`, undefined, signal);
            return GasFillingBpStepSchema.parse(data);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}

interface CreateGasFillingBpStepInput {
    fsecVersionId: string;
    leakRateDtri?: string | null;
    gasType?: string | null;
    experimentPressure?: number | null;
    leakTestDuration?: number | null;
    operator?: string | null;
    dateOfFulfilment?: Date | null;
    gasBase?: number | null;
    gasContainer?: number | null;
    observations?: string | null;
}

interface UpdateGasFillingBpStepInput extends CreateGasFillingBpStepInput {
    uuid: string;
}

export function useCreateGasFillingBpStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateGasFillingBpStepInput): Promise<GasFillingBpStep> => {
            const apiData = {
                fsec_version_id: input.fsecVersionId,
                leak_rate_dtri: input.leakRateDtri ?? null,
                gas_type: input.gasType ?? null,
                experiment_pressure: input.experimentPressure ?? null,
                leak_test_duration: input.leakTestDuration ?? null,
                operator: input.operator ?? null,
                date_of_fulfilment: input.dateOfFulfilment?.toISOString().split('T')[0] ?? null,
                gas_base: input.gasBase ?? null,
                gas_container: input.gasContainer ?? null,
                observations: input.observations ?? null,
            };
            const response = await api.post('/gas-filling-bp-steps/', apiData);
            return GasFillingBpStepSchema.parse(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.gasFillingBp.byFsec(variables.fsecVersionId),
            });
        },
    });
}

export function useUpdateGasFillingBpStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateGasFillingBpStepInput): Promise<GasFillingBpStep> => {
            const apiData = {
                fsec_version_id: input.fsecVersionId,
                leak_rate_dtri: input.leakRateDtri ?? null,
                gas_type: input.gasType ?? null,
                experiment_pressure: input.experimentPressure ?? null,
                leak_test_duration: input.leakTestDuration ?? null,
                operator: input.operator ?? null,
                date_of_fulfilment: input.dateOfFulfilment?.toISOString().split('T')[0] ?? null,
                gas_base: input.gasBase ?? null,
                gas_container: input.gasContainer ?? null,
                observations: input.observations ?? null,
            };
            const response = await api.put(`/gas-filling-bp-steps/${input.uuid}/`, apiData);
            return GasFillingBpStepSchema.parse(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.gasFillingBp.detail(variables.uuid),
            });
            queryClient.invalidateQueries({
                queryKey: stepKeys.gasFillingBp.byFsec(variables.fsecVersionId),
            });
        },
    });
}

export function useDeleteGasFillingBpStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { uuid: string; fsecVersionId: string }): Promise<void> => {
            await api.delete(`/gas-filling-bp-steps/${data.uuid}/`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: stepKeys.gasFillingBp.byFsec(variables.fsecVersionId),
            });
        },
    });
}
