/**
 * DataChip Component - Colored Chip for Types/Status
 * @module widgets/data-chip
 *
 * Source: Legacy src/core/chip/DataChip.tsx
 */

import { Chip, useTheme, type ChipProps } from '@mui/material';

interface DataChipProps extends Omit<ChipProps, 'color'> {
    label: string;
    color?: string | null;
}

export function DataChip({ label, color, sx, ...props }: DataChipProps) {
    const theme = useTheme();
    const fallback = theme.palette.grey[300];
    const bgColor = color ?? fallback;

    return (
        <Chip
            label={label}
            size="small"
            sx={{
                backgroundColor: bgColor,
                color: getContrastColor(bgColor),
                fontWeight: 500,
                borderRadius: 1,
                ...sx,
            }}
            {...props}
        />
    );
}

/**
 * Get contrasting text color for readability
 */
function getContrastColor(hexColor: string): string {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
}
