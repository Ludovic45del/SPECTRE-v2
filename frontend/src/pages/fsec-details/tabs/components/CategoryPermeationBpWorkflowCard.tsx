import { useState, useMemo } from 'react';
import { Box, Button, Chip, Collapse, Divider, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import AirIcon from '@mui/icons-material/Air';
import CompressIcon from '@mui/icons-material/Compress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type {
    AirtightnessStep,
    CommonGasData,
    DepressurizationStep,
    GasFillingBpStep,
    PermeationStep,
    RepressurizationStep,
} from '@entities/fsec/steps';
import { UserChip } from '@entities/user';
import { WorkflowMiniStepper } from './MiniStepper';
import { CommonDataSection, formatDate, formatDateTime } from './gas-workflow-components';

interface CategoryPermeationBpWorkflowCardProps {
    airtightnessSteps?: AirtightnessStep[];
    gasFillingBpSteps?: GasFillingBpStep[];
    permeationStep?: PermeationStep;
    depressurizationStep?: DepressurizationStep;
    repressurizationStep?: RepressurizationStep;
    depressurizationFailed: boolean | null;
    commonData: CommonGasData;
    onEditCommonData: () => void;
    onEditAirtightness: (step?: AirtightnessStep) => void;
    onEditFilling: (step?: GasFillingBpStep) => void;
    onEditPermeation: (step?: PermeationStep) => void;
    onEditDepressurization: (step?: DepressurizationStep) => void;
    onEditRepressurization: (step?: RepressurizationStep) => void;
    onValidationChange: (failed: boolean) => void;
    onDeleteRubrique: (airtightnessStep?: AirtightnessStep, fillingStep?: GasFillingBpStep) => void;
    onAddRubrique: () => void;
    isCreating?: boolean;
    isDeleting?: boolean;
}

const WORKFLOW_STEPS = ['Test étanchéité BP', 'Perméation', 'Dépressurisation', 'Remplissage BP', 'Repressurisation'];

export function CategoryPermeationBpWorkflowCard({
    airtightnessSteps,
    gasFillingBpSteps,
    permeationStep,
    depressurizationStep,
    repressurizationStep,
    depressurizationFailed,
    commonData,
    onEditCommonData,
    onEditAirtightness,
    onEditFilling,
    onEditPermeation,
    onEditDepressurization,
    onEditRepressurization,
    onValidationChange,
    onDeleteRubrique,
    onAddRubrique,
    isCreating = false,
    isDeleting = false,
}: CategoryPermeationBpWorkflowCardProps) {
    const [expanded, setExpanded] = useState<boolean>(() => {
        const allTestsComplete = airtightnessSteps?.every((s) => s.dateOfFulfilment);
        const hasPermeationComplete = Boolean(permeationStep?.startDate);
        const hasDepressurizationComplete = Boolean(depressurizationStep?.dateOfFulfilment);
        const allFillingsComplete = gasFillingBpSteps?.every((s) => s.dateOfFulfilment);
        const hasRepressurizationComplete = Boolean(repressurizationStep?.startDate);

        const allComplete =
            allTestsComplete &&
            hasPermeationComplete &&
            hasDepressurizationComplete &&
            allFillingsComplete &&
            (depressurizationFailed === false || hasRepressurizationComplete);

        return !allComplete;
    });

    // Progress (5 steps)
    const hasAnyTestComplete = airtightnessSteps?.some((s) => s.dateOfFulfilment) || false;
    const hasPermeationComplete = Boolean(permeationStep?.startDate);
    const hasDepressurizationComplete = Boolean(depressurizationStep?.dateOfFulfilment);
    const hasAnyFillingComplete = gasFillingBpSteps?.some((s) => s.dateOfFulfilment) || false;
    const hasRepressurizationComplete = Boolean(repressurizationStep?.startDate);

    let activeStep = 0;
    if (hasAnyTestComplete) {
        activeStep = 1;
        if (hasPermeationComplete) {
            activeStep = 2;
            if (hasDepressurizationComplete) {
                activeStep = 3;
                if (hasAnyFillingComplete) {
                    activeStep = 4;
                    if (depressurizationFailed === true && hasRepressurizationComplete) {
                        activeStep = 5;
                    } else if (depressurizationFailed === false) {
                        activeStep = 5;
                    }
                }
            }
        }
    }

    const isComplete =
        airtightnessSteps &&
        gasFillingBpSteps &&
        airtightnessSteps.length > 0 &&
        gasFillingBpSteps.length > 0 &&
        airtightnessSteps.every((s) => s.dateOfFulfilment) &&
        hasPermeationComplete &&
        hasDepressurizationComplete &&
        gasFillingBpSteps.every((s) => s.dateOfFulfilment) &&
        (depressurizationFailed === false || hasRepressurizationComplete);

    const numRubriques = Math.max(airtightnessSteps?.length || 0, gasFillingBpSteps?.length || 0);
    const rubriqueIndices = useMemo(() => Array.from({ length: numRubriques }, (_, i) => i), [numRubriques]);

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 1,
                bgcolor: 'background.paper',
                borderColor: isComplete ? 'success.main' : 'divider',
                borderWidth: isComplete ? 2 : 1,
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => setExpanded(!expanded)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpanded(!expanded);
                    }
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
                    <ScienceIcon color="secondary" />
                    <Typography variant="h6" fontWeight={600}>
                        Workflow Perméation + BP
                    </Typography>
                    {isComplete && <Chip label="Complet" color="success" />}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <WorkflowMiniStepper activeStep={activeStep} steps={WORKFLOW_STEPS} />
                    <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                </Stack>
            </Box>

            {/* Content */}
            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <CommonDataSection commonData={commonData} onEdit={onEditCommonData} />

                        <Divider />

                        {/* 1. Test d'étanchéité BP (multi-rubriques) */}
                        <Box>
                            <Typography variant="h6" fontWeight={600} mb={2}>
                                Test d&apos;étanchéité BP
                            </Typography>
                            {numRubriques === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    Aucune rubrique — ajoutez-en une ci-dessous
                                </Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {rubriqueIndices.map((index) => {
                                        const step = airtightnessSteps?.[index];
                                        const showNumber = numRubriques > 1;

                                        return (
                                            <Box key={`test-${index}`}>
                                                {showNumber && (
                                                    <Stack
                                                        direction="row"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                        mb={1}
                                                    >
                                                        <Typography variant="subtitle2">
                                                            Rubrique n°{index + 1}
                                                        </Typography>
                                                        {numRubriques > 1 && (
                                                            <Button
                                                                size="small"
                                                                color="error"
                                                                startIcon={<DeleteIcon fontSize="small" />}
                                                                onClick={() =>
                                                                    onDeleteRubrique(
                                                                        airtightnessSteps?.[index],
                                                                        gasFillingBpSteps?.[index],
                                                                    )
                                                                }
                                                                disabled={isDeleting}
                                                            >
                                                                {isDeleting ? 'Suppression...' : 'Supprimer'}
                                                            </Button>
                                                        )}
                                                    </Stack>
                                                )}
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="flex-start"
                                                    mb={1}
                                                >
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <ScienceIcon
                                                            fontSize="small"
                                                            color={step?.dateOfFulfilment ? 'success' : 'primary'}
                                                        />
                                                        {step?.dateOfFulfilment && (
                                                            <Chip label="Fait" color="success" />
                                                        )}
                                                    </Stack>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditAirtightness(step);
                                                        }}
                                                        color="primary"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                                {step ? (
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Date
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {formatDate(step.dateOfFulfilment)}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Opérateur
                                                            </Typography>
                                                            <UserChip
                                                                userUuid={step.operatorUserUuid}
                                                                fallbackText={step.operator}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Pas encore de donnée enregistrée
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>

                        <Divider />

                        {/* 2. Perméation */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <ScienceIcon
                                        fontSize="small"
                                        color={permeationStep?.startDate ? 'success' : 'secondary'}
                                    />
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Perméation
                                    </Typography>
                                    {permeationStep?.startDate && <Chip label="Fait" color="success" />}
                                </Stack>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditPermeation(permeationStep);
                                    }}
                                    color="primary"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Stack>

                            {permeationStep ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                            Date début
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {formatDateTime(permeationStep.startDate)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                            Date fin estimée
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {formatDateTime(permeationStep.estimatedEndDate)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                            Opérateur
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {permeationStep.operator ?? '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                            Type de gaz
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {permeationStep.gasType ?? '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                            Pression cible (bar)
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {permeationStep.targetPressure ?? '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                            Pression capteur (bar)
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {permeationStep.sensorPressure ?? '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="caption" color="text.secondary">
                                            Pression tir calculée (bar)
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {permeationStep.computedShotPressure ?? '-'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Pas encore de donnée enregistrée
                                </Typography>
                            )}
                        </Box>

                        <Divider />

                        {/* 3. Dépressurisation */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <CompressIcon
                                        fontSize="small"
                                        color={depressurizationStep?.dateOfFulfilment ? 'success' : 'warning'}
                                    />
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Dépressurisation
                                    </Typography>
                                    {depressurizationStep?.dateOfFulfilment && <Chip label="Fait" color="success" />}
                                </Stack>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditDepressurization(depressurizationStep);
                                    }}
                                    color="primary"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Stack>

                            {depressurizationStep ? (
                                <>
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Date
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatDate(depressurizationStep.dateOfFulfilment)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Opérateur
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {depressurizationStep.operator ?? '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Manomètre (bar)
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {depressurizationStep.pressureGauge ?? '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Pression enceinte (bar)
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {depressurizationStep.enclosurePressureMeasured ?? '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Heure début
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatDateTime(depressurizationStep.startTime)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Heure fin
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatDateTime(depressurizationStep.endTime)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Temps avant tir (min)
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {depressurizationStep.depressurizationTimeBeforeFiring ?? '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Pression avant tir (bar)
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {depressurizationStep.computedPressureBeforeFiring ?? '-'}
                                            </Typography>
                                        </Grid>
                                        {depressurizationStep.observations && (
                                            <Grid item xs={12}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Observations
                                                </Typography>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {depressurizationStep.observations}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>

                                    {/* Validation inline */}
                                    <Divider sx={{ my: 2 }} />
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                            Validation de la dépressurisation
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                variant={depressurizationFailed === false ? 'contained' : 'outlined'}
                                                color="success"
                                                size="small"
                                                startIcon={<CheckCircleIcon fontSize="small" />}
                                                onClick={() => onValidationChange(false)}
                                            >
                                                Valider
                                            </Button>
                                            <Button
                                                variant={depressurizationFailed === true ? 'contained' : 'outlined'}
                                                color="error"
                                                size="small"
                                                startIcon={<ErrorIcon fontSize="small" />}
                                                onClick={() => onValidationChange(true)}
                                            >
                                                Non validée
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Pas encore de donnée enregistrée
                                </Typography>
                            )}
                        </Box>

                        <Divider />

                        {/* 4. Remplissage BP (multi-rubriques) */}
                        <Box>
                            <Typography variant="h6" fontWeight={600} mb={2}>
                                Remplissage BP
                            </Typography>
                            {numRubriques === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    Aucune rubrique — ajoutez-en une ci-dessous
                                </Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {rubriqueIndices.map((index) => {
                                        const step = gasFillingBpSteps?.[index];
                                        const showNumber = numRubriques > 1;

                                        return (
                                            <Box key={`filling-${index}`}>
                                                {showNumber && (
                                                    <Typography variant="subtitle2" mb={1}>
                                                        Rubrique n°{index + 1}
                                                    </Typography>
                                                )}
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="flex-start"
                                                    mb={1}
                                                >
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <AirIcon
                                                            fontSize="small"
                                                            color={step?.dateOfFulfilment ? 'success' : 'action'}
                                                        />
                                                        {step?.dateOfFulfilment && (
                                                            <Chip label="Fait" color="success" />
                                                        )}
                                                    </Stack>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditFilling(step);
                                                        }}
                                                        color="primary"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                                {step ? (
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Date
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {formatDate(step.dateOfFulfilment)}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Opérateur
                                                            </Typography>
                                                            <UserChip
                                                                userUuid={step.operatorUserUuid}
                                                                fallbackText={step.operator}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Base gaz
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {step.gasBase ?? '-'}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Bouteille
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {step.gasContainer ?? '-'}
                                                            </Typography>
                                                        </Grid>
                                                        {step.observations && (
                                                            <Grid item xs={12}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Observations
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {step.observations}
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
                                        );
                                    })}
                                </Stack>
                            )}

                            <Box sx={{ pt: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={onAddRubrique}
                                    disabled={isCreating}
                                >
                                    {isCreating ? 'Création...' : `Ajouter une rubrique BP (n°${numRubriques + 1})`}
                                </Button>
                            </Box>
                        </Box>

                        <Divider />

                        {/* 5. Repressurisation (conditional) */}
                        {depressurizationFailed === true && (
                            <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CompressIcon
                                            fontSize="small"
                                            color={repressurizationStep?.startDate ? 'success' : 'action'}
                                        />
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Repressurisation
                                        </Typography>
                                        {repressurizationStep?.startDate && <Chip label="Fait" color="success" />}
                                    </Stack>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditRepressurization(repressurizationStep);
                                        }}
                                        color="primary"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Stack>

                                {repressurizationStep ? (
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Date début
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatDateTime(repressurizationStep.startDate)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Date fin estimée
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatDateTime(repressurizationStep.estimatedEndDate)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Opérateur
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {repressurizationStep.operator ?? '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Type de gaz
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {repressurizationStep.gasType ?? '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Pression capteur (bar)
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {repressurizationStep.sensorPressure ?? '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Pression calculée (bar)
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {repressurizationStep.computedPressure ?? '-'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Pas encore de donnée enregistrée
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Collapse>
        </Paper>
    );
}
