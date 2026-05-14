/**
 * TopOperatorsCard - top 10 opérateurs par étapes complétées dans l'année.
 * @module pages/indicateurs/components
 */

import { memo, useMemo } from 'react';
import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import type { OperatorWorkload } from '@entities/indicators';

interface TopOperatorsCardProps {
    operators: OperatorWorkload[];
}

const TopOperatorsCard = memo(function TopOperatorsCard({ operators }: TopOperatorsCardProps) {
    const maxCount = useMemo(
        () => operators.reduce((m, o) => (o.stepsCount > m ? o.stepsCount : m), 0),
        [operators],
    );

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                Charge opérateurs — top 10
            </Typography>
            {operators.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Aucune étape datée dans l'année.
                </Typography>
            ) : (
                <Stack spacing={1.25}>
                    {operators.map((o) => {
                        const pct = maxCount > 0 ? (o.stepsCount / maxCount) * 100 : 0;
                        return (
                            <Box key={o.userUuid}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {o.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {o.stepsCount} étape{o.stepsCount > 1 ? 's' : ''}
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={pct}
                                    sx={{
                                        height: 6,
                                        borderRadius: 1,
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#5856D6',
                                        },
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Stack>
            )}
        </Paper>
    );
});

export default TopOperatorsCard;
