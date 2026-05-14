/**
 * Indicators API Schema - Raw snake_case fields from backend.
 * @module entities/indicators/model
 *
 * Ce fichier décrit la réponse brute de `/api/v1/indicators/`. Les pages ne
 * consomment pas ces types directement : voir `indicators.schema.ts` qui
 * convertit vers camelCase.
 */

import { z } from 'zod';

// ---------- Step duration (transition entre deux étapes) ----------

export const StepDurationApiSchema = z.object({
    key: z.string(),
    label: z.string(),
    count: z.number().int().nonnegative(),
    avg_days: z.number().nullable(),
    median_days: z.number().nullable(),
    min_days: z.number().nullable(),
    max_days: z.number().nullable(),
    is_gas: z.boolean(),
});

// ---------- FA indicators ----------

export const FaIndicatorsApiSchema = z.object({
    total_created_in_year: z.number().int().nonnegative(),
    by_status: z.record(z.string(), z.number().int().nonnegative()),
    by_criticality: z.record(z.string(), z.number().int().nonnegative()),
    by_discovery_step: z.record(z.string(), z.number().int().nonnegative()),
    open_stock_all_years: z.number().int().nonnegative(),
    avg_event_to_open_days: z.number().nullable(),
    avg_open_to_progress_days: z.number().nullable(),
    avg_progress_to_closure_days: z.number().nullable(),
    avg_total_lifecycle_days: z.number().nullable(),
    created_per_month: z.record(z.string(), z.number().int().nonnegative()),
});

// ---------- FSEC indicators ----------

export const FsecIndicatorsApiSchema = z.object({
    total_created_in_year: z.number().int().nonnegative(),
    total_shot_in_year: z.number().int().nonnegative(),
    by_status: z.record(z.string(), z.number().int().nonnegative()),
    by_category: z.record(z.string(), z.number().int().nonnegative()),
    avg_cycle_time_days: z.number().nullable(),
    median_cycle_time_days: z.number().nullable(),
    shot_per_month: z.record(z.string(), z.number().int().nonnegative()),
});

// ---------- Operator workload ----------

export const OperatorWorkloadApiSchema = z.object({
    user_uuid: z.string(),
    name: z.string(),
    steps_count: z.number().int().nonnegative(),
});

// ---------- Bundle complet (raw API) ----------

export const IndicatorsApiSchema = z.object({
    year: z.number().int(),
    fa: FaIndicatorsApiSchema,
    fsec: FsecIndicatorsApiSchema,
    step_durations: z.array(StepDurationApiSchema),
    top_operators: z.array(OperatorWorkloadApiSchema),
    bottleneck_step_key: z.string().nullable(),
});
