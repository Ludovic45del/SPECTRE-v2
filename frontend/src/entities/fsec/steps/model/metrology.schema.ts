/**
 * Metrology Step Schema
 * @module entities/steps/model
 *
 * Source: cible/domain/steps/models/metrology_step_bean.py
 */

import { z } from 'zod';

export const MetrologyStepApiSchema = z.object({
    uuid: z.string().uuid(),
    fsec_version_id: z.string().uuid(),
    rack_id: z.number().int().nullable(),
    metrologist_name: z.string().nullable(),
    metrologist_user_uuid: z.string().uuid().nullable().optional(),
    date: z.string().nullable(),
    comments: z.string().nullable(),
    machine_uuids: z.array(z.string().uuid()),
});

export const MetrologyStepSchema = MetrologyStepApiSchema.transform((api) => ({
    uuid: api.uuid,
    fsecVersionId: api.fsec_version_id,
    rackId: api.rack_id,
    metrologistName: api.metrologist_name,
    metrologistUserUuid: api.metrologist_user_uuid ?? null,
    date: api.date ? new Date(api.date) : null,
    comments: api.comments,
    machineUuids: api.machine_uuids,
}));

export type MetrologyStep = z.infer<typeof MetrologyStepSchema>;

export const MetrologyStepListSchema = z.array(MetrologyStepSchema);
