/**
 * Gas Filling BP (Low Pressure) Step Modal (Step ID: 11)
 * @module features/edit-gas-filling-bp
 *
 * Refactored to use StepModalLayout for reduced duplication.
 */

import { useState, useEffect, useCallback } from 'react';
import { TextField, Stack, Grid2 } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    GasFillingBpStep,
    useCreateGasFillingBpStep,
    useUpdateGasFillingBpStep,
    useDeleteGasFillingBpStep,
    type CommonGasDataOptional,
} from '@entities/fsec/steps';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib';
import { StepModalLayout } from '@features/fsec/shared';

interface GasFillingBpStepModalProps {
    open: boolean;
    onClose: () => void;
    fsecVersionId: string;
    step?: GasFillingBpStep | null;
    /** Données communes à utiliser comme valeurs par défaut si le step n'en a pas */
    commonData?: CommonGasDataOptional;
}

const GasFillingBpStepFormSchema = z.object({
    leakRateDtri: z.string().nullable().optional(),
    gasType: z.string().nullable().optional(),
    experimentPressure: z.number().finite().min(0, 'Doit être positif').nullable().optional(),
    leakTestDuration: z.number().finite().min(0, 'Doit être positif').nullable().optional(),
    operator: z.string().min(1, 'Champ requis'),
    dateOfFulfilment: z.date({ required_error: 'Date requise' }),
    gasBase: z.number().nullable().optional(),
    gasContainer: z.number().nullable().optional(),
    observations: z.string().nullable().optional(),
});

type GasFillingBpStepForm = z.infer<typeof GasFillingBpStepFormSchema>;

const DEFAULT_VALUES = {
    leakRateDtri: null,
    gasType: null,
    experimentPressure: null,
    leakTestDuration: null,
    operator: undefined,
    dateOfFulfilment: undefined,
    gasBase: null,
    gasContainer: null,
    observations: null,
};

export function GasFillingBpStepModal({ open, onClose, fsecVersionId, step, commonData }: GasFillingBpStepModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isEditMode = Boolean(step);

    const createMutation = useCreateGasFillingBpStep();
    const updateMutation = useUpdateGasFillingBpStep();
    const deleteMutation = useDeleteGasFillingBpStep();
    const { showNotification } = useNotification();

    const { control, handleSubmit, reset } = useForm<GasFillingBpStepForm>({
        mode: 'onBlur',
        resolver: zodResolver(GasFillingBpStepFormSchema),
        defaultValues: DEFAULT_VALUES,
    });

    useEffect(() => {
        if (open) {
            reset(
                step
                    ? {
                          // Utiliser les données du step, ou les données communes si le step n'en a pas
                          leakRateDtri: step.leakRateDtri ?? commonData?.leakRateDtri ?? null,
                          gasType: step.gasType ?? commonData?.gasType ?? null,
                          experimentPressure: step.experimentPressure ?? commonData?.experimentPressure ?? null,
                          leakTestDuration: step.leakTestDuration ?? commonData?.leakTestDuration ?? null,
                          operator: step.operator ?? undefined,
                          dateOfFulfilment: step.dateOfFulfilment ?? undefined,
                          gasBase: step.gasBase,
                          gasContainer: step.gasContainer,
                          observations: step.observations,
                      }
                    : {
                          // Nouveau step: utiliser les données communes comme valeurs par défaut
                          ...DEFAULT_VALUES,
                          leakRateDtri: commonData?.leakRateDtri ?? null,
                          gasType: commonData?.gasType ?? null,
                          experimentPressure: commonData?.experimentPressure ?? null,
                          leakTestDuration: commonData?.leakTestDuration ?? null,
                      },
            );
            setShowDeleteConfirm(false);
        }
    }, [open, step, commonData, reset]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    const onSubmit = useCallback(
        async (data: GasFillingBpStepForm) => {
            if (isPending) return;
            try {
                if (isEditMode && step) {
                    await updateMutation.mutateAsync({ uuid: step.uuid, fsecVersionId, ...data });
                    showNotification('Remplissage BP mis à jour', 'success');
                } else {
                    await createMutation.mutateAsync({ fsecVersionId, ...data });
                    showNotification('Remplissage BP créé', 'success');
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
            showNotification('Remplissage BP supprimé', 'success');
            onClose();
        } catch (error) {
            showNotification(getErrorMessage(error, 'Erreur lors de la suppression'), 'error');
        }
    }, [step, deleteMutation, fsecVersionId, showNotification, onClose]);

    return (
        <StepModalLayout
            open={open}
            onClose={onClose}
            title="Nouveau remplissage gaz BP"
            editTitle="Modifier le remplissage gaz BP"
            isEditMode={isEditMode}
            isPending={isPending}
            isDeleting={deleteMutation.isPending}
            showDeleteConfirm={showDeleteConfirm}
            onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
            onHideDeleteConfirm={() => setShowDeleteConfirm(false)}
            onDelete={handleDelete}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="md"
        >
            <Stack spacing={3}>
                <Grid2 container spacing={2}>
                    <Grid2 size={6}>
                        <Controller
                            name="dateOfFulfilment"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                                <DatePicker
                                    {...field}
                                    label="Date de réalisation"
                                    value={value ? dayjs(value) : null}
                                    onChange={(date) => onChange(date?.toDate() || null)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            inputProps: { 'aria-label': 'Date de réalisation' },
                                        },
                                    }}
                                />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={6}>
                        <Controller
                            name="operator"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label="Opérateur"
                                    size="small"
                                    fullWidth
                                    inputProps={{ 'aria-label': 'Opérateur' }}
                                />
                            )}
                        />
                    </Grid2>
                </Grid2>

                <Grid2 container spacing={2}>
                    <Grid2 size={6}>
                        <Controller
                            name="gasType"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label="Type de gaz"
                                    size="small"
                                    fullWidth
                                    inputProps={{ 'aria-label': 'Type de gaz' }}
                                />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={6}>
                        <Controller
                            name="leakRateDtri"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label="Taux de fuite DTRI"
                                    size="small"
                                    fullWidth
                                    inputProps={{ 'aria-label': 'Taux de fuite DTRI' }}
                                />
                            )}
                        />
                    </Grid2>
                </Grid2>

                <Grid2 container spacing={2}>
                    <Grid2 size={6}>
                        <Controller
                            name="experimentPressure"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                        field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                                    }
                                    label="Pression d'expérimentation (bar)"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    inputProps={{ step: 0.01, 'aria-label': "Pression d'expérimentation en bar" }}
                                />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={6}>
                        <Controller
                            name="leakTestDuration"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                        field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                                    }
                                    label="Durée du test de fuite (min)"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    inputProps={{ 'aria-label': 'Durée du test de fuite en minutes' }}
                                />
                            )}
                        />
                    </Grid2>
                </Grid2>

                <Grid2 container spacing={2}>
                    <Grid2 size={6}>
                        <Controller
                            name="gasBase"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                        field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))
                                    }
                                    label="Base de gaz"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    inputProps={{ 'aria-label': 'Base de gaz' }}
                                />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={6}>
                        <Controller
                            name="gasContainer"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                        field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))
                                    }
                                    label="Conteneur de gaz"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    inputProps={{ 'aria-label': 'Conteneur de gaz' }}
                                />
                            )}
                        />
                    </Grid2>
                </Grid2>

                <Controller
                    name="observations"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            value={field.value ?? ''}
                            label="Observations"
                            multiline
                            rows={3}
                            size="small"
                            fullWidth
                            inputProps={{ 'aria-label': 'Observations' }}
                        />
                    )}
                />
            </Stack>
        </StepModalLayout>
    );
}
