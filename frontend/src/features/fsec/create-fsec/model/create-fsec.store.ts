/**
 * Create FSEC Form Store - Zustand
 * @module features/create-fsec/model
 *
 * Client state for FSEC creation modal
 */

import { create } from 'zustand';

interface CreateFsecState {
    isOpen: boolean;
    preselectedCampaignId: string | null;

    // Actions
    open: (campaignId?: string) => void;
    close: () => void;
    reset: () => void;
}

export const useCreateFsecStore = create<CreateFsecState>((set) => ({
    isOpen: false,
    preselectedCampaignId: null,

    open: (campaignId?: string) => set({ isOpen: true, preselectedCampaignId: campaignId ?? null }),
    close: () => set({ isOpen: false }),
    reset: () => set({ isOpen: false, preselectedCampaignId: null }),
}));
