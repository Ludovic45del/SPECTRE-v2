/**
 * FsecPlanningRow — Row component for scheduling a single FSEC step
 * within the AssemblageInfoPopover dialog.
 */
import { useCallback, useMemo, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import dayjs, { type Dayjs } from 'dayjs';
import type { Membre } from '../../lib/planning.constants';
import type { LabEventsMap } from '../../lib/planning.hooks';
import { usePlanningStore } from '../../lib/planning.store';
import type { TimelineColumn } from '../../lib/planning.utils';
import {
    useCreateCampaignStep,
    useUpdateCampaignStep,
    useDeleteCampaignStep,
} from '@entities/planning/core/api/planning.queries';
import type { PlanningCampaignStep, PlanningMemberPeriod } from '@entities/planning/core/model/planning.schema';
import { createAvailabilityDay } from './AvailabilityDay';
import type { FsecInfo } from '../campaign/types';

export type { FsecInfo };

// ====================== Component ======================

export function FsecPlanningRow({
    fsec,
    existingStep,
    campaignUuid,
    column,
    assemblers,
    memberPeriodsMap,
    salleMachines,
    labEvents,
    stepLabel,
    fonctionLabel,
    salleName,
}: {
    fsec: FsecInfo;
    existingStep: PlanningCampaignStep | undefined;
    campaignUuid: string;
    column: TimelineColumn;
    assemblers: Membre[];
    memberPeriodsMap: Map<string, PlanningMemberPeriod[]>;
    salleMachines: Array<{ uuid: string; name: string }>;
    labEvents: LabEventsMap;
    stepLabel: string;
    fonctionLabel: string;
    salleName: string;
}) {
    const theme = useTheme();
    const selectedYear = usePlanningStore((s) => s.selectedYear);

    const createStep = useCreateCampaignStep();
    const updateStep = useUpdateCampaignStep();
    const deleteStep = useDeleteCampaignStep();

    const [editing, setEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [startDate, setStartDate] = useState<Dayjs>(
        dayjs(existingStep?.startDate ?? column.start.format('YYYY-MM-DD')),
    );
    const [endDate, setEndDate] = useState<Dayjs>(dayjs(existingStep?.endDate ?? column.end.format('YYYY-MM-DD')));

    const isScheduled = !!existingStep;
    const isPending = createStep.isPending || updateStep.isPending || deleteStep.isPending;

    const handleSave = useCallback(() => {
        const payload = {
            campaignUuid,
            fsecUuid: fsec.versionUuid,
            stepLabel,
            year: selectedYear,
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
        };
        if (existingStep) {
            updateStep.mutate({ uuid: existingStep.uuid, data: payload }, { onSuccess: () => setEditing(false) });
        } else {
            createStep.mutate(payload, { onSuccess: () => setEditing(false) });
        }
    }, [campaignUuid, fsec.versionUuid, selectedYear, startDate, endDate, existingStep, createStep, updateStep]);

    const handleDelete = useCallback(() => {
        if (existingStep) {
            deleteStep.mutate(
                { uuid: existingStep.uuid, year: selectedYear },
                {
                    onSuccess: () => {
                        setEditing(false);
                        setShowDeleteConfirm(false);
                    },
                },
            );
        }
    }, [existingStep, selectedYear, deleteStep]);

    // Memoized custom Day component with availability tooltips
    const DayWithAvailability = useMemo(
        () => createAvailabilityDay(assemblers, memberPeriodsMap, salleMachines, labEvents, fonctionLabel, salleName),
        [assemblers, memberPeriodsMap, salleMachines, labEvents, fonctionLabel, salleName],
    );

    if (!editing) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 1,
                    border: `1px solid`,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    {isScheduled ? (
                        <CheckIcon sx={{ fontSize: 15, color: theme.palette.success.main }} />
                    ) : (
                        <Box
                            sx={{
                                width: 15,
                                height: 15,
                                borderRadius: '50%',
                                border: `1.5px solid`,
                                borderColor: 'divider',
                                flexShrink: 0,
                            }}
                        />
                    )}
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1 }}>
                        {fsec.name}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, flexShrink: 0 }}>
                    {isScheduled && existingStep?.startDate && existingStep?.endDate && (
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                            {dayjs(existingStep.startDate).format('DD/MM')} —{' '}
                            {dayjs(existingStep.endDate).format('DD/MM')}
                        </Typography>
                    )}
                    <IconButton size="small" onClick={() => setEditing(true)} sx={{ p: 0.3 }}>
                        {isScheduled ? <EditIcon sx={{ fontSize: 15 }} /> : <AddIcon sx={{ fontSize: 15 }} />}
                    </IconButton>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                px: 1.5,
                py: 1.2,
                borderRadius: 1,
                border: `1px solid`,
                borderColor: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
        >
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                {fsec.name}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <DatePicker
                    label="Debut"
                    value={startDate}
                    onChange={(d) => {
                        if (!d) return;
                        setStartDate(d);
                        if (d.isAfter(endDate)) setEndDate(d);
                    }}
                    maxDate={endDate}
                    slots={{ day: DayWithAvailability }}
                    slotProps={{
                        textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: { '& .MuiInputBase-input': { fontSize: 12 } },
                        },
                    }}
                />
                <DatePicker
                    label="Fin"
                    value={endDate}
                    onChange={(d) => {
                        if (d) setEndDate(d);
                    }}
                    minDate={startDate}
                    slots={{ day: DayWithAvailability }}
                    slotProps={{
                        textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: { '& .MuiInputBase-input': { fontSize: 12 } },
                        },
                    }}
                />
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="space-between">
                <Box>
                    {isScheduled && !showDeleteConfirm && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isPending}
                        >
                            Supprimer
                        </Button>
                    )}
                    {isScheduled && showDeleteConfirm && (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" color="error" fontWeight={600}>
                                Confirmer ?
                            </Typography>
                            <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={handleDelete}
                                disabled={isPending}
                            >
                                {deleteStep.isPending ? '...' : 'Oui'}
                            </Button>
                            <Button size="small" variant="text" onClick={() => setShowDeleteConfirm(false)}>
                                Non
                            </Button>
                        </Stack>
                    )}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="text"
                        color="inherit"
                        onClick={() => {
                            setEditing(false);
                            setShowDeleteConfirm(false);
                        }}
                        disabled={isPending}
                    >
                        Annuler
                    </Button>
                    <Button size="small" variant="contained" onClick={handleSave} disabled={isPending}>
                        {isPending && !deleteStep.isPending
                            ? 'Enregistrement...'
                            : isScheduled
                              ? 'Sauvegarder'
                              : 'Planifier'}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
