/**
 * FSECs List Page - Constants
 * @module pages/fsecs/constants
 */

import type { SortColumn } from './fsec-list-utils';

export const COLUMN_WIDTHS = {
    name: '20%',
    campaign: '20%',
    year: '12%',
    status: '20%',
    category: '20%',
    actions: '8%',
} as const;

export const COLUMNS: { key: SortColumn; label: string; width: string }[] = [
    { key: 'name', label: 'Nom', width: COLUMN_WIDTHS.name },
    { key: 'campaign', label: 'Campagne associ\u00e9e', width: COLUMN_WIDTHS.campaign },
    { key: 'year', label: 'Ann\u00e9e', width: COLUMN_WIDTHS.year },
    { key: 'status', label: 'Statut', width: COLUMN_WIDTHS.status },
    { key: 'category', label: 'Cat\u00e9gorie', width: COLUMN_WIDTHS.category },
];
