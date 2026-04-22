/**
 * MUI Theme - Apple-like Design System
 * @module shared/ui
 *
 * Based on Technical_Architecture_Reference.md:
 * - Font: Inter / System
 * - Spacing: 8px grid
 * - Glassmorphism support
 * - Soft shadows
 * - Light / Dark mode
 */

import { createTheme, alpha } from '@mui/material/styles';

// ============================================================================
// Shared palette (mode-independent)
// ============================================================================

const sharedColors = {
    primary: {
        main: '#007AFF',
        light: '#5AC8FA',
        dark: '#0051D4',
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#5856D6',
        light: '#AF52DE',
        dark: '#3634A3',
        contrastText: '#FFFFFF',
    },
    success: {
        main: '#34C759',
        light: '#30D158',
        dark: '#248A3D',
    },
    warning: {
        main: '#FF9500',
        light: '#FFCC00',
        dark: '#C93400',
    },
    error: {
        main: '#FF3B30',
        light: '#FF6961',
        dark: '#D70015',
    },
};

// ============================================================================
// Mode-specific palettes
// ============================================================================

const lightGrey = {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
};

const darkGrey = {
    50: '#1A1D27',
    100: '#1F2334',
    200: '#282D3E',
    300: '#353B4F',
    400: '#4B5468',
    500: '#6B7280',
    600: '#9CA3AF',
    700: '#D1D5DB',
    800: '#E5E7EB',
    900: '#F3F4F6',
};

const lightPalette = {
    ...sharedColors,
    grey: lightGrey,
    background: {
        default: '#F9FAFB',
        paper: '#FFFFFF',
    },
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        disabled: '#9CA3AF',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    action: {
        hover: 'rgba(0, 0, 0, 0.04)',
        selected: 'rgba(0, 0, 0, 0.08)',
    },
};

const darkPalette = {
    ...sharedColors,
    grey: darkGrey,
    background: {
        default: '#0F1117',
        paper: '#1A1D27',
    },
    text: {
        primary: '#E8EAED',
        secondary: '#9AA0A6',
        disabled: '#5F6368',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    action: {
        hover: 'rgba(255, 255, 255, 0.06)',
        selected: 'rgba(255, 255, 255, 0.10)',
    },
};

// ============================================================================
// Shadows
// ============================================================================

const lightShadows = [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ...Array(18).fill('none'),
] as const;

const darkShadows = [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    ...Array(18).fill('none'),
] as const;

// ============================================================================
// Typography (shared)
// ============================================================================

const typography = {
    fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Inter"',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
    ].join(','),

    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3 },
    h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { fontWeight: 500, textTransform: 'none' as const },
};

// ============================================================================
// Theme factory
// ============================================================================

type ThemeMode = 'light' | 'dark';

export function createAppTheme(mode: ThemeMode) {
    const isDark = mode === 'dark';
    const palette = isDark ? darkPalette : lightPalette;
    const shadows = isDark ? darkShadows : lightShadows;
    const grey = isDark ? darkGrey : lightGrey;

    return createTheme({
        palette: {
            mode,
            ...palette,
        },
        shadows: shadows as unknown as typeof createTheme extends (options: { shadows: infer S }) => unknown
            ? S
            : never,
        typography,
        spacing: 8,
        shape: { borderRadius: 12 },

        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        padding: '10px 20px',
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                        },
                    },
                    containedPrimary: {
                        background: 'linear-gradient(135deg, #007AFF 0%, #0051D4 100%)',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: isDark ? grey[200] : grey[200],
                        backgroundColor: isDark ? grey[50] : '#fff',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: grey[400],
                            borderWidth: 1,
                        },
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    variant: 'outlined',
                    size: 'small',
                },
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                        },
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    head: {
                        fontWeight: 600,
                        backgroundColor: isDark ? grey[100] : grey[50],
                    },
                },
            },
        },
    });
}

// Default light theme (backward compat)
export const theme = createAppTheme('light');

// Glassmorphism utility
export function getGlassEffect(mode: ThemeMode = 'light') {
    const base = mode === 'dark' ? '#1A1D27' : '#FFFFFF';
    return {
        background: alpha(base, 0.8),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(base, 0.3)}`,
    };
}

/** @deprecated Use getGlassEffect() instead */
export const glassEffect = getGlassEffect('light');

export type Theme = ReturnType<typeof createAppTheme>;
