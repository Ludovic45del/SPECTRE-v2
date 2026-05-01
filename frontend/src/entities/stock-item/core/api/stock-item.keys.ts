/**
 * Stock Catalog Item — TanStack Query Key Factory.
 */

import type { CategoryCode, ElementStatus, Installation, ItemKind } from '../model/stock.constants';

export interface StockCatalogListFilters {
    kind: ItemKind | null;
    category: CategoryCode | null;
    status: ElementStatus | null;
    installation: Installation | null;
    search: string;
}

export const stockCatalogKeys = {
    all: ['stock-catalog'] as const,
    lists: () => [...stockCatalogKeys.all, 'list'] as const,
    list: (filters: StockCatalogListFilters) => [...stockCatalogKeys.lists(), filters] as const,
    details: () => [...stockCatalogKeys.all, 'detail'] as const,
    detail: (uuid: string) => [...stockCatalogKeys.details(), uuid] as const,
};

export const stockAlertKeys = {
    all: ['stock-alerts'] as const,
};
