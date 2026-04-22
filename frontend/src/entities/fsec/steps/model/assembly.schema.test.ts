/**
 * Assembly Step Schema Tests - Level 1 (Unit Tests)
 * @module entities/steps/model
 */

import { describe, it, expect } from 'vitest';
import { AssemblyStepSchema } from './assembly.schema';

describe('AssemblyStepSchema', () => {
    it('should transform API response correctly', () => {
        const apiData = {
            uuid: '123e4567-e89b-12d3-a456-426614174000',
            fsec_version_id: '223e4567-e89b-12d3-a456-426614174001',
            hydrometric_temperature: 25.5,
            start_date: '2024-01-15',
            end_date: '2024-01-20',
            comments: 'Step completed',
            assembly_bench_ids: [1, 2, 3],
        };

        const result = AssemblyStepSchema.parse(apiData);

        expect(result.uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.fsecVersionId).toBe('223e4567-e89b-12d3-a456-426614174001');
        expect(result.hydrometricTemperature).toBe(25.5);
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.assemblyBenchIds).toEqual([1, 2, 3]);
    });

    it('should handle null optional fields', () => {
        const apiData = {
            uuid: '123e4567-e89b-12d3-a456-426614174000',
            fsec_version_id: '223e4567-e89b-12d3-a456-426614174001',
            hydrometric_temperature: null,
            start_date: null,
            end_date: null,
            comments: null,
            assembly_bench_ids: [],
        };

        const result = AssemblyStepSchema.parse(apiData);

        expect(result.hydrometricTemperature).toBeNull();
        expect(result.startDate).toBeNull();
        expect(result.endDate).toBeNull();
        expect(result.comments).toBeNull();
        expect(result.assemblyBenchIds).toEqual([]);
    });
});
