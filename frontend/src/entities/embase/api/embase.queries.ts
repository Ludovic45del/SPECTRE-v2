/**
 * Embase API Service - TanStack Query Hooks
 * @module entities/embase/api
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';
import {
    Embase,
    EmbaseSchema,
    EmbaseListSchema,
    EmbaseCreate,
    embaseCreateToApi,
    type EmbaseFsecHistoryItem,
    EmbaseFsecHistoryListSchema,
} from '../model';
import { embaseKeys } from './embase.keys';

/**
 * Fetch all embases
 */
export function useEmbases() {
    return useQuery({
        queryKey: embaseKeys.lists(),
        queryFn: async ({ signal }): Promise<Embase[]> => {
            return api.get('/embases/', EmbaseListSchema, signal);
        },
        ...QUERY_CACHE_CONFIG,
    });
}

/**
 * Fetch single embase by UUID
 */
export function useEmbase(uuid: string) {
    return useQuery({
        queryKey: embaseKeys.detail(uuid),
        queryFn: async ({ signal }): Promise<Embase> => {
            return api.get(`/embases/${uuid}/`, EmbaseSchema, signal);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}

/**
 * Create new embase
 */
export function useCreateEmbase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: EmbaseCreate): Promise<Embase> => {
            const apiData = embaseCreateToApi(data);
            return api.post('/embases/', apiData, EmbaseSchema);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: embaseKeys.lists() });
        },
    });
}

/**
 * Update embase
 */
export function useUpdateEmbase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ uuid, data }: { uuid: string; data: EmbaseCreate }): Promise<Embase> => {
            const apiData = embaseCreateToApi(data);
            return api.put(`/embases/${uuid}/`, apiData, EmbaseSchema);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: embaseKeys.lists() });
            queryClient.invalidateQueries({ queryKey: embaseKeys.detail(variables.uuid) });
        },
    });
}

/**
 * Delete embase
 */
export function useDeleteEmbase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uuid: string): Promise<void> => {
            await api.delete(`/embases/${uuid}/`);
        },
        onSuccess: (_, uuid) => {
            queryClient.invalidateQueries({ queryKey: embaseKeys.lists() });
            queryClient.removeQueries({ queryKey: embaseKeys.detail(uuid) });
        },
    });
}

/**
 * Fetch FSEC history for an embase (FSECs where this embase was used)
 */
export function useEmbaseFsecHistory(uuid: string) {
    return useQuery({
        queryKey: embaseKeys.fsecHistory(uuid),
        queryFn: async ({ signal }): Promise<EmbaseFsecHistoryItem[]> => {
            return api.get(`/embases/${uuid}/fsec-history/`, EmbaseFsecHistoryListSchema, signal);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}
