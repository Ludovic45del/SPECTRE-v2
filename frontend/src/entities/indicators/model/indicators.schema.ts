/**
 * Indicators Domain Schema - snake_case → camelCase via Zod transform.
 * @module entities/indicators/model
 *
 * Convention projet : l'API est en snake_case, les types domaine consommés
 * par les pages sont en camelCase. Voir `indicators-api.schema.ts` pour la
 * forme brute renvoyée par le backend.
 */

import { z } from 'zod';
import {
    FaIndicatorsApiSchema,
    FsecIndicatorsApiSchema,
    IndicatorsApiSchema,
    OperatorWorkloadApiSchema,
    StepDurationApiSchema,
} from './indicators-api.schema';

// ---------- Step duration ----------

export const StepDurationSchema = StepDurationApiSchema.transform((api) => ({
    key: api.key,
    label: api.label,
    count: api.count,
    avgDays: api.avg_days,
    medianDays: api.median_days,
    minDays: api.min_days,
    maxDays: api.max_days,
    isGas: api.is_gas,
}));
export type StepDuration = z.infer<typeof StepDurationSchema>;

// ---------- FA indicators ----------

export const FaIndicatorsSchema = FaIndicatorsApiSchema.transform((api) => ({
    totalCreatedInYear: api.total_created_in_year,
    byStatus: api.by_status,
    byCriticality: api.by_criticality,
    byDiscoveryStep: api.by_discovery_step,
    openStockAllYears: api.open_stock_all_years,
    avgEventToOpenDays: api.avg_event_to_open_days,
    avgOpenToProgressDays: api.avg_open_to_progress_days,
    avgProgressToClosureDays: api.avg_progress_to_closure_days,
    avgTotalLifecycleDays: api.avg_total_lifecycle_days,
    createdPerMonth: api.created_per_month,
}));
export type FaIndicators = z.infer<typeof FaIndicatorsSchema>;

// ---------- FSEC indicators ----------

export const FsecIndicatorsSchema = FsecIndicatorsApiSchema.transform((api) => ({
    totalCreatedInYear: api.total_created_in_year,
    totalShotInYear: api.total_shot_in_year,
    byStatus: api.by_status,
    byCategory: api.by_category,
    avgCycleTimeDays: api.avg_cycle_time_days,
    medianCycleTimeDays: api.median_cycle_time_days,
    shotPerMonth: api.shot_per_month,
}));
export type FsecIndicators = z.infer<typeof FsecIndicatorsSchema>;

// ---------- Operator workload ----------

export const OperatorWorkloadSchema = OperatorWorkloadApiSchema.transform((api) => ({
    userUuid: api.user_uuid,
    name: api.name,
    stepsCount: api.steps_count,
}));
export type OperatorWorkload = z.infer<typeof OperatorWorkloadSchema>;

// ---------- Bundle complet (domain) ----------

export const IndicatorsSchema = IndicatorsApiSchema.transform((api) => ({
    year: api.year,
    fa: FaIndicatorsSchema.parse(api.fa),
    fsec: FsecIndicatorsSchema.parse(api.fsec),
    stepDurations: api.step_durations.map((sd) => StepDurationSchema.parse(sd)),
    topOperators: api.top_operators.map((o) => OperatorWorkloadSchema.parse(o)),
    bottleneckStepKey: api.bottleneck_step_key,
}));
export type Indicators = z.infer<typeof IndicatorsSchema>;

// Re-export raw API schema for tests / direct introspection.
export { IndicatorsApiSchema } from './indicators-api.schema';
