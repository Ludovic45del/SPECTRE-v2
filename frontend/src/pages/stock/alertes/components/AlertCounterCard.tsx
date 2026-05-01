/**
 * AlertCounterCard — petite carte de comptage en haut de l'onglet Alertes.
 */

import { Paper, Stack, Typography } from '@mui/material';

interface AlertCounterCardProps {
    label: string;
    count: number;
    /** Couleur de l'accent gauche (hex). */
    accentColor: string;
    /** Couleur du compteur (hex). */
    countColor: string;
}

export function AlertCounterCard({ label, count, accentColor, countColor }: AlertCounterCardProps) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderColor: 'divider',
                borderLeft: `4px solid ${accentColor}`,
                borderRadius: 1,
            }}
        >
            <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="h4" sx={{ color: countColor, fontWeight: 600 }}>
                    {count}
                </Typography>
            </Stack>
        </Paper>
    );
}
