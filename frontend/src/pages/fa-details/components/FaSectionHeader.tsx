/**
 * FA Section Header - Phase chip badge with divider
 * @module pages/fa-details/components
 *
 * Reusable header for FA detail sections. Uses a color-coded Chip
 * (unlike Campaign's SectionHeader which uses Typography h6) because
 * FA phases have semantic colors (warning for Ouvert, info for En cours, etc.).
 */

import { memo } from 'react';
import { Box, Chip, Divider } from '@mui/material';

interface FaSectionHeaderProps {
    /** Section label (e.g. "Phase 1 - Ouvert") */
    label: string;
    /** MUI color or hex for the chip background (e.g. 'warning.main', '#66BB6A') */
    chipColor: string;
}

export const FaSectionHeader = memo(function FaSectionHeader({ label, chipColor }: FaSectionHeaderProps) {
    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                    label={label}
                    size="small"
                    sx={{ bgcolor: chipColor, color: 'white', fontWeight: 700 }}
                    aria-hidden="true"
                />
            </Box>
            <Divider sx={{ mb: 2 }} aria-hidden="true" />
        </>
    );
});
