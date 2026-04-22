/**
 * FA Timeline - Chronological history of FA events
 * @module pages/fa-details/sections
 *
 * Custom vertical timeline showing creation, IEC validations, and closure
 */

import { useMemo, memo } from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Fa } from '@entities/fa';
import { formatDateShort } from '@shared/lib';
import { FaSectionHeader, PAPER_BASE_SX } from '../components';

// ============================================================================
// Types
// ============================================================================

interface FaTimelineProps {
    fa: Fa;
}

interface TimelineEvent {
    label: string;
    date: string | Date | null | undefined;
    validatorName: string | null | undefined;
    isCompleted: boolean;
    color: string;
}

// ============================================================================
// Component
// ============================================================================

export const FaTimeline = memo(function FaTimeline({ fa }: FaTimelineProps) {
    const events = useMemo<TimelineEvent[]>(
        () => [
            {
                label: 'Création de la FA',
                date: fa.createdAt,
                validatorName: null,
                isCompleted: true,
                color: '#FFA726',
            },
            {
                label: 'Validation IEC - Phase Ouvert',
                date: fa.iecValidationOpenDate,
                validatorName: fa.iecValidationOpenName,
                isCompleted: fa.iecValidationOpen === true,
                color: '#FFA726',
            },
            {
                label: 'Validation IEC - Phase En cours',
                date: fa.iecValidationProgressDate,
                validatorName: fa.iecValidationProgressName,
                isCompleted: fa.iecValidationProgress === true,
                color: '#42A5F5',
            },
            {
                label: 'Clôture',
                date: fa.closureDate,
                validatorName: fa.closureValidatorName,
                isCompleted: fa.statusId === 2,
                color: '#66BB6A',
            },
        ],
        [fa],
    );

    return (
        <Paper variant="outlined" sx={PAPER_BASE_SX} component="section" aria-label="Historique de la FA">
            <FaSectionHeader label="Historique" chipColor="grey.600" />

            <Stack spacing={0}>
                {events.map((event, index) => (
                    <Box key={event.label} sx={{ display: 'flex', gap: 2 }}>
                        {/* Left: icon + connector line */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: 24,
                                flexShrink: 0,
                            }}
                        >
                            {event.isCompleted ? (
                                <CheckCircleIcon sx={{ fontSize: 24, color: event.color }} aria-hidden="true" />
                            ) : (
                                <RadioButtonUncheckedIcon sx={{ fontSize: 24, color: 'grey.400' }} aria-hidden="true" />
                            )}
                            {index < events.length - 1 && (
                                <Box
                                    sx={{
                                        width: 2,
                                        flexGrow: 1,
                                        minHeight: 24,
                                        bgcolor: event.isCompleted ? event.color : 'grey.300',
                                    }}
                                />
                            )}
                        </Box>

                        {/* Right: content */}
                        <Box sx={{ pb: index < events.length - 1 ? 2 : 0, minHeight: 48 }}>
                            <Typography
                                variant="body2"
                                fontWeight={event.isCompleted ? 600 : 400}
                                color={event.isCompleted ? 'text.primary' : 'text.disabled'}
                            >
                                {event.label}
                            </Typography>
                            {event.isCompleted && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDateShort(event.date)}
                                    </Typography>
                                    {event.validatorName && (
                                        <Typography variant="caption" color="text.secondary">
                                            — {event.validatorName}
                                        </Typography>
                                    )}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
});
