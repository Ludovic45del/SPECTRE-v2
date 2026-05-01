/**
 * Shared gas workflow sub-components
 * @module pages/fsec-details/tabs/components
 *
 * Reusable building blocks for the unified category workflow cards:
 * - CommonDataSection: inline display of shared gas data (Type gaz, Taux DTRI, Duree, Pression)
 * - BpRubriqueItem: single BP rubrique with Test etancheite + Remplissage sections
 * - formatDate / formatDateTime: shared date formatters
 */

import { Box, Button, Chip, Divider, Grid, IconButton, Stack, Typography } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import type { AirtightnessStep, CommonGasData, GasFillingBpStep } from '@entities/fsec/steps';
import { UserChip } from '@entities/user';

// ─── Date formatters ────────────────────────────────────────────────────

export function formatDate(date: Date | null | undefined): string {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
}

export function formatDateTime(date: Date | null | undefined): string {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY HH:mm');
}

// ─── Common Data Section ────────────────────────────────────────────────

interface CommonDataSectionProps {
    commonData: CommonGasData;
    onEdit: () => void;
    /** Label suffix, e.g. "(BP)" for BP+HP category */
    labelSuffix?: string;
}

/**
 * Displays the 4 shared gas data fields in a grey box with edit button.
 * Used at the top of BP, BP+HP, and Permeation+BP workflow cards.
 */
export function CommonDataSection({ commonData, onEdit, labelSuffix }: CommonDataSectionProps) {
    return (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                    Données communes{labelSuffix ? ` ${labelSuffix}` : ''}
                </Typography>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    color="primary"
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            </Stack>

            <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                        Type de gaz
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                        {commonData.gasType || '-'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                        Taux DTRI
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                        {commonData.leakRateDtri || '-'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                        Durée test (min)
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                        {commonData.testDuration ?? '-'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                        Pression (bar)
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                        {commonData.experimentPressure ?? '-'}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
}

// ─── BP Rubrique Item ───────────────────────────────────────────────────

interface BpRubriqueItemProps {
    index: number;
    showNumber: boolean;
    airtightnessStep?: AirtightnessStep;
    fillingStep?: GasFillingBpStep;
    onEditAirtightness: (step?: AirtightnessStep) => void;
    onEditFilling: (step?: GasFillingBpStep) => void;
    onDelete?: () => void;
    isDeleting?: boolean;
}

/**
 * Displays a single BP rubrique with Test etancheite + Remplissage sections.
 * Used in BP, BP+HP, and Permeation+BP workflow cards.
 */
export function BpRubriqueItem({
    index,
    showNumber,
    airtightnessStep,
    fillingStep,
    onEditAirtightness,
    onEditFilling,
    onDelete,
    isDeleting = false,
}: BpRubriqueItemProps) {
    return (
        <Box>
            {/* Rubrique Header */}
            {showNumber && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                        Rubrique n°{index + 1}
                    </Typography>
                    {onDelete && (
                        <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon fontSize="small" />}
                            onClick={onDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </Button>
                    )}
                </Stack>
            )}

            {/* Section 1: Test d'étanchéité */}
            <Box mb={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Test d&apos;étanchéité
                        </Typography>
                        {airtightnessStep?.dateOfFulfilment && <Chip label="Fait" color="success" />}
                    </Stack>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditAirtightness(airtightnessStep);
                        }}
                        color="primary"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Stack>

                {airtightnessStep ? (
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Date
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                {formatDate(airtightnessStep.dateOfFulfilment)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Opérateur
                            </Typography>
                            <Box>
                                <UserChip
                                    userUuid={airtightnessStep.operatorUserUuid}
                                    fallbackText={airtightnessStep.operator}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Embase
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                {airtightnessStep.embaseIdentifier ?? '-'}
                            </Typography>
                        </Grid>
                    </Grid>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Pas encore de donnée enregistrée
                    </Typography>
                )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Section 2: Remplissage BP */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Remplissage
                        </Typography>
                        {fillingStep?.dateOfFulfilment && <Chip label="Fait" color="success" />}
                    </Stack>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditFilling(fillingStep);
                        }}
                        color="primary"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Stack>

                {fillingStep ? (
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Date
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                {formatDate(fillingStep.dateOfFulfilment)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Opérateur
                            </Typography>
                            <Box>
                                <UserChip userUuid={fillingStep.operatorUserUuid} fallbackText={fillingStep.operator} />
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Base gaz
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                {fillingStep.gasBase ?? '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Bouteille
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                {fillingStep.gasContainer ?? '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                                Embase
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                {fillingStep.embaseIdentifier ?? '-'}
                            </Typography>
                        </Grid>
                        {fillingStep.observations && (
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">
                                    Observations
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    {fillingStep.observations}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Pas encore de donnée enregistrée
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

// ─── Empty BP State ─────────────────────────────────────────────────────

interface EmptyBpStateProps {
    onAdd: () => void;
    isCreating?: boolean;
}

/**
 * Empty state shown when there are no BP rubriques yet.
 */
export function EmptyBpState({ onAdd, isCreating = false }: EmptyBpStateProps) {
    return (
        <Box sx={{ py: 3, textAlign: 'center' }}>
            <ScienceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" gutterBottom>
                Aucune rubrique Gaz BP
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ajoutez une rubrique pour commencer
            </Typography>
            <Button variant="contained" size="small" onClick={onAdd} disabled={isCreating}>
                {isCreating ? 'Création...' : 'Ajouter la première rubrique'}
            </Button>
        </Box>
    );
}
