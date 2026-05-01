/**
 * AlertSection — section repliable affichant une catégorie d'alerte.
 */

import { type ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

export type AlertSeverity = 'danger' | 'warning' | 'info';

const PALETTES: Record<AlertSeverity, { headerBg: string; headerBorder: string; titleColor: string; countBg: string; countColor: string }> = {
    danger: {
        headerBg: '#fef2f2',
        headerBorder: '#fecaca',
        titleColor: '#b91c1c',
        countBg: '#ffffff',
        countColor: '#b91c1c',
    },
    warning: {
        headerBg: '#fffbeb',
        headerBorder: '#fde68a',
        titleColor: '#b45309',
        countBg: '#ffffff',
        countColor: '#b45309',
    },
    info: {
        headerBg: '#eff6ff',
        headerBorder: '#bfdbfe',
        titleColor: '#1d4ed8',
        countBg: '#ffffff',
        countColor: '#1d4ed8',
    },
};

interface AlertSectionProps {
    title: string;
    severity: AlertSeverity;
    icon: ReactNode;
    count: number;
    children: ReactNode;
}

export function AlertSection({ title, severity, icon, count, children }: AlertSectionProps) {
    const palette = PALETTES[severity];
    return (
        <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
            <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: palette.headerBg,
                    borderBottom: `1px solid ${palette.headerBorder}`,
                }}
            >
                <Box sx={{ color: palette.titleColor, display: 'flex' }}>{icon}</Box>
                <Typography sx={{ flex: 1, fontWeight: 600, color: palette.titleColor, fontSize: '0.875rem' }}>
                    {title}
                </Typography>
                <Box
                    sx={{
                        bgcolor: palette.countBg,
                        color: palette.countColor,
                        px: 1.25,
                        py: 0.25,
                        borderRadius: 5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        minWidth: 28,
                        textAlign: 'center',
                    }}
                >
                    {count}
                </Box>
            </Stack>
            {children}
        </Paper>
    );
}
