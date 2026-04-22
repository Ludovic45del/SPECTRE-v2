/**
 * Campaign Query Keys - TanStack Query Key Factory
 * @module entities/campaign/api
 *
 * Pattern from Front_Implementation.md section 2.3
 */

export const campaignKeys = {
    all: ['campaigns'] as const,
    lists: () => [...campaignKeys.all, 'list'] as const,
    details: () => [...campaignKeys.all, 'detail'] as const,
    detail: (uuid: string) => [...campaignKeys.details(), uuid] as const,
};
