/**
 * MemberPeriodPopover — Popover for creating/editing a member period (type + dates + comment).
 */
import { useState } from 'react';
import { Autocomplete, Box, Button, IconButton, Popover, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Close } from '@mui/icons-material';
import dayjs, { type Dayjs } from 'dayjs';
import { PERIODES, type Periode, getPeriodeMeta } from '../../lib/planning.constants';
import { usePlanningColors } from '../../lib/planning.hooks';
import type { PlanningMemberPeriod } from '@entities/planning/core/model/planning.schema';
import {
    useCreateMemberPeriod,
    useDeleteMemberPeriod,
    useUpdateMemberPeriod,
} from '@entities/planning/core/api/planning.queries';

// ====================== Types ======================

export interface MemberPeriodPopoverProps {
    anchorEl: HTMLElement;
    existingPeriod?: PlanningMemberPeriod;
    defaultDate: string;
    memberName: string;
    memberRole: string;
    year: number;
    onClose: () => void;
}

// ====================== Component ======================

export function MemberPeriodPopover({
    anchorEl,
    existingPeriod,
    defaultDate,
    memberName,
    memberRole,
    year,
    onClose,
}: MemberPeriodPopoverProps) {
    const colors = usePlanningColors();
    const createPeriod = useCreateMemberPeriod();
    const updatePeriod = useUpdateMemberPeriod();
    const deletePeriod = useDeleteMemberPeriod();

    const [periodType, setPeriodType] = useState<Periode | null>(
        existingPeriod ? (getPeriodeMeta(existingPeriod.periodType) ?? null) : null,
    );
    const [comment, setComment] = useState(existingPeriod?.commentaire ?? '');
    const [startDate, setStartDate] = useState<Dayjs>(dayjs(existingPeriod?.startDate ?? defaultDate));
    const [endDate, setEndDate] = useState<Dayjs>(dayjs(existingPeriod?.endDate ?? defaultDate));

    const handleSave = () => {
        if (!periodType) return;
        const payload = {
            memberName,
            memberRole,
            year,
            periodType: periodType.value,
            commentaire: comment.trim() || null,
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
        };
        if (existingPeriod) {
            updatePeriod.mutate({ uuid: existingPeriod.uuid, data: payload }, { onSuccess: onClose });
        } else {
            createPeriod.mutate(payload, { onSuccess: onClose });
        }
    };

    const handleDelete = () => {
        if (existingPeriod) {
            deletePeriod.mutate({ uuid: existingPeriod.uuid, year }, { onSuccess: onClose });
        }
    };

    return (
        <Popover
            open
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{ paper: { sx: { p: 2.5, width: 360 } } }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography fontSize={13} fontWeight={700} color={colors.accent}>
                    {existingPeriod ? 'Modifier la periode' : 'Nouvelle periode'}
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ p: 0.2 }}>
                    <Close sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {/* Period type selector */}
            <Autocomplete
                options={PERIODES}
                value={periodType}
                onChange={(_, v) => setPeriodType(v)}
                getOptionLabel={(o) => o?.label ?? ''}
                renderInput={(params) => <TextField {...params} label="Type de periode" size="small" />}
                size="small"
                isOptionEqualToValue={(o, v) => o?.value === v?.value}
                renderOption={(props, option) => (
                    <li {...props} key={option.value}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: option.color,
                                mr: 1,
                                flexShrink: 0,
                            }}
                        />
                        {option.label}
                    </li>
                )}
                sx={{ mb: 1.5 }}
            />

            {/* Date range */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <DatePicker
                    label="Debut"
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

            {/* Comment */}
            <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={3}
                size="small"
                label="Commentaire (optionnel)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{ mb: 1.5, '& .MuiInputBase-input': { fontSize: 12 } }}
            />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                {existingPeriod ? (
                    <Button
                        size="small"
                        color="error"
                        onClick={handleDelete}
                        disabled={deletePeriod.isPending}
                        sx={{ fontSize: 11, textTransform: 'none' }}
                    >
                        {deletePeriod.isPending ? 'Suppression...' : 'Supprimer'}
                    </Button>
                ) : (
                    <span />
                )}
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleSave}
                    disabled={!periodType || createPeriod.isPending || updatePeriod.isPending}
                    sx={{
                        fontSize: 11,
                        textTransform: 'none',
                        bgcolor: periodType?.color ?? colors.blue,
                        '&:hover': { bgcolor: periodType?.color ?? colors.blue, filter: 'brightness(0.9)' },
                    }}
                >
                    {createPeriod.isPending || updatePeriod.isPending
                        ? 'En cours...'
                        : existingPeriod
                          ? 'Modifier'
                          : 'Ajouter'}
                </Button>
            </Box>
        </Popover>
    );
}
