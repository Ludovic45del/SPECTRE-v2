/**
 * Assembly Step Modal
 * @module features/edit-assembly
 *
 * Fields from backend:
 * - fsec_version_id (required)
 * - operator / operator_user_uuid (Assembleur)
 * - start_date
 * - end_date
 * - comments
 * - assembly_bench_ids (multi-select referential)
 */

import { useState, useEffect, useCallback } from 'react';
import { TextField, Stack, Box, Grid2, Checkbox, FormControlLabel, FormGroup, FormLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    AssemblyStep,
    useCreateAssemblyStep,
    useUpdateAssemblyStep,
    useDeleteAssemblyStep,
} from '@entities/fsec/steps';
import { UserSelect, SPECTRE_OPERATOR_ROLES } from '@entities/user';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib';
import { StepModalLayout } from '@features/fsec/shared';

interface AssemblyStepModalProps {
    open: boolean;
    onClose: () => void;
    fsecVersionId: string;
    step?: AssemblyStep | null;
}

const AssemblyStepFormSchema = z.object({
    operatorUserUuid: z.string().uuid('Assembleur requis'),
    startDate: z.date({ required_error: 'Date requise' }),
    endDate: z.date().nullable().optional(),
    comments: z.string().nullable().optional(),
    assemblyBenchIds: z.array(z.number()).optional(),
});

type AssemblyStepForm = z.infer<typeof AssemblyStepFormSchema>;

// Referential - Assembly benches
const ASSEMBLY_BENCHES = [
    { id: 0, label: 'Banc 1' },
    { id: 1, label: 'Banc 2' },
    { id: 2, label: 'Banc 3' },
];

export function AssemblyStepModal({ open, onClose, fsecVersionId, step }: AssemblyStepModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isEditMode = Boolean(step);

    const createMutation = useCreateAssemblyStep();
    const updateMutation = useUpdateAssemblyStep();
    const deleteMutation = useDeleteAssemblyStep();
    const { showNotification } = useNotification();

    const { control, handleSubmit, reset, watch, setValue } = useForm<AssemblyStepForm>({
        mode: 'onBlur',
        resolver: zodResolver(AssemblyStepFormSchema),
        defaultValues: {
            operatorUserUuid: '',
            startDate: undefined,
            endDate: null,
            comments: '',
            assemblyBenchIds: [],
        },
    });

    const selectedBenches = watch('assemblyBenchIds') ?? [];

    useEffect(() => {
        if (open) {
            if (step) {
                reset({
                    operatorUserUuid: step.operatorUserUuid ?? '',
                    startDate: step.startDate ?? undefined,
                    endDate: step.endDate,
                    comments: step.comments ?? '',
                    assemblyBenchIds: step.assemblyBenchIds ?? [],
                });
            } else {
                reset({
                    operatorUserUuid: '',
                    startDate: undefined,
                    endDate: null,
                    comments: '',
                    assemblyBenchIds: [],
                });
            }
            setShowDeleteConfirm(false);
        }
    }, [open, step, reset]);

    const handleBenchToggle = useCallback(
        (benchId: number) => {
            const current = selectedBenches;
            if (current.includes(benchId)) {
                setValue(
                    'assemblyBenchIds',
                    current.filter((id) => id !== benchId),
                );
            } else {
                setValue('assemblyBenchIds', [...current, benchId]);
            }
        },
        [selectedBenches, setValue],
    );

    const isPending = createMutation.isPending || updateMutation.isPending;

    const onSubmit = useCallback(
        async (data: AssemblyStepForm) => {
            if (isPending) return;

            try {
                if (isEditMode && step) {
                    await updateMutation.mutateAsync({
                        uuid: step.uuid,
                        fsecVersionId,
                        operatorUserUuid: data.operatorUserUuid,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        comments: data.comments,
                        assemblyBenchIds: data.assemblyBenchIds,
                    });
                    showNotification('Assemblage mis à jour', 'success');
                } else {
                    await createMutation.mutateAsync({
                        fsecVersionId,
                        operatorUserUuid: data.operatorUserUuid,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        comments: data.comments,
                        assemblyBenchIds: data.assemblyBenchIds,
                    });
                    showNotification('Assemblage créé', 'success');
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
            showNotification('Assemblage supprimé', 'success');
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
            title="Nouvel assemblage"
            editTitle="Modifier l'assemblage"
            isEditMode={isEditMode}
            isPending={isPending}
            isDeleting={deleteMutation.isPending}
            showDeleteConfirm={showDeleteConfirm}
            onShowDeleteConfirm={handleShowDeleteConfirm}
            onHideDeleteConfirm={handleHideDeleteConfirm}
            onDelete={handleDelete}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="sm"
            modalId="assembly-step-modal"
        >
            <Stack spacing={3}>
                {/* Dates */}
                <Grid2 container spacing={2}>
                    <Grid2 size={6}>
                        <Controller
                            name="startDate"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                                <DatePicker
                                    {...field}
                                    label="Date de début"
                                    value={value ? dayjs(value) : null}
                                    onChange={(date) => onChange(date?.toDate() || null)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            inputProps: { 'aria-label': 'Date de début' },
                                        },
                                    }}
                                />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={6}>
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                                <DatePicker
                                    {...field}
                                    label="Date de fin"
                                    value={value ? dayjs(value) : null}
                                    onChange={(date) => onChange(date?.toDate() || null)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            inputProps: { 'aria-label': 'Date de fin' },
                                        },
                                    }}
                                />
                            )}
                        />
                    </Grid2>
                </Grid2>

                {/* Assembleur */}
                <Controller
                    name="operatorUserUuid"
                    control={control}
                    render={({ field, fieldState }) => (
                        <UserSelect
                            value={field.value || null}
                            onChange={(uuid) => field.onChange(uuid ?? '')}
                            roles={[...SPECTRE_OPERATOR_ROLES]}
                            label="Assembleur"
                            required
                            error={Boolean(fieldState.error)}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                {/* Assembly Benches */}
                <Box>
                    <FormLabel
                        component="legend"
                        sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}
                        id="assembly-benches-label"
                    >
                        Bancs d'assemblage
                    </FormLabel>
                    <FormGroup row aria-labelledby="assembly-benches-label">
                        {ASSEMBLY_BENCHES.map((bench) => (
                            <FormControlLabel
                                key={bench.id}
                                control={
                                    <Checkbox
                                        checked={selectedBenches.includes(bench.id)}
                                        onChange={() => handleBenchToggle(bench.id)}
                                        size="small"
                                        inputProps={{ 'aria-label': `Sélectionner ${bench.label}` }}
                                    />
                                }
                                label={bench.label}
                            />
                        ))}
                    </FormGroup>
                </Box>

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
                            inputProps={{ 'aria-label': "Commentaires sur l'assemblage" }}
                        />
                    )}
                />
            </Stack>
        </StepModalLayout>
    );
}
