/**
 * FSEC Constants - Shared referential data
 * @module entities/fsec/model
 */

export interface FsecStatusInfo {
    label: string;
    color: string;
}

export interface FsecCategoryInfo {
    label: string;
    color: string;
}

/** Named FSEC status IDs for use in business logic instead of magic numbers */
export const FSEC_STATUS_ID = {
    DESIGN: 0,
    EN_COURS_ASSEMBLAGE: 1,
    EN_ATTENTE_METROLOGIE: 2,
    EN_ATTENTE_SCELLEMENT: 3,
    PHOTOS_A_PRENDRE: 4,
    UTILISABLE: 5,
    SUR_INSTALLATION: 6,
    TIREE: 7,
    HS: 8,
    REMPLISSAGE_HP: 9,
    TEST_ETANCHEITE_BP: 10,
    REMPLISSAGE_BP: 11,
    PERMEATION: 12,
    DEPRESSURISATION: 13,
    RE_PRESSURISATION: 14,
} as const;

/** FSEC Status referential from backend */
export const FSEC_STATUSES: Record<number, FsecStatusInfo> = {
    // Statuts de base
    0: { label: 'Design', color: '#c3c3c3' },
    1: { label: "En cours d'assemblage", color: '#ecce18' },
    2: { label: 'En attente de métrologie', color: '#7a8ce0' },
    3: { label: 'En attente de scellement', color: '#a2d82b' },
    4: { label: 'Photos à prendre', color: '#aa5485' },
    5: { label: 'Utilisable', color: '#2a5486' },
    6: { label: 'Sur installation', color: '#2ee454' },
    7: { label: 'Tirée', color: '#123456' },
    8: { label: 'HS', color: '#dc2626' },
    // Statuts liés au gaz
    9: { label: 'Remplissage HP', color: '#f59e0b' },
    10: { label: 'Test étanchéité BP', color: '#8b5cf6' },
    11: { label: 'Remplissage BP', color: '#06b6d4' },
    12: { label: 'Perméation', color: '#ec4899' },
    13: { label: 'Dépressurisation', color: '#f97316' },
    14: { label: 'Re-pressurisation', color: '#22c55e' },
} as const;

/** FSEC Category referential from backend */
export const FSEC_CATEGORIES: Record<number, FsecCategoryInfo> = {
    0: { label: 'Sans Gaz', color: '#00FF66' },
    1: { label: 'Avec Gaz BP', color: '#1FDFED' },
    2: { label: 'Avec Gaz HP', color: '#1FEDB7' },
    3: { label: 'Avec Gaz BP + HP', color: '#1FED2B' },
    4: { label: 'Avec Gaz Permeation + HP', color: '#1F9DED' },
} as const;

/** Status list for dropdowns */
export const FSEC_STATUS_LIST = Object.entries(FSEC_STATUSES).map(([id, info]) => ({
    id: Number(id),
    ...info,
}));

/** Category list for dropdowns */
export const FSEC_CATEGORY_LIST = Object.entries(FSEC_CATEGORIES).map(([id, info]) => ({
    id: Number(id),
    ...info,
}));

/** Default fallback for unknown status/category */
const DEFAULT_INFO: FsecStatusInfo = { label: '-', color: '#666' };

/** Get status info with fallback */
export const getStatusInfo = (statusId: number | null): FsecStatusInfo => {
    if (statusId === null) return DEFAULT_INFO;
    return FSEC_STATUSES[statusId] ?? { label: `Statut ${statusId}`, color: '#666' };
};

/** Get category info with fallback */
export const getCategoryInfo = (categoryId: number | null): FsecCategoryInfo => {
    if (categoryId === null) return DEFAULT_INFO;
    return FSEC_CATEGORIES[categoryId] ?? { label: `Cat. ${categoryId}`, color: '#666' };
};
