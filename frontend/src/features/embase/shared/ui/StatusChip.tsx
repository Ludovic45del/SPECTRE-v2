import { memo } from 'react';
import { Box, Chip, Typography } from '@mui/material';

export const STATUS_OPTIONS = [
    { value: '', label: '-', color: 'default' as const },
    { value: 'OK', label: 'OK', color: 'success' as const },
    { value: 'KO', label: 'KO', color: 'error' as const },
];

export function renderStatusValue(selected: string) {
    const opt = STATUS_OPTIONS.find((o) => o.value === selected);
    if (!opt || opt.color === 'default') return '-';
    return <Chip label={opt.label} color={opt.color} size="small" sx={{ fontWeight: 600 }} />;
}

export const StatusChip = memo(function StatusChip({ label, value }: { label: string; value: string }) {
    const rendered = renderStatusValue(value);
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {label}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
                {typeof rendered === 'string' ? <Typography variant="body1">{rendered}</Typography> : rendered}
            </Box>
        </Box>
    );
});
