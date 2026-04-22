/**
 * User Query Keys - TanStack Query Key Factory
 * @module entities/user/api
 */

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (uuid: string) => [...userKeys.details(), uuid] as const,
    me: () => ['auth', 'me'] as const,
};
