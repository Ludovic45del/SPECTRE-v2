/**
 * Embase Query Keys - TanStack Query Key Factory
 * @module entities/embase/api
 */

export const embaseKeys = {
    all: ['embases'] as const,
    lists: () => [...embaseKeys.all, 'list'] as const,
    details: () => [...embaseKeys.all, 'detail'] as const,
    detail: (uuid: string) => [...embaseKeys.details(), uuid] as const,
    fsecHistory: (uuid: string) => [...embaseKeys.all, 'fsec-history', uuid] as const,
};
