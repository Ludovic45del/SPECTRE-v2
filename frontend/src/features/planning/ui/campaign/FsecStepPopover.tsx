/**
 * FsecStepPopover — Popover DatePicker pour créer/modifier/supprimer un step FSEC.
 *
 * En création depuis la vue couloirs, aucune FSEC n'est pré-sélectionnée :
 * `fsecOptions` fournit la liste des FSEC planifiables et l'utilisateur choisit.
 */
import { useMemo, useState } from 'react';
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Popover, Select, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Close } from '@mui/icons-material';
import dayjs, { type Dayjs } from 'dayjs';
import {
    useCreateCampaignStep,
    useUpdateCampaignStep,
    useDeleteCampaignStep,
} from '@entities/planning/core/api/planning.queries';
import { usePlanningColors } from '../../lib/planning.hooks';
import type { PlanningCampaignStep } from '@entities/planning/core/model/planning.schema';

// ====================== Types ======================

export interface FsecOption {
    versionUuid: string;
    name: string;
}

interface FsecStepPopoverProps {
    anchorEl: HTMLElement;
    existingStep?: PlanningCampaignStep;
    defaultDate: string;
    campaignUuid: string;
    /** FSEC fixe (édition d'un step existant). */
    fsecUuid?: string;
    fsecName?: string;
    /** FSEC sélectionnables (création depuis la vue couloirs). */
    fsecOptions?: FsecOption[];
    stepLabel: string;
    stepColor: string;
    year: number;
    onClose: () => void;
}

// ====================== Component ======================

export function FsecStepPopover({
    anchorEl,
    existingStep,
    defaultDate,
    campaignUuid,
    fsecUuid,
    fsecName,
    fsecOptions,
    stepLabel,
    stepColor,
    year,
    onClose,
}: FsecStepPopoverProps) {
    const colors = usePlanningColors();
    const createStep = useCreateCampaignStep();
    const updateStep = useUpdateCampaignStep();
    const deleteStep = useDeleteCampaignStep();

    const [startDate, setStartDate] = useState<Dayjs>(dayjs(existingStep?.startDate ?? defaultDate));
    const [endDate, setEndDate] = useState<Dayjs>(dayjs(existingStep?.endDate ?? defaultDate));

    // FSEC ciblée : fixe en édition, choisie via la liste en création.
    const showPicker = !existingStep && !fsecUuid && (fsecOptions?.length ?? 0) > 0;
    const [pickedFsec, setPickedFsec] = useState<string>(fsecUuid ?? fsecOptions?.[0]?.versionUuid ?? '');
    const targetFsec = fsecUuid ?? existingStep?.fsecUuid ?? pickedFsec;

    const displayName = useMemo(() => {
        if (fsecName) return fsecName;
        return fsecOptions?.find((f) => f.versionUuid === targetFsec)?.name ?? '';
    }, [fsecName, fsecOptions, targetFsec]);

    const handleSave = () => {
        if (!targetFsec) return;
        const payload = {
            campaignUuid,
            fsecUuid: targetFsec,
            stepLabel,
            year,
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
        };
        if (existingStep) {
            updateStep.mutate({ uuid: existingStep.uuid, data: payload }, { onSuccess: onClose });
        } else {
            createStep.mutate(payload, { onSuccess: onClose });
        }
    };

    const handleDelete = () => {
        if (existingStep) {
            deleteStep.mutate({ uuid: existingStep.uuid, year }, { onSuccess: onClose });
        }
    };

    return (
        <Popover
            open
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{ paper: { sx: { p: 2, width: 320 } } }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: stepColor, flexShrink: 0 }} />
                    <Typography fontSize={13} fontWeight={700} color={colors.accent}>
                        {existingStep ? `Modifier ${stepLabel}` : `Planifier ${stepLabel}`}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ p: 0.2 }}>
                    <Close sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {showPicker ? (
                <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
                    <InputLabel>FSEC</InputLabel>
                    <Select
                        label="FSEC"
                        value={pickedFsec}
                        onChange={(e) => setPickedFsec(e.target.value)}
                        sx={{ '& .MuiSelect-select': { fontSize: 12 } }}
                    >
                        {fsecOptions!.map((f) => (
                            <MenuItem key={f.versionUuid} value={f.versionUuid} sx={{ fontSize: 12 }}>
                                {f.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ) : (
                <Typography fontSize={11} color="text.secondary" sx={{ mb: 1 }}>
                    {displayName}
                </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <DatePicker
                    label="Début"
                    value={startDate}
                    onChange={(d) => {
                        if (!d) return;
                        setStartDate(d);
                        if (d.isAfter(endDate)) setEndDate(d);
                    }}
                    maxDate={endDate}
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
                    slotProps={{
                        textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: { '& .MuiInputBase-input': { fontSize: 12 } },
                        },
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                {existingStep ? (
                    <Button
                        size="small"
                        color="error"
                        onClick={handleDelete}
                        disabled={deleteStep.isPending}
                        sx={{ fontSize: 11, textTransform: 'none' }}
                    >
                        {deleteStep.isPending ? 'Suppression...' : 'Supprimer'}
                    </Button>
                ) : (
                    <span />
                )}
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleSave}
                    disabled={createStep.isPending || updateStep.isPending || !targetFsec}
                    sx={{
                        fontSize: 11,
                        textTransform: 'none',
                        bgcolor: stepColor,
                        '&:hover': { bgcolor: stepColor, filter: 'brightness(0.9)' },
                    }}
                >
                    {createStep.isPending || updateStep.isPending
                        ? 'En cours...'
                        : existingStep
                          ? 'Modifier'
                          : 'Planifier'}
                </Button>
            </Box>
        </Popover>
    );
}
