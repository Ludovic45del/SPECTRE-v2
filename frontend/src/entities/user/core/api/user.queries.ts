/**
 * User API Service - TanStack Query Hooks
 * @module entities/user/api
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';
import {
    PasswordResetResponseSchema,
    UserCreatedSchema,
    UserListSchema,
    UserSchema,
    type UserCreateForm,
    type UserUpdateForm,
    userCreateToApi,
    userUpdateToApi,
    type User,
    type UserCreated,
    type PasswordResetResponse,
    ChangePasswordResponseSchema,
    type ChangePasswordResponse,
    SetInitialPasswordResponseSchema,
    type SetInitialPasswordResponse,
} from '../model';
import { userKeys } from './user.keys';

// --- Queries ---

export function useUsers() {
    return useQuery({
        queryKey: userKeys.lists(),
        queryFn: ({ signal }): Promise<User[]> => api.get('/users/', UserListSchema, signal),
        ...QUERY_CACHE_CONFIG,
    });
}

export function useMe() {
    return useQuery({
        queryKey: userKeys.me(),
        queryFn: ({ signal }): Promise<User> => api.get('/auth/me/', UserSchema, signal),
        staleTime: 5 * 60 * 1000,
    });
}

// --- Mutations ---

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: UserCreateForm): Promise<UserCreated> => {
            const apiData = userCreateToApi(data);
            const response = await api.post('/users/', apiData);
            return UserCreatedSchema.parse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ uuid, data }: { uuid: string; data: UserUpdateForm }): Promise<User> => {
            const apiData = userUpdateToApi(data);
            const response = await api.put(`/users/${uuid}/`, apiData);
            return UserSchema.parse(response);
        },
        onSuccess: (updatedUser) => {
            queryClient.setQueryData<User[]>(userKeys.lists(), (old) =>
                old?.map((u) => (u.uuid === updatedUser.uuid ? updatedUser : u)),
            );
        },
    });
}

export function useToggleUserActive() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (uuid: string): Promise<User> => {
            const response = await api.patch(`/users/${uuid}/toggle/`, {});
            return UserSchema.parse(response);
        },
        onSuccess: (updatedUser) => {
            queryClient.setQueryData<User[]>(userKeys.lists(), (old) =>
                old?.map((u) => (u.uuid === updatedUser.uuid ? updatedUser : u)),
            );
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: async (uuid: string): Promise<PasswordResetResponse> => {
            const response = await api.post(`/users/${uuid}/reset-password/`, {});
            return PasswordResetResponseSchema.parse(response);
        },
    });
}

export function useChangePassword() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            current_password: string;
            new_password: string;
        }): Promise<ChangePasswordResponse> => {
            const response = await api.post('/auth/change-password/', data);
            return ChangePasswordResponseSchema.parse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.me() });
        },
    });
}

export function useSetInitialPassword() {
    return useMutation({
        mutationFn: async (data: {
            token: string;
            new_password: string;
        }): Promise<SetInitialPasswordResponse> => {
            const response = await api.post('/auth/set-initial-password/', data);
            return SetInitialPasswordResponseSchema.parse(response);
        },
    });
}
