/**
 * Sealing Step Schema
 * @module entities/steps/model
 *
 * Source: backend/app/domain/steps/models/sealing_step_bean.py
 */

import { z } from 'zod';

export const SealingStepApiSchema = z.object({
    uuid: z.string().uuid(),
    metrology_step_id: z.string().uuid(),
    date: z.string().nullable(),
    metrologist_name: z.string().nullable(),
    rack_id: z.number().int().nullable(),
    interface_io: z.string().nullable(),
    comments: z.string().nullable(),
});

export const SealingStepSchema = SealingStepApiSchema.transform((api) => ({
    uuid: api.uuid,
    metrologyStepId: api.metrology_step_id,
    date: api.date ? new Date(api.date) : null,
    metrologistName: api.metrologist_name,
    rackId: api.rack_id,
    interfaceIo: api.interface_io,
    comments: api.comments,
}));

export type SealingStep = z.infer<typeof SealingStepSchema>;

export const SealingStepListSchema = z.array(SealingStepSchema);
