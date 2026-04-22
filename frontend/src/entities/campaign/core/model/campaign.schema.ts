/**
 * Campaign Zod Schema - Validation & Transformation
 * @module entities/campaign/model
 *
 * Source of Truth: cible/domain/campaign/models/campaign_bean.py
 * API Format: snake_case → Domain Format: camelCase
 */

import { z } from 'zod';
import dayjs, { Dayjs } from 'dayjs';

/**
 * Raw API response schema (snake_case from Backend)
 */
export const CampaignApiSchema = z.object({
    uuid: z.string().uuid(),
    type_id: z.number().int().nullable(),
    status_id: z.number().int().nullable(),
    installation_id: z.number().int().nullable(),
    name: z.string().min(1),
    year: z.number().int(),
    semester: z.string(),
    last_updated: z.string().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    dtri_number: z.number().int().nullable(),
    description: z.string().nullable(),
});

/**
 * Domain schema with camelCase transformation
 */
export const CampaignSchema = CampaignApiSchema.transform((api) => ({
    uuid: api.uuid,
    typeId: api.type_id,
    statusId: api.status_id,
    installationId: api.installation_id,
    name: api.name,
    year: api.year,
    semester: api.semester,
    lastUpdated: api.last_updated ? new Date(api.last_updated) : null,
    startDate: api.start_date ? new Date(api.start_date) : null,
    endDate: api.end_date ? new Date(api.end_date) : null,
    dtriNumber: api.dtri_number,
    description: api.description,
}));

export type Campaign = z.infer<typeof CampaignSchema>;
export type CampaignApi = z.input<typeof CampaignSchema>;

/**
 * Schema for campaign list response
 */
export const CampaignListSchema = z.array(CampaignSchema);

/**
 * Schema for creating a campaign (input to API)
 */
export const CampaignCreateSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    year: z.number().int().min(2000).max(2100),
    semester: z.enum(['S1', 'S2'], { required_error: 'Semestre requis' }),
    typeId: z.number().int({ message: 'Type requis' }),
    installationId: z.number().int({ message: 'Installation requise' }),
    statusId: z.number().int().nullable().optional(),
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
    dtriNumber: z
        .number()
        .int('N° DTRI invalide')
        .min(0, 'N° DTRI doit être positif')
        .max(999999, 'N° DTRI doit être ≤ 999999')
        .nullable()
        .optional(),
    description: z.string().nullable().optional(),
    // Team members (optional)
    moe: z.string().optional(),
    rce: z.string().optional(),
    iec: z.string().optional(),
});

export type CampaignCreate = z.infer<typeof CampaignCreateSchema>;

/**
 * Schema for partial campaign updates (PATCH)
 */
export const CampaignPatchSchema = z.object({
    name: z.string().min(1).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    semester: z.enum(['S1', 'S2']).optional(),
    type_id: z.number().int().nullable().optional(),
    status_id: z.number().int().nullable().optional(),
    installation_id: z.number().int().nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    dtri_number: z
        .number()
        .int('N° DTRI invalide')
        .min(0, 'N° DTRI doit être positif')
        .max(999999, 'N° DTRI doit être ≤ 999999')
        .nullable()
        .optional(),
    description: z.string().nullable().optional(),
});

export type CampaignPatchPayload = z.infer<typeof CampaignPatchSchema>;

/**
 * Schema for campaign general info form validation (overview page)
 */
export const CampaignGeneralFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Le nom est requis')
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(200, 'Nom trop long (max 200 caractères)'),
    year: z.number().int().min(2000, 'Année invalide (2000-2100)').max(2100, 'Année invalide (2000-2100)'),
    typeId: z.number({ required_error: 'Le type est requis' }),
    installationId: z.number({ required_error: "L'installation est requise" }),
    description: z.string().max(4000, 'Description trop longue (max 4000 caractères)'),
});

export type CampaignGeneralFormData = z.infer<typeof CampaignGeneralFormSchema>;

/**
 * Schema for campaign dates form validation (overview page)
 */
export const CampaignDayjsDateSchema = z.custom<Dayjs | null>(
    (val) => val === null || (dayjs.isDayjs(val) && val.isValid()),
    { message: 'Date invalide' },
);

/**
 * Transform CampaignCreate to API format (camelCase → snake_case).
 * Uses `??` so that a valid id of 0 (e.g. "Campagne DAM", "LMJ", "Brouillon")
 * is preserved; only `null`/`undefined` collapse to `null`.
 */
export function campaignCreateToApi(data: CampaignCreate): Record<string, string | number | null> {
    return {
        name: data.name,
        year: data.year,
        semester: data.semester,
        type_id: data.typeId ?? null,
        status_id: data.statusId ?? null,
        installation_id: data.installationId ?? null,
        start_date: data.startDate?.toISOString().split('T')[0] ?? null,
        end_date: data.endDate?.toISOString().split('T')[0] ?? null,
        dtri_number: data.dtriNumber ?? null,
        description: data.description ?? null,
    };
}
