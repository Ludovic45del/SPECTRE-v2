/**
 * Catalog page helpers — colonnes + tri (alignés sur le pattern Campaigns).
 */

import { formatLocation, isLowStock, type StockCatalogItem } from '@entities/stock-item';

export type CatalogSortColumn =
    | 'name'
    | 'reference'
    | 'category'
    | 'structurationType'
    | 'fournisseur'
    | 'emplacement'
    | 'state';
export type SortDirection = 'asc' | 'desc';

// ─────────────────────────────────────────────────────────────────────────────
// Colonnes (mêmes proportions que pages/campaigns)
// ─────────────────────────────────────────────────────────────────────────────

export const COLUMN_WIDTHS = {
    name: '18%',
    reference: '13%',
    category: '13%',
    structurationType: '10%',
    fournisseur: '12%',
    emplacement: '14%',
    state: '14%',
    actions: '6%',
} as const;

export const CATALOG_COLUMNS: { key: CatalogSortColumn; label: string; width: string }[] = [
    { key: 'name', label: 'Nom', width: COLUMN_WIDTHS.name },
    { key: 'reference', label: 'Référence', width: COLUMN_WIDTHS.reference },
    { key: 'category', label: 'Rubrique', width: COLUMN_WIDTHS.category },
    { key: 'structurationType', label: 'Type', width: COLUMN_WIDTHS.structurationType },
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
            case 'structurationType': {
                // Items sans type (hors structuration) groupés en fin de tri ascendant.
                const ta = a.structurationType;
                const tb = b.structurationType;
                if (ta === tb) cmp = 0;
                else if (ta === null) cmp = 1;
                else if (tb === null) cmp = -1;
                else cmp = ta.localeCompare(tb, 'fr');
                break;
            }
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
