/**
 * Create FSEC Form Store - Zustand
 * @module features/create-fsec/model
 *
 * Client state for FSEC creation modal
 */

import { create } from 'zustand';

interface CreateFsecState {
    isOpen: boolean;

    // Actions
    open: () => void;
    close: () => void;
    reset: () => void;
}

export const useCreateFsecStore = create<CreateFsecState>((set) => ({
    isOpen: false,

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    reset: () => set({ isOpen: false }),
}));
