/**
 * Tests Zod pour le schema Indicators.
 *
 * L'entrée des tests est en snake_case (forme brute API). La sortie du schema
 * domaine est attendue en camelCase grâce à la transformation Zod.
 * @module entities/indicators/model
 */

import { describe, expect, it } from 'vitest';
import { IndicatorsSchema } from './indicators.schema';

const validPayload = {
    year: 2026,
    fa: {
        total_created_in_year: 5,
        by_status: { '0': 2, '1': 1, '2': 2 },
        by_criticality: { '1': 3 },
        by_discovery_step: { '3': 2 },
        open_stock_all_years: 7,
        avg_event_to_open_days: 1.5,
        avg_open_to_progress_days: 2.0,
        avg_progress_to_closure_days: 5.0,
        avg_total_lifecycle_days: 8.5,
        created_per_month: { '2026-01': 1, '2026-02': 4 },
    },
    fsec: {
        total_created_in_year: 10,
        total_shot_in_year: 3,
        by_status: { '7': 3, '5': 7 },
        by_category: { '0': 6, '1': 4 },
        avg_cycle_time_days: 42.0,
        median_cycle_time_days: 40.0,
        shot_per_month: { '2026-01': 1, '2026-02': 2 },
    },
    step_durations: [
        {
            key: 'assembly_to_metrology',
            label: 'Assemblage → Métrologie',
            count: 3,
            avg_days: 4.5,
            median_days: 4.0,
            min_days: 1.0,
            max_days: 8.0,
            is_gas: false,
        },
    ],
    top_operators: [{ user_uuid: 'u1', name: 'Alice', steps_count: 12 }],
    bottleneck_step_key: 'assembly_to_metrology',
};

describe('IndicatorsSchema', () => {
    it('parses a valid payload and transforms to camelCase', () => {
        const parsed = IndicatorsSchema.parse(validPayload);
        expect(parsed.year).toBe(2026);
        expect(parsed.fa.totalCreatedInYear).toBe(5);
        expect(parsed.fa.byStatus).toEqual({ '0': 2, '1': 1, '2': 2 });
        expect(parsed.fa.openStockAllYears).toBe(7);
        expect(parsed.fa.createdPerMonth).toEqual({ '2026-01': 1, '2026-02': 4 });
        expect(parsed.fsec.totalShotInYear).toBe(3);
        expect(parsed.fsec.shotPerMonth).toEqual({ '2026-01': 1, '2026-02': 2 });
        expect(parsed.stepDurations).toHaveLength(1);
        expect(parsed.stepDurations[0].avgDays).toBe(4.5);
        expect(parsed.stepDurations[0].isGas).toBe(false);
        expect(parsed.topOperators[0].userUuid).toBe('u1');
        expect(parsed.topOperators[0].stepsCount).toBe(12);
        expect(parsed.bottleneckStepKey).toBe('assembly_to_metrology');
    });

    it('allows null avg/median in step_durations', () => {
        const payload = {
            ...validPayload,
            step_durations: [
                {
                    key: 'k',
                    label: 'l',
                    count: 0,
                    avg_days: null,
                    median_days: null,
                    min_days: null,
                    max_days: null,
                    is_gas: false,
                },
            ],
        };
        const parsed = IndicatorsSchema.parse(payload);
        expect(parsed.stepDurations[0].avgDays).toBeNull();
        expect(parsed.stepDurations[0].minDays).toBeNull();
    });

    it('allows null bottleneck_step_key', () => {
        const payload = { ...validPayload, bottleneck_step_key: null };
        const parsed = IndicatorsSchema.parse(payload);
        expect(parsed.bottleneckStepKey).toBeNull();
    });

    it('rejects negative counts', () => {
        const payload = {
            ...validPayload,
            fa: { ...validPayload.fa, total_created_in_year: -1 },
        };
        expect(() => IndicatorsSchema.parse(payload)).toThrow();
    });
});
