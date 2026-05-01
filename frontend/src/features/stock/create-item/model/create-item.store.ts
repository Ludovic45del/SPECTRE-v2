/**
 * Create Catalog Item Modal Store — Zustand.
 *
 * Pilote le flux de création en 2 étapes :
 * 1. Choix du kind (élément sérialisé / consommable)
 * 2. Formulaire adaptatif au kind
 */

import { create } from 'zustand';
import { ITEM_KIND, type ItemKind } from '@entities/stock-item';

type Step = 'kind' | 'form';

interface CreateItemState {
    isOpen: boolean;
    step: Step;
    selectedKind: ItemKind;
    open: () => void;
    close: () => void;
    selectKind: (kind: ItemKind) => void;
    goToKindStep: () => void;
    goToFormStep: () => void;
    reset: () => void;
}

const INITIAL_KIND: ItemKind = ITEM_KIND.ELEMENT;

export const useCreateItemStore = create<CreateItemState>((set) => ({
    isOpen: false,
    step: 'kind',
    selectedKind: INITIAL_KIND,

    open: () => set({ isOpen: true, step: 'kind', selectedKind: INITIAL_KIND }),
    close: () => set({ isOpen: false }),
    selectKind: (kind) => set({ selectedKind: kind }),
    goToKindStep: () => set({ step: 'kind' }),
    goToFormStep: () => set({ step: 'form' }),
    reset: () => set({ isOpen: false, step: 'kind', selectedKind: INITIAL_KIND }),
}));
