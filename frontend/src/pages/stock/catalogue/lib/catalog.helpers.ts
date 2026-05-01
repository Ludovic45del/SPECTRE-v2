/**
 * Catalog page helpers — colonnes + tri (alignés sur le pattern Campaigns).
 */

import { formatLocation, isLowStock, type StockCatalogItem } from '@entities/stock-item';

export type CatalogSortColumn = 'name' | 'reference' | 'category' | 'fournisseur' | 'emplacement' | 'state';
export type SortDirection = 'asc' | 'desc';

// ─────────────────────────────────────────────────────────────────────────────
// Colonnes (mêmes proportions que pages/campaigns)
// ─────────────────────────────────────────────────────────────────────────────

export const COLUMN_WIDTHS = {
    name: '20%',
    reference: '14%',
    category: '14%',
    fournisseur: '14%',
    emplacement: '16%',
    state: '16%',
    actions: '6%',
} as const;

export const CATALOG_COLUMNS: { key: CatalogSortColumn; label: string; width: string }[] = [
    { key: 'name', label: 'Nom', width: COLUMN_WIDTHS.name },
    { key: 'reference', label: 'Référence', width: COLUMN_WIDTHS.reference },
    { key: 'category', label: 'Rubrique', width: COLUMN_WIDTHS.category },
    { key: 'fournisseur', label: 'Fournisseur', width: COLUMN_WIDTHS.fournisseur },
    { key: 'emplacement', label: 'Emplacement', width: COLUMN_WIDTHS.emplacement },
    { key: 'state', label: 'État / Stock', width: COLUMN_WIDTHS.state },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tri
// ─────────────────────────────────────────────────────────────────────────────

const stateRank = (item: StockCatalogItem): number => {
    if (item.kind === 'element') {
        switch (item.status) {
            case 'dispo':
                return 0;
            case 'reservee':
                return 1;
            case 'affectee':
                return 2;
            case 'tiree':
                return 3;
            default:
                return 4;
        }
    }
    // Consumable : stock bas → en haut
    if (isLowStock(item)) return 0;
    return 1;
};

export function sortCatalogItems(
    items: StockCatalogItem[],
    column: CatalogSortColumn,
    direction: SortDirection,
): StockCatalogItem[] {
    const multiplier = direction === 'asc' ? 1 : -1;
    const sorted = [...items];
    sorted.sort((a, b) => {
        let cmp = 0;
        switch (column) {
            case 'name':
                cmp = a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
                break;
            case 'reference':
                cmp = (a.reference ?? '').localeCompare(b.reference ?? '', 'fr');
                break;
            case 'category':
                cmp = a.category.localeCompare(b.category, 'fr');
                break;
            case 'fournisseur':
                cmp = (a.fournisseur ?? '').localeCompare(b.fournisseur ?? '', 'fr', { sensitivity: 'base' });
                break;
            case 'emplacement':
                cmp = formatLocation(a).localeCompare(formatLocation(b), 'fr', { sensitivity: 'base' });
                break;
            case 'state':
                cmp = stateRank(a) - stateRank(b);
                break;
        }
        return cmp * multiplier;
    });
    return sorted;
}
