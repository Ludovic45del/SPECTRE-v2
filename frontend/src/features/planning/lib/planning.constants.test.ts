/**
 * Tests for Phase 3 Map-based lookup helpers in planning.constants.ts.
 *
 * Covers: PERIODES_MAP, getPeriodeMeta, LAB_EVENT_CATEGORIES_MAP, getEventCategoryMeta.
 *
 * Note: Row ID helpers are tested in planning.utils.test.ts and are not duplicated here.
 */
import { describe, it, expect } from 'vitest';

import {
    PERIODES,
    PERIODES_MAP,
    getPeriodeMeta,
    LAB_EVENT_CATEGORIES,
    LAB_EVENT_CATEGORIES_MAP,
    getEventCategoryMeta,
} from './planning.constants';

// ====================== getPeriodeMeta ======================

describe('getPeriodeMeta', () => {
    const validValues = ['congés', 'mission', 'formation', 'rtt', 'maladie', 'télétravail'] as const;

    it.each(validValues)('returns a Periode for valid value "%s"', (value) => {
        const result = getPeriodeMeta(value);
        expect(result).toBeDefined();
        expect(result!.value).toBe(value);
    });

    it('returns undefined for an unknown value', () => {
        expect(getPeriodeMeta('unknown')).toBeUndefined();
        expect(getPeriodeMeta('')).toBeUndefined();
    });

    it('returned object matches the corresponding PERIODES entry', () => {
        for (const periode of PERIODES) {
            const result = getPeriodeMeta(periode.value);
            expect(result).toBe(periode); // same reference
        }
    });
});

// ====================== getEventCategoryMeta ======================

describe('getEventCategoryMeta', () => {
    const validLabels = ['Maintenance', 'Panne', 'Installation', 'Calibration', 'Nettoyage', 'Autre'] as const;

    it.each(validLabels)('returns a LabEventCategory for valid label "%s"', (label) => {
        const result = getEventCategoryMeta(label);
        expect(result).toBeDefined();
        expect(result!.label).toBe(label);
    });

    it('returns undefined for an unknown label', () => {
        expect(getEventCategoryMeta('unknown')).toBeUndefined();
        expect(getEventCategoryMeta('')).toBeUndefined();
    });

    it('returned object matches the corresponding LAB_EVENT_CATEGORIES entry', () => {
        for (const category of LAB_EVENT_CATEGORIES) {
            const result = getEventCategoryMeta(category.label);
            expect(result).toBe(category); // same reference
        }
    });
});

// ====================== PERIODES_MAP ======================

describe('PERIODES_MAP', () => {
    it('has the same size as the PERIODES array', () => {
        expect(PERIODES_MAP.size).toBe(PERIODES.length);
    });

    it('contains every entry from the PERIODES array', () => {
        for (const periode of PERIODES) {
            expect(PERIODES_MAP.has(periode.value)).toBe(true);
            expect(PERIODES_MAP.get(periode.value)).toBe(periode);
        }
    });
});

// ====================== LAB_EVENT_CATEGORIES_MAP ======================

describe('LAB_EVENT_CATEGORIES_MAP', () => {
    it('has the same size as the LAB_EVENT_CATEGORIES array', () => {
        expect(LAB_EVENT_CATEGORIES_MAP.size).toBe(LAB_EVENT_CATEGORIES.length);
    });

    it('contains every entry from the LAB_EVENT_CATEGORIES array', () => {
        for (const category of LAB_EVENT_CATEGORIES) {
            expect(LAB_EVENT_CATEGORIES_MAP.has(category.label)).toBe(true);
            expect(LAB_EVENT_CATEGORIES_MAP.get(category.label)).toBe(category);
        }
    });
});
