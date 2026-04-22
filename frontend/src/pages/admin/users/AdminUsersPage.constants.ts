/**
 * Admin Users Page - Constants
 * @module pages/admin/users/constants
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SortColumn =
    | 'username'
    | 'lastName'
    | 'firstName'
    | 'role'
    | 'laboratoire'
    | 'service'
    | 'numero'
    | 'bureau'
    | 'permissionGroup'
    | 'isActive';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const COLUMN_WIDTHS = {
    username: '10%',
    lastName: '10%',
    firstName: '10%',
    role: '11%',
    laboratoire: '10%',
    service: '10%',
    numero: '9%',
    bureau: '9%',
    permissionGroup: '10%',
    isActive: '8%',
    actions: '3%',
} as const;

export const COLUMNS: { key: SortColumn; label: string; width: string }[] = [
    { key: 'username', label: 'Matricule', width: COLUMN_WIDTHS.username },
    { key: 'lastName', label: 'Nom', width: COLUMN_WIDTHS.lastName },
    { key: 'firstName', label: 'Prénom', width: COLUMN_WIDTHS.firstName },
    { key: 'role', label: 'Rôle', width: COLUMN_WIDTHS.role },
    { key: 'laboratoire', label: 'Labo', width: COLUMN_WIDTHS.laboratoire },
    { key: 'service', label: 'Service', width: COLUMN_WIDTHS.service },
    { key: 'numero', label: 'Numéro', width: COLUMN_WIDTHS.numero },
    { key: 'bureau', label: 'Bureau', width: COLUMN_WIDTHS.bureau },
    { key: 'permissionGroup', label: 'Permissions', width: COLUMN_WIDTHS.permissionGroup },
    { key: 'isActive', label: 'Statut', width: COLUMN_WIDTHS.isActive },
];

export const SKELETON_CELLS: {
    variant: 'text' | 'rounded' | 'circular';
    width: string | number;
    height: number;
    align?: 'center';
}[] = [
    { variant: 'text', width: '80%', height: 24 },
    { variant: 'text', width: '70%', height: 24 },
    { variant: 'text', width: '70%', height: 24 },
    { variant: 'rounded', width: 80, height: 24 },
    { variant: 'text', width: '70%', height: 24 },
    { variant: 'text', width: '70%', height: 24 },
    { variant: 'text', width: '60%', height: 24 },
    { variant: 'text', width: '60%', height: 24 },
    { variant: 'text', width: '60%', height: 24 },
    { variant: 'rounded', width: 50, height: 24 },
    { variant: 'circular', width: 32, height: 32, align: 'center' },
];

export const ROLE_COLORS: Record<string, string> = {
    chef_labo: '#1976d2',
    iec: '#7b1fa2',
    rce: '#ed6c02',
    assembleur: '#0288d1',
    metrologue: '#2e7d32',
    cryogenie: '#00838f',
    stagiaire: '#757575',
    alternant: '#757575',
};
