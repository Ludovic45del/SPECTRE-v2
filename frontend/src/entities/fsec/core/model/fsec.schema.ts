/**
 * FSEC Zod Schema - Validation & Transformation
 * @module entities/fsec/model
 *
 * Source of Truth: cible/domain/fsec/models/fsec_bean.py
 * API Format: snake_case → Domain Format: camelCase
 */

import { z } from 'zod';

/**
 * Raw API response schema (snake_case from Backend)
 */
export const FsecApiSchema = z.object({
    // Versioning
    version_uuid: z.string().uuid(),
    fsec_uuid: z.string().uuid(),

    // Foreign Keys
    campaign_id: z.string().uuid().nullable(),
    status_id: z.number().int().nullable(),
    category_id: z.number().int().nullable(),
    rack_id: z.number().int().nullable(),

    // Base fields
    name: z.string(),
    comments: z.string().nullable(),
    last_updated: z.string().nullable(),
    is_active: z.boolean(),
    created_at: z.string().nullable(),

    // Workflow fields
    delivery_date: z.string().nullable(),
    shooting_date: z.string().nullable(),
    preshooting_pressure: z.number().nullable(),
    experience_srxx: z.string().nullable(),
    localisation: z.string().nullable(),
    depressurization_failed: z.boolean().nullable(),
});

/**
 * Domain schema with camelCase transformation
 */
export const FsecSchema = FsecApiSchema.transform((api) => ({
    // Versioning
    versionUuid: api.version_uuid,
    fsecUuid: api.fsec_uuid,

    // Foreign Keys
    campaignId: api.campaign_id,
    statusId: api.status_id,
    categoryId: api.category_id,
    rackId: api.rack_id,

    // Base fields
    name: api.name,
    comments: api.comments,
    lastUpdated: api.last_updated ? new Date(api.last_updated) : null,
    isActive: api.is_active,
    createdAt: api.created_at ? new Date(api.created_at) : null,

    // Workflow fields
    deliveryDate: api.delivery_date ? new Date(api.delivery_date) : null,
    shootingDate: api.shooting_date ? new Date(api.shooting_date) : null,
    preshootingPressure: api.preshooting_pressure,
    experienceSrxx: api.experience_srxx,
    localisation: api.localisation,
    depressurizationFailed: api.depressurization_failed,
}));

export type Fsec = z.infer<typeof FsecSchema>;
export type FsecApi = z.input<typeof FsecSchema>;

/**
 * Schema for FSEC list response
 */
export const FsecListSchema = z.array(FsecSchema);

/**
 * Schema for creating a FSEC (input to API)
 */
export const FsecCreateSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    campaignId: z.string().uuid().nullable().optional(),
    statusId: z.number().int().nullable().optional(),
    categoryId: z.number().int().nullable().optional(),
    rackId: z.number().int().nullable().optional(),
    comments: z.string().nullable().optional(),
    deliveryDate: z.date().nullable().optional(),
    shootingDate: z.date().nullable().optional(),
    preshootingPressure: z.number().nullable().optional(),
    experienceSrxx: z.string().nullable().optional(),
    localisation: z.string().nullable().optional(),
    depressurizationFailed: z.boolean().nullable().optional(),
});

export type FsecCreate = z.infer<typeof FsecCreateSchema>;

/**
 * Schema for FSEC general info inline form validation (OverviewTab)
 */
export const FsecGeneralFormSchema = z.object({
    localisation: z.string().max(500, 'Localisation trop longue (max 500 caractères)'),
    comments: z.string().max(4000, 'Remarques trop longues (max 4000 caractères)'),
});

/**
 * Transform FsecCreate to API format (camelCase → snake_case)
 */
export function fsecCreateToApi(data: FsecCreate): Record<string, unknown> {
    return {
        name: data.name,
        campaign_id: data.campaignId ?? null,
        status_id: data.statusId ?? null,
        category_id: data.categoryId ?? null,
        rack_id: data.rackId ?? null,
        comments: data.comments ?? null,
        delivery_date: data.deliveryDate?.toISOString().split('T')[0] ?? null,
        shooting_date: data.shootingDate?.toISOString().split('T')[0] ?? null,
        preshooting_pressure: data.preshootingPressure ?? null,
        experience_srxx: data.experienceSrxx ?? null,
        localisation: data.localisation ?? null,
        depressurization_failed: data.depressurizationFailed ?? null,
    };
}
