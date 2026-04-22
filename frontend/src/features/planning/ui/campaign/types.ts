/**
 * Shared types for campaign planning components.
 */

export interface FsecInfo {
    versionUuid: string;
    fsecUuid: string;
    name: string;
    categoryId: number | null;
    statusId: number | null;
    shootingDate: Date | null;
}
