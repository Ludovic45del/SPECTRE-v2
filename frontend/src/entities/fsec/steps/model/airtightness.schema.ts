/**
 * Airtightness Test LP Step Schema
 * @module entities/steps/model
 *
 * Source: cible/domain/steps/models/airtightness_test_lp_step_bean.py
 */

import { z } from 'zod';

export const AirtightnessStepApiSchema = z.object({
    uuid: z.string().uuid(),
    fsec_version_id: z.string().uuid(),
    leak_rate_dtri: z.string().nullable(),
    gas_type: z.string().nullable(),
    experiment_pressure: z.number().nullable(),
    airtightness_test_duration: z.number().nullable(),
    operator: z.string().nullable(),
    date_of_fulfilment: z.string().nullable(),
});

export const AirtightnessStepSchema = AirtightnessStepApiSchema.transform((api) => ({
    uuid: api.uuid,
    fsecVersionId: api.fsec_version_id,
    leakRateDtri: api.leak_rate_dtri,
    gasType: api.gas_type,
    experimentPressure: api.experiment_pressure,
    airtightnessTestDuration: api.airtightness_test_duration,
    operator: api.operator,
    dateOfFulfilment: api.date_of_fulfilment ? new Date(api.date_of_fulfilment) : null,
}));

export type AirtightnessStep = z.infer<typeof AirtightnessStepSchema>;

export const AirtightnessStepListSchema = z.array(AirtightnessStepSchema);
