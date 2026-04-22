/**
 * Campaign Team Schema
 * @module entities/campaign-team/model
 */

import { z } from 'zod';
import { getCampaignRole } from '@entities/campaign/core/lib';

export const CampaignTeamApiSchema = z.object({
    uuid: z.string().uuid(),
    campaign_uuid: z.string().uuid(),
    role_id: z.number().int().nullable(),
    name: z.string(),
});

export const CampaignTeamSchema = CampaignTeamApiSchema.transform((api) => ({
    uuid: api.uuid,
    campaignUuid: api.campaign_uuid,
    role: getCampaignRole(api.role_id),
    name: api.name,
}));

export type CampaignTeamMember = z.infer<typeof CampaignTeamSchema>;
export const CampaignTeamListSchema = z.array(CampaignTeamSchema);

export const CampaignTeamMemberCreateSchema = z.object({
    campaign_uuid: z.string().uuid(),
    role_id: z.number().int().min(1),
    name: z.string().min(1).max(200),
});

export type CampaignTeamMemberCreate = z.infer<typeof CampaignTeamMemberCreateSchema>;

export const CampaignTeamMemberUpdateSchema = CampaignTeamMemberCreateSchema.extend({
    uuid: z.string().uuid(),
});

export type CampaignTeamMemberUpdate = z.infer<typeof CampaignTeamMemberUpdateSchema>;

export const CampaignTeamMemberDeleteSchema = z.object({
    uuid: z.string().uuid(),
    campaign_uuid: z.string().uuid(),
});

export type CampaignTeamMemberDelete = z.infer<typeof CampaignTeamMemberDeleteSchema>;

/**
 * Schema for team form validation (overview page)
 */
export const CampaignTeamFormSchema = z.object({
    moe: z.string().max(200, 'Nom MOE trop long (max 200 caractères)'),
    rce: z.string().max(200, 'Nom RCE trop long (max 200 caractères)'),
    iec: z.string().max(200, 'Nom IEC trop long (max 200 caractères)'),
});

export type CampaignTeamFormData = z.infer<typeof CampaignTeamFormSchema>;
