/**
 * Gas Filling HP (High Pressure) Step Modal (Step ID: 9)
 * @module features/edit-gas-filling-hp
 *
 * Refactored to use StepModalLayout for reduced duplication.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    TextField,
    Stack,
    Grid2,
    Autocomplete,
    Paper,
    Typography,
    Chip,
    Box,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    GasFillingHpStep,
    useCreateGasFillingHpStep,
    useUpdateGasFillingHpStep,
    useDeleteGasFillingHpStep,
} from '@entities/fsec/steps';
import { useEmbases, getEtalonnageStatus, type Embase } from '@entities/embase';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib';
import { StepModalLayout } from '@features/fsec/shared';

interface GasFillingHpStepModalProps {
    open: boolean;
    onClose: () => void;
    fsecVersionId: string;
    step?: GasFillingHpStep | null;
}

const GasFillingHpStepFormSchema = z.object({
    embaseId: z.string().uuid().nullable().optional(),
    leakRateDtri: z.string().nullable().optional(),
    gasType: z.string().nullable().optional(),
    experimentPressure: z.number().finite().min(0, 'Doit être positif').nullable().optional(),
    operator: z.string().min(1, 'Champ requis'),
    dateOfFulfilment: z.date({ required_error: 'Date requise' }),
    gasContainer: z.number().nullable().optional(),
    observations: z.string().nullable().optional(),
});

type GasFillingHpStepForm = z.infer<typeof GasFillingHpStepFormSchema>;

const DEFAULT_VALUES = {
    embaseId: null,
    leakRateDtri: null,
    gasType: null,
    experimentPressure: null,
    operator: undefined,
    dateOfFulfilment: undefined,
    gasContainer: null,
    observations: null,
};

function StatusChip({ value }: { value: string }) {
    if (!value) return null;
    const lower = value.toLowerCase().trim();
    const isOk = lower === 'ok';
    const isKo = lower === 'ko';
    if (isOk)
        return (
            <Chip label="OK" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
        );
    if (isKo)
        return <Chip label="KO" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    return (
        <Typography variant="caption" fontWeight={500}>
            {value}
        </Typography>
    );
}

function EmbaseInfoRow({ label, value, isStatus }: { label: string; value: React.ReactNode; isStatus?: boolean }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            {isStatus && typeof value === 'string' ? (
                <StatusChip value={value} />
            ) : (
                <Typography variant="caption" fontWeight={500}>
                    {value}
                </Typography>
            )}
        </Box>
    );
}

function EmbaseDetailCard({ embase }: { embase: Embase }) {
    const [voie, setVoie] = useState<'v1' | 'v2'>('v1');
    const etalStatusV1 = getEtalonnageStatus(embase.lastEtalonnageDateV1);
    const etalStatusV2 = getEtalonnageStatus(embase.lastEtalonnageDateV2);
    const etalStatus = voie === 'v1' ? etalStatusV1 : etalStatusV2;
    const observations = voie === 'v1' ? embase.observationsV1 : embase.observationsV2;

    return (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2">{embase.identifier}</Typography>
                <Chip
                    label={etalStatus.label}
                    size="small"
                    sx={{ bgcolor: etalStatus.color, color: '#fff', fontWeight: 500 }}
                />
                {embase.nombreVoies === 2 && (
                    <ToggleButtonGroup
                        value={voie}
                        exclusive
                        onChange={(_, v) => {
                            if (v) setVoie(v);
                        }}
                        size="small"
                        sx={{ ml: 'auto' }}
                    >
                        <ToggleButton value="v1" sx={{ py: 0, px: 1.5, fontSize: '0.75rem' }}>
                            V1
                        </ToggleButton>
                        <ToggleButton value="v2" sx={{ py: 0, px: 1.5, fontSize: '0.75rem' }}>
                            V2
                        </ToggleButton>
                    </ToggleButtonGroup>
                )}
            </Box>
            <Grid2 container spacing={2}>
                <Grid2 size={6}>
                    <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                        Voie {voie === 'v1' ? 'V1' : 'V2'}
                    </Typography>
                    <EmbaseInfoRow label="Soufflet" value={voie === 'v1' ? embase.souffletV1 : embase.souffletV2} />
                    <EmbaseInfoRow label="Capteur" value={voie === 'v1' ? embase.capteurV1 : embase.capteurV2} />
                    <EmbaseInfoRow label="Offset (mV)" value={voie === 'v1' ? embase.offsetV1Mv : embase.offsetV2Mv} />
                    <EmbaseInfoRow
                        label="Sensibilite (mV)"
                        value={voie === 'v1' ? embase.sensibiliteV1Mv : embase.sensibiliteV2Mv}
                    />
                    <EmbaseInfoRow
                        label="Etendue (mbar)"
                        value={voie === 'v1' ? embase.etendueV1Mbar : embase.etendueV2Mbar}
                    />
                    <EmbaseInfoRow
                        label="Pfeiffer (mbar)"
                        value={voie === 'v1' ? embase.capteurCiblePfeifferMbar : embase.capteurCiblePfeifferV2Mbar}
                    />
                    <EmbaseInfoRow
                        label="Etancheite He"
                        value={voie === 'v1' ? embase.testEtancheiteHe : embase.testEtancheiteHeV2}
                        isStatus
                    />
                    <EmbaseInfoRow
                        label="Capteur MRG"
                        value={voie === 'v1' ? embase.testCapteurMrg : embase.testCapteurMrgV2}
                        isStatus
                    />
                </Grid2>
                <Grid2 size={6}>
                    <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                        Mecanique
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
                        <Typography variant="caption" color="text.secondary">
                            Operationnelle
                        </Typography>
                        {embase.operationnelleAimant ? (
                            <Chip
                                label="Aimant"
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    bgcolor: '#1976d2',
                                    color: '#fff',
                                }}
                            />
                        ) : embase.operationnelleBroche ? (
                            <Chip
                                label="Broche"
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    bgcolor: '#7b1fa2',
                                    color: '#fff',
                                }}
                            />
                        ) : (
                            <Typography variant="caption" color="text.secondary">
                                -
                            </Typography>
                        )}
                    </Box>
                    <EmbaseInfoRow label="Localisation" value={embase.localisationActuelle} />
                    <EmbaseInfoRow label="Cote VE" value={embase.coteVe} />
                    <EmbaseInfoRow label="MCC" value={embase.chargementMcc} isStatus />
                    {embase.nombreVoies === 2 && (
                        <EmbaseInfoRow label="Electrovanne" value={embase.electrovanne ? 'Oui' : 'Non'} isStatus />
                    )}
                </Grid2>
            </Grid2>
            {observations && (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Observations:{' '}
                    </Typography>
                    <Typography variant="caption">{observations}</Typography>
                </Box>
            )}
        </Paper>
    );
}

export function GasFillingHpStepModal({ open, onClose, fsecVersionId, step }: GasFillingHpStepModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isEditMode = Boolean(step);

    const createMutation = useCreateGasFillingHpStep();
    const updateMutation = useUpdateGasFillingHpStep();
    const deleteMutation = useDeleteGasFillingHpStep();
    const { showNotification } = useNotification();

    const { data: allEmbases = [] } = useEmbases();
    const hpEmbases = useMemo(() => allEmbases.filter((e: Embase) => e.type === 'hp'), [allEmbases]);

    const { control, handleSubmit, reset, watch } = useForm<GasFillingHpStepForm>({
        mode: 'onBlur',
        resolver: zodResolver(GasFillingHpStepFormSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const selectedEmbaseId = watch('embaseId');
    const selectedEmbase = useMemo(
        () => hpEmbases.find((e: Embase) => e.uuid === selectedEmbaseId) ?? null,
        [hpEmbases, selectedEmbaseId],
    );

    useEffect(() => {
        if (open) {
            reset(
                step
                    ? {
                          embaseId: step.embaseId,
                          leakRateDtri: step.leakRateDtri,
                          gasType: step.gasType,
                          experimentPressure: step.experimentPressure,
                          operator: step.operator ?? undefined,
                          dateOfFulfilment: step.dateOfFulfilment ?? undefined,
                          gasContainer: step.gasContainer,
                          observations: step.observations,
                      }
                    : DEFAULT_VALUES,
            );
            setShowDeleteConfirm(false);
        }
    }, [open, step, reset]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    const onSubmit = useCallback(
        async (data: GasFillingHpStepForm) => {
            if (isPending) return;
            try {
                if (isEditMode && step) {
                    await updateMutation.mutateAsync({ uuid: step.uuid, fsecVersionId, ...data });
                    showNotification('Remplissage HP mis à jour', 'success');
                } else {
                    await createMutation.mutateAsync({ fsecVersionId, ...data });
                    showNotification('Remplissage HP créé', 'success');
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
            showNotification('Remplissage HP supprimé', 'success');
            onClose();
        } catch (error) {
            showNotification(getErrorMessage(error, 'Erreur lors de la suppression'), 'error');
        }
    }, [step, deleteMutation, fsecVersionId, showNotification, onClose]);

    return (
        <StepModalLayout
            open={open}
            onClose={onClose}
            title="Nouveau remplissage gaz HP"
            editTitle="Modifier le remplissage gaz HP"
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

                <Controller
                    name="embaseId"
                    control={control}
                    render={({ field: { onChange } }) => (
                        <Autocomplete
                            options={hpEmbases}
                            value={selectedEmbase}
                            onChange={(_, newValue) => onChange(newValue?.uuid ?? null)}
                            getOptionLabel={(option: Embase) => option.identifier}
                            isOptionEqualToValue={(option, value) => option.uuid === value.uuid}
                            size="small"
                            renderOption={(props, option) => {
                                const etal = getEtalonnageStatus(option.lastEtalonnageDateV1);
                                return (
                                    <li {...props} key={option.uuid}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40 }}>
                                                {option.identifier}
                                            </Typography>
                                            <Chip
                                                label={etal.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: etal.color,
                                                    color: '#fff',
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                            {option.capteurV1 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Capteur: {option.capteurV1}
                                                </Typography>
                                            )}
                                            {option.localisationActuelle && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Loc: {option.localisationActuelle}
                                                </Typography>
                                            )}
                                        </Box>
                                    </li>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Embase"
                                    placeholder="Sélectionner une embase HP"
                                    inputProps={{ ...params.inputProps, 'aria-label': 'Embase' }}
                                />
                            )}
                        />
                    )}
                />

                {selectedEmbase && <EmbaseDetailCard embase={selectedEmbase} />}

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

                <Controller
                    name="experimentPressure"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            label="Pression d'expérimentation (bar)"
                            type="number"
                            size="small"
                            fullWidth
                            inputProps={{ step: 0.01, 'aria-label': "Pression d'expérimentation en bar" }}
                        />
                    )}
                />

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
