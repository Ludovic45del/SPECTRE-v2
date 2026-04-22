/**
 * EventPopover — Popover for creating/editing a lab event (category + dates + description).
 */
import { useState } from 'react';
import { Box, Button, IconButton, MenuItem, Popover, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Close } from '@mui/icons-material';
import dayjs, { type Dayjs } from 'dayjs';
import { LAB_EVENT_CATEGORIES, getEventCategoryMeta } from '../../lib/planning.constants';
import { usePlanningColors } from '../../lib/planning.hooks';
import { useCreateLabEvent, useDeleteLabEvent, useUpdateLabEvent } from '@entities/planning/core/api/planning.queries';
import type { LabEvent } from '@entities/planning/core/model/planning.schema';

export interface EventPopoverProps {
    anchorEl: HTMLElement;
    existingEvent?: LabEvent;
    defaultDate: string;
    machineUuid: string;
    onClose: () => void;
}

export function EventPopover({ anchorEl, existingEvent, defaultDate, machineUuid, onClose }: EventPopoverProps) {
    const colors = usePlanningColors();
    const createEvent = useCreateLabEvent();
    const updateEvent = useUpdateLabEvent();
    const deleteEvent = useDeleteLabEvent();

    const [category, setCategory] = useState(existingEvent?.category ?? LAB_EVENT_CATEGORIES[0].label);
    const [description, setDescription] = useState(existingEvent?.description ?? '');
    const [startDate, setStartDate] = useState<Dayjs>(dayjs(existingEvent?.startDate ?? defaultDate));
    const [endDate, setEndDate] = useState<Dayjs>(dayjs(existingEvent?.endDate ?? defaultDate));

    const handleSave = () => {
        if (!category) return;
        const payload = {
            machineUuid,
            category,
            description: description.trim(),
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
        };
        if (existingEvent) {
            updateEvent.mutate({ uuid: existingEvent.uuid, data: payload }, { onSuccess: onClose });
        } else {
            createEvent.mutate(payload, { onSuccess: onClose });
        }
    };

    const handleDelete = () => {
        if (existingEvent) {
            deleteEvent.mutate({ uuid: existingEvent.uuid }, { onSuccess: onClose });
        }
    };

    const categoryMeta = getEventCategoryMeta(category);

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
                    {existingEvent ? 'Modifier l\u2019événement' : 'Nouvel événement'}
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ p: 0.2 }}>
                    <Close sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {/* Category select */}
            <TextField
                select
                fullWidth
                size="small"
                label="Catégorie"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ mb: 1.5, '& .MuiInputBase-input': { fontSize: 12 } }}
            >
                {LAB_EVENT_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.label} value={cat.label}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }}
                            />
                            <span>{cat.label}</span>
                        </Box>
                    </MenuItem>
                ))}
            </TextField>

            {/* Date range */}
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

            {/* Description */}
            <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={3}
                size="small"
                label="Description (optionnel)"
                placeholder="Détails de l'événement..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 1.5, '& .MuiInputBase-input': { fontSize: 12 } }}
            />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                {existingEvent ? (
                    <Button
                        size="small"
                        color="error"
                        onClick={handleDelete}
                        disabled={deleteEvent.isPending}
                        sx={{ fontSize: 11, textTransform: 'none' }}
                    >
                        {deleteEvent.isPending ? 'Suppression...' : 'Supprimer'}
                    </Button>
                ) : (
                    <span />
                )}
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleSave}
                    disabled={createEvent.isPending || updateEvent.isPending}
                    sx={{
                        fontSize: 11,
                        textTransform: 'none',
                        bgcolor: categoryMeta?.color ?? colors.blue,
                        '&:hover': { bgcolor: categoryMeta?.color ?? colors.blue, filter: 'brightness(0.9)' },
                    }}
                >
                    {createEvent.isPending || updateEvent.isPending
                        ? 'En cours...'
                        : existingEvent
                          ? 'Modifier'
                          : 'Ajouter'}
                </Button>
            </Box>
        </Popover>
    );
}
