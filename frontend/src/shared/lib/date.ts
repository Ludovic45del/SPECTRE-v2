/**
 * Date utilities - Parsing and formatting
 * @module shared/lib
 */

/**
 * Parse ISO date string to Date object
 * Returns null for null/undefined input
 */
export function parseIsoDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Format Date to ISO string (date only, no time)
 * Returns null for null input
 */
export function formatDateToIso(date: Date | null | undefined): string | null {
    if (!date) return null;
    return date.toISOString().split('T')[0];
}

/**
 * Format Date for display (French locale, long format)
 * Example: "22 janvier 2026"
 */
export function formatDateDisplay(date: Date | null | undefined): string {
    if (!date) return '-';
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format Date for display (French locale, short format)
 * Example: "22/01/2026"
 * Accepts Date, string (ISO format), null, or undefined
 */
export function formatDateShort(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('fr-FR');
}
