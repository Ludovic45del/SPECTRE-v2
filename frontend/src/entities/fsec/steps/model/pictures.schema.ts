/**
 * Pictures Step Schema
 * @module entities/steps/model
 *
 * Source: backend/app/domain/steps/models/pictures_step_bean.py
 */

import { z } from 'zod';

export const PicturesStepApiSchema = z.object({
    uuid: z.string().uuid(),
    fsec_version_id: z.string().uuid(),
    operator: z.string().nullable(),
    date: z.string().nullable(),
    comments: z.string().nullable(),
});

export const PicturesStepSchema = PicturesStepApiSchema.transform((api) => ({
    uuid: api.uuid,
    fsecVersionId: api.fsec_version_id,
    operator: api.operator,
    date: api.date ? new Date(api.date) : null,
    comments: api.comments,
}));

export type PicturesStep = z.infer<typeof PicturesStepSchema>;

export const PicturesStepListSchema = z.array(PicturesStepSchema);
