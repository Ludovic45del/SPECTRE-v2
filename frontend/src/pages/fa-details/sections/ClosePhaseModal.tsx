/**
 * Modal de clôture / édition Phase 3 - FA
 * @module pages/fa-details/sections
 *
 * - Si la FA est "En cours" : appelle useCloseFa (POST /close/)
 * - Si la FA est déjà "Clos" : appelle useUpdateFa (PUT) pour modifier les données
 */

import { memo, useCallback, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Fa, useCloseFa, useUpdateFa } from '@entities/fa';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib';

// ============================================================================
// Form Schema
// ============================================================================

const ClosePhaseFormSchema = z.object({
    validatorName: z.string().min(1, 'Le nom du validateur est requis').max(200),
    closureValidation: z.string().max(4000).optional().default(''),
    closureDate: z.date({ required_error: 'La date de clôture est requise' }),
});

type ClosePhaseFormData = z.infer<typeof ClosePhaseFormSchema>;

// ============================================================================
// Types
// ============================================================================

interface ClosePhaseModalProps {
    open: boolean;
    onClose: () => void;
    fa: Fa;
}

// ============================================================================
// Component
// ============================================================================

export const ClosePhaseModal = memo(function ClosePhaseModal({ open, onClose, fa }: ClosePhaseModalProps) {
    const closeMutation = useCloseFa();
    const updateMutation = useUpdateFa();
    const { showNotification } = useNotification();

    const isClosed = fa.statusId === 2;
    const activeMutation = isClosed ? updateMutation : closeMutation;

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ClosePhaseFormData>({
        resolver: zodResolver(ClosePhaseFormSchema),
        defaultValues: {
            validatorName: '',
            closureValidation: '',
            closureDate: new Date(),
        },
    });

    // Pré-remplir avec les données existantes à l'ouverture
    useEffect(() => {
        if (open) {
            reset({
                validatorName: fa.closureValidatorName ?? '',
                closureValidation: fa.closureValidation ?? '',
                closureDate: fa.closureDate ? new Date(fa.closureDate) : new Date(),
            });
        }
    }, [open, fa, reset]);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [reset, onClose]);

    const onSubmit = useCallback(
        async (data: ClosePhaseFormData) => {
            try {
                if (isClosed) {
                    await updateMutation.mutateAsync({
                        uuid: fa.uuid,
                        closureValidatorName: data.validatorName,
                        closureValidation: data.closureValidation ?? '',
                        closureDate: data.closureDate,
                    });
                    showNotification('Données de clôture mises à jour', 'success');
                } else {
                    await closeMutation.mutateAsync({
                        uuid: fa.uuid,
                        validatorName: data.validatorName,
                        closureValidation: data.closureValidation ?? '',
                        closureDate: data.closureDate,
                    });
                    showNotification('FA clôturée avec succès', 'success');
                }
                handleClose();
            } catch (err: unknown) {
                showNotification(getErrorMessage(err, 'Erreur lors de la sauvegarde'), 'error');
            }
        },
        [fa.uuid, isClosed, closeMutation, updateMutation, showNotification, handleClose],
    );

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle>{isClosed ? 'Modifier la clôture' : 'Clôturer la FA'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Controller
                            name="validatorName"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Validé par (Chef Labo + IEC) *"
                                    size="small"
                                    fullWidth
                                    error={Boolean(errors.validatorName)}
                                    helperText={errors.validatorName?.message}
                                />
                            )}
                        />

                        <Controller
                            name="closureDate"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    label="Date de clôture *"
                                    value={field.value ? dayjs(field.value) : null}
                                    onChange={(d) => field.onChange(d?.toDate() ?? null)}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            error: Boolean(errors.closureDate),
                                            helperText: errors.closureDate?.message,
                                        },
                                    }}
                                />
                            )}
                        />

                        <Controller
                            name="closureValidation"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Validation de clôture"
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    error={Boolean(errors.closureValidation)}
                                    helperText={errors.closureValidation?.message}
                                    placeholder="Explication de la résolution de l'anomalie..."
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} disabled={activeMutation.isPending}>
                        Annuler
                    </Button>
                    <Button type="submit" variant="contained" disabled={activeMutation.isPending}>
                        {activeMutation.isPending ? 'Sauvegarde...' : isClosed ? 'Enregistrer' : 'Clôturer'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
});
