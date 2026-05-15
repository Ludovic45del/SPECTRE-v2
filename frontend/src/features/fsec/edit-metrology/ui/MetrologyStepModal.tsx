/**
 * Metrology Step Modal
 * @module features/edit-metrology
 *
 * Fields from backend:
 * - fsec_version_id (required)
 * - rack_id (referential)
 * - metrologist_name
 * - date
 * - comments
 * - machine_uuids (machines B2, multi-select)
 */

import { useState, useEffect, useCallback } from 'react';
import { TextField, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    MetrologyStep,
    useCreateMetrologyStep,
    useUpdateMetrologyStep,
    useDeleteMetrologyStep,
    FSEC_RACKS_LIST,
} from '@entities/fsec/steps';
import { UserSelect } from '@entities/user';
import { MachineMultiSelect } from '@entities/material';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib';
import { StepModalLayout } from '@features/fsec/shared';

interface MetrologyStepModalProps {
    open: boolean;
    onClose: () => void;
    fsecVersionId: string;
    step?: MetrologyStep | null;
}

const MetrologyStepFormSchema = z.object({
    rackId: z.number().nullable().optional(),
    metrologistUserUuid: z.string().uuid('Métrologue requis'),
    date: z.date({ required_error: 'Date requise' }),
    comments: z.string().nullable().optional(),
    machineUuids: z.array(z.string().uuid()),
});

type MetrologyStepForm = z.infer<typeof MetrologyStepFormSchema>;

export function MetrologyStepModal({ open, onClose, fsecVersionId, step }: MetrologyStepModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isEditMode = Boolean(step);

    const createMutation = useCreateMetrologyStep();
    const updateMutation = useUpdateMetrologyStep();
    const deleteMutation = useDeleteMetrologyStep();
    const { showNotification } = useNotification();

    const { control, handleSubmit, reset } = useForm<MetrologyStepForm>({
        mode: 'onBlur',
        resolver: zodResolver(MetrologyStepFormSchema),
        defaultValues: {
            rackId: null,
            metrologistUserUuid: '',
            date: undefined,
            comments: '',
            machineUuids: [],
        },
    });

    useEffect(() => {
        if (open) {
            if (step) {
                reset({
                    rackId: step.rackId,
                    metrologistUserUuid: step.metrologistUserUuid ?? '',
                    date: step.date ?? undefined,
                    comments: step.comments ?? '',
                    machineUuids: step.machineUuids ?? [],
                });
            } else {
                reset({
                    rackId: null,
                    metrologistUserUuid: '',
                    date: undefined,
                    comments: '',
                    machineUuids: [],
                });
            }
            setShowDeleteConfirm(false);
        }
    }, [open, step, reset]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    const onSubmit = useCallback(
        async (data: MetrologyStepForm) => {
            if (isPending) return;

            try {
                if (isEditMode && step) {
                    await updateMutation.mutateAsync({
                        uuid: step.uuid,
                        fsecVersionId,
                        rackId: data.rackId,
                        metrologistUserUuid: data.metrologistUserUuid,
                        date: data.date,
                        comments: data.comments,
                        machineUuids: data.machineUuids,
                    });
                    showNotification('Métrologie mise à jour', 'success');
                } else {
                    await createMutation.mutateAsync({
                        fsecVersionId,
                        rackId: data.rackId,
                        metrologistUserUuid: data.metrologistUserUuid,
                        date: data.date,
                        comments: data.comments,
                        machineUuids: data.machineUuids,
                    });
                    showNotification('Métrologie créée', 'success');
                }
                onClose();
            } catch (error) {
                showNotification(getErrorMessage(error, 'Erreur lors de la sauvegarde'), 'error');
            }
        },
        [isPending, isEditMode, step, fsecVersionId, updateMutation, createMutation, showNotification, onClose],
    );

    const handleDelete = useCallback(async () => {
        if (!step) return;
        try {
            await deleteMutation.mutateAsync({ uuid: step.uuid, fsecVersionId });
            showNotification('Métrologie supprimée', 'success');
            onClose();
        } catch (error) {
            showNotification(getErrorMessage(error, 'Erreur lors de la suppression'), 'error');
        }
    }, [step, fsecVersionId, deleteMutation, showNotification, onClose]);

    const handleShowDeleteConfirm = useCallback(() => setShowDeleteConfirm(true), []);
    const handleHideDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);

    return (
        <StepModalLayout
            open={open}
            onClose={onClose}
            title="Nouvelle métrologie"
            editTitle="Modifier la métrologie"
            isEditMode={isEditMode}
            isPending={isPending}
            isDeleting={deleteMutation.isPending}
            showDeleteConfirm={showDeleteConfirm}
            onShowDeleteConfirm={handleShowDeleteConfirm}
            onHideDeleteConfirm={handleHideDeleteConfirm}
            onDelete={handleDelete}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="sm"
            modalId="metrology-step-modal"
        >
            <Stack spacing={3}>
                {/* Date */}
                <Controller
                    name="date"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                        <DatePicker
                            {...field}
                            label="Date"
                            value={value ? dayjs(value) : null}
                            onChange={(date) => onChange(date?.toDate() || null)}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    inputProps: { 'aria-label': 'Date de la métrologie' },
                                },
                            }}
                        />
                    )}
                />

                {/* Métrologue (dropdown connecté à la base users) */}
                <Controller
                    name="metrologistUserUuid"
                    control={control}
                    render={({ field, fieldState }) => (
                        <UserSelect
                            value={field.value || null}
                            onChange={(uuid) => field.onChange(uuid ?? '')}
                            roles={['metrologue']}
                            label="Métrologue"
                            required
                            error={Boolean(fieldState.error)}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                {/* Conteneur ou Rack */}
                <Controller
                    name="rackId"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth size="small">
                            <InputLabel id="rack-select-label">Conteneur ou Rack</InputLabel>
                            <Select
                                {...field}
                                labelId="rack-select-label"
                                value={field.value ?? ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === '' ? null : Number(val));
                                }}
                                label="Conteneur ou Rack"
                                inputProps={{ 'aria-label': 'Sélectionner un conteneur ou rack' }}
                            >
                                <MenuItem value="">
                                    <em>Non spécifié</em>
                                </MenuItem>
                                {FSEC_RACKS_LIST.map((rack) => (
                                    <MenuItem key={rack.id} value={rack.id}>
                                        {rack.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />

                {/* Machines B2 */}
                <Controller
                    name="machineUuids"
                    control={control}
                    render={({ field, fieldState }) => (
                        <MachineMultiSelect
                            value={field.value ?? []}
                            onChange={field.onChange}
                            roomCode="B2"
                            label="Machines B2"
                            error={Boolean(fieldState.error)}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                {/* Comments */}
                <Controller
                    name="comments"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            value={field.value ?? ''}
                            label="Commentaires"
                            multiline
                            rows={3}
                            size="small"
                            fullWidth
                            inputProps={{ 'aria-label': 'Commentaires sur la métrologie' }}
                        />
                    )}
                />
            </Stack>
        </StepModalLayout>
    );
}
