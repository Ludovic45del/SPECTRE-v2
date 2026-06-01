/**
 * Stock Catalog Item — TanStack Query hooks.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api';
import { QUERY_CACHE_CONFIG } from '@shared/lib';

import {
    StockAlertsSchema,
    StockCatalogItemListSchema,
    StockCatalogItemPatchSchema,
    StockCatalogItemSchema,
    type StockAlerts,
    type StockCatalogItem,
    type StockCatalogItemPatchPayload,
    type StockCatalogItemPayload,
} from '../model/stock-item.schema';
import {
    StockMovementSchema,
    type StockMovement,
    type StockMovementCreatePayload,
} from '../model/stock-movement.schema';
import {
    stockAlertKeys,
    stockCatalogKeys,
    stockMovementKeys,
    type StockCatalogListFilters,
} from './stock-item.keys';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

function buildQueryString(filters: StockCatalogListFilters): string {
    const params = new URLSearchParams();
    if (filters.kind) params.append('kind', filters.kind);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.installation) params.append('installation', filters.installation);
    if (filters.search.trim()) params.append('search', filters.search.trim());
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/** Liste paginée (page=1 implicite côté backend). */
export function useCatalogItems(filters: StockCatalogListFilters) {
    return useQuery({
        queryKey: stockCatalogKeys.list(filters),
        queryFn: async ({ signal }): Promise<StockCatalogItem[]> => {
            const url = `/stock/catalog/${buildQueryString(filters)}`;
            return api.get(url, StockCatalogItemListSchema, signal);
        },
        // Garde la liste précédente affichée pendant le fetch du nouveau filtre
        // (la query key change à chaque pill) → plus de clignotement skeleton.
        placeholderData: keepPreviousData,
        ...QUERY_CACHE_CONFIG,
    });
}

/** Détail item par UUID. */
export function useCatalogItem(uuid: string) {
    return useQuery({
        queryKey: stockCatalogKeys.detail(uuid),
        queryFn: async ({ signal }): Promise<StockCatalogItem> => {
            return api.get(`/stock/catalog/${uuid}/`, StockCatalogItemSchema, signal);
        },
        enabled: Boolean(uuid),
        ...QUERY_CACHE_CONFIG,
    });
}

/** Liste agrégée des alertes (low_stock / expired / expiring_soon). */
export function useStockAlerts() {
    return useQuery({
        queryKey: stockAlertKeys.all,
        queryFn: async ({ signal }): Promise<StockAlerts> => {
            return api.get('/stock/alerts/', StockAlertsSchema, signal);
        },
        ...QUERY_CACHE_CONFIG,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateCatalogItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: StockCatalogItemPayload): Promise<StockCatalogItem> => {
            const response = await api.post('/stock/catalog/', payload);
            return StockCatalogItemSchema.parse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: stockCatalogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: stockAlertKeys.all });
        },
    });
}

export function usePatchCatalogItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            uuid,
            data,
        }: {
            uuid: string;
            data: StockCatalogItemPatchPayload;
        }): Promise<StockCatalogItem> => {
            const validated = StockCatalogItemPatchSchema.parse(data);
            const response = await api.patch(`/stock/catalog/${uuid}/`, validated);
            return StockCatalogItemSchema.parse(response);
        },
        onSuccess: (updated, vars) => {
            queryClient.setQueryData<StockCatalogItem>(stockCatalogKeys.detail(vars.uuid), updated);
            queryClient.invalidateQueries({ queryKey: stockCatalogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: stockAlertKeys.all });
        },
    });
}

export function useDeleteCatalogItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (uuid: string): Promise<void> => {
            await api.delete(`/stock/catalog/${uuid}/`);
        },
        onSuccess: (_data, uuid) => {
            queryClient.removeQueries({ queryKey: stockCatalogKeys.detail(uuid) });
            queryClient.invalidateQueries({ queryKey: stockCatalogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: stockAlertKeys.all });
        },
    });
}

/**
 * Enregistre un mouvement de stock (entrée / sortie / ajustement).
 * Le backend met à jour la quantité de l'item de façon atomique.
 *
 * Invalide : la liste catalogue, le détail de l'item concerné, les alertes
 * et l'historique des mouvements de l'item.
 */
export function useCreateStockMovement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: StockMovementCreatePayload): Promise<StockMovement> => {
            const response = await api.post('/stock/movements/', payload);
            return StockMovementSchema.parse(response);
        },
        onSuccess: (_movement, vars) => {
            queryClient.invalidateQueries({ queryKey: stockCatalogKeys.detail(vars.catalog_item_uuid) });
            queryClient.invalidateQueries({ queryKey: stockCatalogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: stockAlertKeys.all });
            queryClient.invalidateQueries({ queryKey: stockMovementKeys.byItem(vars.catalog_item_uuid) });
        },
    });
}
