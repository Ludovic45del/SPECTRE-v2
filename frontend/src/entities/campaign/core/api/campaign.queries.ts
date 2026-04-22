/**
 * Campaign API Service - TanStack Query Hooks
 * @module entities/campaign/api
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';
import {
    Campaign,
    CampaignSchema,
    CampaignListSchema,
    CampaignCreate,
    campaignCreateToApi,
    CampaignWithRelations,
    CampaignPatchPayload,
    CampaignPatchSchema,
} from '../model';
import { campaignKeys } from './campaign.keys';
import { getCampaignType, getCampaignStatus, getCampaignInstallation } from '../lib';

/**
 * Hydrate campaign with referential data
 */
function hydrateCampaign(campaign: Campaign): CampaignWithRelations {
    return {
        ...campaign,
        type: getCampaignType(campaign.typeId),
        status: getCampaignStatus(campaign.statusId),
        installation: getCampaignInstallation(campaign.installationId),
    };
}

/**
 * Fetch all campaigns (with hydrated relations)
 */
export function useCampaigns() {
    return useQuery({
        queryKey: campaignKeys.lists(),
        queryFn: async ({ signal }): Promise<CampaignWithRelations[]> => {
            const rawCampaigns = await api.get('/campaigns/', CampaignListSchema, signal);
            return rawCampaigns.map(hydrateCampaign);
        },
        ...QUERY_CACHE_CONFIG,
    });
}

/**
 * Fetch single campaign by UUID (hydrated)
 */
export function useCampaign(uuid: string) {
    return useQuery({
        queryKey: campaignKeys.detail(uuid),
        queryFn: async ({ signal }): Promise<CampaignWithRelations> => {
            const rawCampaign = await api.get(`/campaigns/${uuid}/`, CampaignSchema, signal);
            return hydrateCampaign(rawCampaign);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}

/**
 * Create new campaign
 */
export function useCreateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CampaignCreate): Promise<Campaign> => {
            const apiData = campaignCreateToApi(data);
            const response = await api.post('/campaigns/', apiData);
            return CampaignSchema.parse(response);
        },
        onSuccess: (newCampaign) => {
            const hydrated = hydrateCampaign(newCampaign);
            queryClient.setQueryData<CampaignWithRelations[]>(campaignKeys.lists(), (old) =>
                old ? [...old, hydrated] : [hydrated],
            );
        },
    });
}

/**
 * Update existing campaign
 */
export function useUpdateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ uuid, data }: { uuid: string; data: CampaignCreate }): Promise<Campaign> => {
            const apiData = campaignCreateToApi(data);
            const response = await api.put(`/campaigns/${uuid}/`, apiData);
            return CampaignSchema.parse(response);
        },
        onSuccess: (updatedCampaign, variables) => {
            const hydrated = hydrateCampaign(updatedCampaign);
            queryClient.setQueryData<CampaignWithRelations>(campaignKeys.detail(variables.uuid), hydrated);
            queryClient.setQueryData<CampaignWithRelations[]>(campaignKeys.lists(), (old) =>
                old ? old.map((c) => (c.uuid === variables.uuid ? hydrated : c)) : [hydrated],
            );
        },
    });
}

/**
 * Partial update campaign (e.g. status)
 */
export function usePatchCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ uuid, data }: { uuid: string; data: CampaignPatchPayload }): Promise<Campaign> => {
            const validated = CampaignPatchSchema.parse(data);
            const response = await api.patch(`/campaigns/${uuid}/`, validated);
            return CampaignSchema.parse(response);
        },
        onSuccess: (updatedCampaign, variables) => {
            const hydrated = hydrateCampaign(updatedCampaign);
            queryClient.setQueryData<CampaignWithRelations>(campaignKeys.detail(variables.uuid), hydrated);
            queryClient.setQueryData<CampaignWithRelations[]>(campaignKeys.lists(), (old) =>
                old ? old.map((c) => (c.uuid === variables.uuid ? hydrated : c)) : [hydrated],
            );
        },
    });
}

/**
 * Delete campaign
 */
export function useDeleteCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uuid: string): Promise<void> => {
            await api.delete(`/campaigns/${uuid}/`);
        },
        onSuccess: (_data, uuid) => {
            queryClient.setQueryData<CampaignWithRelations[]>(campaignKeys.lists(), (old) =>
                old ? old.filter((c) => c.uuid !== uuid) : [],
            );
        },
    });
}
