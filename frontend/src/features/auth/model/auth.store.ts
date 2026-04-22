/**
 * Auth Store - JWT Authentication state management
 * @module features/auth/model
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthTokens {
    access: string;
    refresh: string;
}

interface AuthState {
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    /** True right after login, consumed by MainLayout to show splash */
    showSplash: boolean;
    /** Role metier SPECTRE de l'utilisateur connecte */
    role: string | null;
    /** True si l'utilisateur doit changer son mot de passe */
    forcePasswordChange: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    getAccessToken: () => string | null;
    clearSplash: () => void;
}

const API_BASE_URL = '/api/v1';

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            showSplash: false,
            role: null,
            forcePasswordChange: false,

            login: async (username: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/token/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(
                            typeof errorData.detail === 'string' ? errorData.detail : 'Identifiants invalides',
                        );
                    }

                    const data = await response.json();
                    const tokens: AuthTokens = { access: data.access, refresh: data.refresh };
                    set({
                        tokens,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                        showSplash: true,
                        role: data.role ?? null,
                        forcePasswordChange: data.force_password_change ?? false,
                    });
                    return true;
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Erreur de connexion';
                    set({ isLoading: false, error: message });
                    return false;
                }
            },

            logout: async () => {
                const { tokens } = get();
                if (tokens?.refresh) {
                    try {
                        await fetch(`${API_BASE_URL}/auth/token/blacklist/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refresh: tokens.refresh }),
                        });
                    } catch (err: unknown) {
                        if (import.meta.env.DEV) {
                            console.warn('Failed to blacklist refresh token:', err);
                        }
                    }
                }
                set({ tokens: null, isAuthenticated: false, error: null, role: null, forcePasswordChange: false });
            },

            refreshToken: async () => {
                const { tokens } = get();
                if (!tokens?.refresh) return false;

                try {
                    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh: tokens.refresh }),
                    });

                    if (!response.ok) {
                        set({ tokens: null, isAuthenticated: false });
                        return false;
                    }

                    const data = await response.json();
                    if (typeof data.access !== 'string') {
                        set({ tokens: null, isAuthenticated: false });
                        return false;
                    }
                    set({ tokens: { access: data.access, refresh: data.refresh ?? tokens.refresh } });
                    return true;
                } catch {
                    set({ tokens: null, isAuthenticated: false });
                    return false;
                }
            },

            getAccessToken: () => {
                const { tokens } = get();
                return tokens?.access || null;
            },

            clearSplash: () => set({ showSplash: false }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                tokens: state.tokens,
                isAuthenticated: state.isAuthenticated,
                role: state.role,
                forcePasswordChange: state.forcePasswordChange,
            }),
            onRehydrateStorage: () => (state) => {
                // Validate rehydrated state: if tokens are missing/corrupt, force logout
                if (state && state.isAuthenticated && (!state.tokens?.access || !state.tokens?.refresh)) {
                    state.tokens = null;
                    state.isAuthenticated = false;
                }
            },
        },
    ),
);
