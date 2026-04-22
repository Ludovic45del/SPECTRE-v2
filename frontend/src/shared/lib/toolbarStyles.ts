/**
 * Shared toolbar styles
 * @module shared/lib/toolbarStyles
 *
 * Common styles for toolbar components (FsecsToolbar, FasToolbar, CampaignsToolbar)
 */

import { alpha, type SxProps, type Theme } from '@mui/material';

/**
 * Get input styles with hover/focus effects
 */
export const getInputStyles = (theme: Theme): SxProps<Theme> => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: 1,
        transition: 'all 0.2s ease',
        '&:hover': {
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
        '&.Mui-focused': {
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
    },
});

/**
 * Get chip styles with custom colors
 */
export const getChipStyles = (bgColor: string, textColor: string): SxProps<Theme> => ({
    borderRadius: 1,
    backgroundColor: bgColor,
    color: textColor,
    fontWeight: 500,
    '& .MuiChip-deleteIcon': {
        color: textColor,
        '&:hover': { opacity: 0.7 },
    },
});
