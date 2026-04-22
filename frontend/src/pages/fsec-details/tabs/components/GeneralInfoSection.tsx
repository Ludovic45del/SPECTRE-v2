/**
 * General Info Section for FSEC Overview Tab
 * @module pages/fsec-details/tabs/components
 *
 * Inline editing for general FSEC fields (dates, localisation, comments).
 * DTRI number is read-only (inherited from campaign).
 */

import { useState, useCallback } from 'react';
import { Box, Button, Divider, Grid, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Fsec, useUpdateFsec } from '@entities/fsec';
import { FsecGeneralFormSchema } from '@entities/fsec/core/model/fsec.schema';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import dayjs, { Dayjs } from 'dayjs';
import { useNotification } from '@shared/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GeneralInfoSectionProps {
    fsec: Fsec;
    dtriNumber?: number | null;
    paperSx: Record<string, unknown>;
    editButtonSx: Record<string, unknown>;
}

interface GeneralInfoForm {
    shootingDate: Dayjs | null;
    deliveryDate: Dayjs | null;
    localisation: string;
    comments: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function GeneralInfoSection({ fsec, dtriNumber, paperSx, editButtonSx }: GeneralInfoSectionProps) {
    const { showNotification } = useNotification();
    const updateMutation = useUpdateFsec();

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<GeneralInfoForm>({
        shootingDate: fsec.shootingDate ? dayjs(fsec.shootingDate) : null,
        deliveryDate: fsec.deliveryDate ? dayjs(fsec.deliveryDate) : null,
        localisation: fsec.localisation ?? '',
        comments: fsec.comments ?? '',
    });

    const handleEdit = useCallback(() => {
        setForm({
            shootingDate: fsec.shootingDate ? dayjs(fsec.shootingDate) : null,
            deliveryDate: fsec.deliveryDate ? dayjs(fsec.deliveryDate) : null,
            localisation: fsec.localisation ?? '',
            comments: fsec.comments ?? '',
        });
        setIsEditing(true);
    }, [fsec]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
    }, []);

    const handleSave = useCallback(async () => {
        const validation = FsecGeneralFormSchema.safeParse({
            localisation: form.localisation,
            comments: form.comments,
        });
        if (!validation.success) {
            showNotification(validation.error.issues[0].message, 'error');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                versionUuid: fsec.versionUuid,
                data: {
                    name: fsec.name,
                    campaignId: fsec.campaignId,
                    statusId: fsec.statusId,
                    categoryId: fsec.categoryId,
                    rackId: fsec.rackId,
                    preshootingPressure: fsec.preshootingPressure,
                    experienceSrxx: fsec.experienceSrxx,
                    depressurizationFailed: fsec.depressurizationFailed,
                    shootingDate: form.shootingDate?.toDate() ?? null,
                    deliveryDate: form.deliveryDate?.toDate() ?? null,
                    localisation: form.localisation || null,
                    comments: form.comments || null,
                },
            });
            showNotification('Informations générales mises à jour', 'success');
            setIsEditing(false);
        } catch {
            showNotification('Erreur lors de la mise à jour', 'error');
        }
    }, [fsec, form, updateMutation, showNotification]);

    return (
        <Paper variant="outlined" sx={paperSx}>
            {!isEditing && (
                <IconButton size="small" onClick={handleEdit} sx={editButtonSx}>
                    <EditIcon fontSize="small" />
                </IconButton>
            )}

            <Typography variant="h6" mb={2}>
                Informations Générales
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {isEditing ? (
                <Box>
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                N° DTRI
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" color="text.secondary">
                                {dtriNumber ?? '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <DatePicker
                                label="Date du tir"
                                value={form.shootingDate}
                                onChange={(date) => setForm((prev) => ({ ...prev, shootingDate: date }))}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <DatePicker
                                label="Date de livraison"
                                value={form.deliveryDate}
                                onChange={(date) => setForm((prev) => ({ ...prev, deliveryDate: date }))}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField
                                label="Localisation"
                                value={form.localisation}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        localisation: e.target.value,
                                    }))
                                }
                                size="small"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Remarques"
                                value={form.comments}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        comments: e.target.value,
                                    }))
                                }
                                multiline
                                rows={2}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Button size="small" onClick={handleCancel} startIcon={<CloseIcon />} color="inherit">
                            Annuler
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleSave}
                            startIcon={<SaveIcon />}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </Stack>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                            N° DTRI
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {dtriNumber ?? '-'}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Date du tir
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {fsec.shootingDate ? dayjs(fsec.shootingDate).format('DD/MM/YYYY') : '-'}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Date de livraison
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {fsec.deliveryDate ? dayjs(fsec.deliveryDate).format('DD/MM/YYYY') : '-'}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Localisation
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {fsec.localisation || '-'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Remarques
                        </Typography>
                        <Typography variant="body1">{fsec.comments || 'Aucune remarque'}</Typography>
                    </Grid>
                </Grid>
            )}
        </Paper>
    );
}
