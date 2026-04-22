/**
 * Campaign List Helpers
 * @module pages/campaigns/lib
 *
 * Pure helper functions for filtering, sorting and formatting campaigns.
 */

import { CampaignWithRelations } from '@entities/campaign';
import { CampaignFilters } from '@features/campaign/filter-campaigns';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SortColumn = 'semester' | 'name' | 'type' | 'status';
export type SortDirection = 'asc' | 'desc';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const COLUMN_WIDTHS = {
    semester: '12%',
    name: '40%',
    type: '20%',
    status: '20%',
    actions: '8%',
} as const;

export const COLUMNS: { key: SortColumn; label: string; width: string }[] = [
    { key: 'semester', label: 'Semestre', width: COLUMN_WIDTHS.semester },
    { key: 'name', label: 'Nom', width: COLUMN_WIDTHS.name },
    { key: 'type', label: 'Type', width: COLUMN_WIDTHS.type },
    { key: 'status', label: 'Statut', width: COLUMN_WIDTHS.status },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const formatCampaignName = (campaign: CampaignWithRelations): string => {
    const installation = campaign.installation?.label ?? '';
    return `${campaign.year}-${installation}_${campaign.name.toUpperCase()}`;
};

export const filterCampaigns = (
    campaigns: CampaignWithRelations[] | undefined,
    filters: CampaignFilters,
): CampaignWithRelations[] => {
    if (!campaigns) return [];

    const nameLower = filters.name.toLowerCase();

    return campaigns.filter((campaign) => {
        if (filters.installation !== null) {
            const campaignInstallation = campaign.installation?.label;
            if (campaignInstallation && campaignInstallation !== filters.installation) {
                return false;
            }
        }
        if (filters.year !== null && campaign.year !== filters.year) {
            return false;
        }
        if (filters.semester !== null && campaign.semester !== filters.semester) {
            return false;
        }
        if (filters.name) {
            const fullName = formatCampaignName(campaign).toLowerCase();
            if (!fullName.includes(nameLower)) {
                return false;
            }
        }
        if (filters.type !== null && campaign.type?.id !== filters.type.id) {
            return false;
        }
        if (filters.status !== null && campaign.status?.label !== filters.status) {
            return false;
        }
        return true;
    });
};

export const sortCampaigns = (
    campaigns: CampaignWithRelations[],
    column: SortColumn,
    direction: SortDirection,
): CampaignWithRelations[] => {
    const sorted = [...campaigns];
    const multiplier = direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
        let comparison = 0;
        switch (column) {
            case 'semester':
                comparison = (a.semester ?? '').localeCompare(b.semester ?? '');
                break;
            case 'name':
                comparison = formatCampaignName(a).localeCompare(formatCampaignName(b));
                break;
            case 'type':
                comparison = (a.type?.label ?? '').localeCompare(b.type?.label ?? '');
                break;
            case 'status':
                comparison = (a.status?.label ?? '').localeCompare(b.status?.label ?? '');
                break;
        }
        return comparison * multiplier;
    });

    return sorted;
};
