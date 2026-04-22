/**
 * Assembly Step Schema
 * @module entities/steps/model
 *
 * Source: cible/domain/steps/models/assembly_step_bean.py
 */

import { z } from 'zod';

export const AssemblyStepApiSchema = z.object({
    uuid: z.string().uuid(),
    fsec_version_id: z.string().uuid(),
    hydrometric_temperature: z.number().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    comments: z.string().nullable(),
    assembly_bench_ids: z.array(z.number().int()),
});

export const AssemblyStepSchema = AssemblyStepApiSchema.transform((api) => ({
    uuid: api.uuid,
    fsecVersionId: api.fsec_version_id,
    hydrometricTemperature: api.hydrometric_temperature,
    startDate: api.start_date ? new Date(api.start_date) : null,
    endDate: api.end_date ? new Date(api.end_date) : null,
    comments: api.comments,
    assemblyBenchIds: api.assembly_bench_ids,
}));

export type AssemblyStep = z.infer<typeof AssemblyStepSchema>;

export const AssemblyStepListSchema = z.array(AssemblyStepSchema);
