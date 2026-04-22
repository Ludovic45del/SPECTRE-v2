/**
 * FSEC Query Keys - TanStack Query Key Factory
 * @module entities/fsec/api
 *
 * Pattern from Front_Implementation.md section 2.3
 */

export const fsecKeys = {
    all: ['fsecs'] as const,
    lists: () => [...fsecKeys.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...fsecKeys.lists(), filters] as const,
    details: () => [...fsecKeys.all, 'detail'] as const,
    detail: (versionUuid: string) => [...fsecKeys.details(), versionUuid] as const,
    byCampaign: (campaignUuid: string) => [...fsecKeys.all, 'campaign', campaignUuid] as const,
};
