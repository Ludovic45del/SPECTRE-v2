import { useState, useMemo } from 'react';
import { Box, Button, Chip, Collapse, Divider, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import dayjs from 'dayjs';
import type { AirtightnessStep, CommonGasData, GasFillingBpStep, GasFillingHpStep } from '@entities/fsec/steps';
import { WorkflowMiniStepper } from './MiniStepper';
import { CommonDataSection, BpRubriqueItem, EmptyBpState } from './gas-workflow-components';

interface CategoryBpHpWorkflowCardProps {
    airtightnessSteps?: AirtightnessStep[];
    gasFillingBpSteps?: GasFillingBpStep[];
    gasFillingHpSteps?: GasFillingHpStep[];
    commonData: CommonGasData;
    onEditCommonData: () => void;
    onEditAirtightness: (step?: AirtightnessStep) => void;
    onEditFillingBp: (step?: GasFillingBpStep) => void;
    onEditFillingHp: (step?: GasFillingHpStep) => void;
    onDeleteRubrique: (airtightnessStep?: AirtightnessStep, fillingStep?: GasFillingBpStep) => void;
    onAddRubrique: () => void;
    onAddHpRubrique: () => void;
    isCreating?: boolean;
    isCreatingHp?: boolean;
    isDeleting?: boolean;
}

// ─── HP Step Sub-Card (collapsible, aligned with AssemblyStepCard pattern) ───

function HpStepSubCard({ step, index, onEdit }: { step: GasFillingHpStep; index: number; onEdit: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const isComplete = Boolean(step.dateOfFulfilment);

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
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" fontWeight={600}>
                        Remplissage HP n°{index + 1}
                    </Typography>
                    {isComplete && <Chip label="Complet" size="small" color="success" variant="outlined" />}
                </Stack>
                <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
            </Box>

            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ p: 3, position: 'relative' }}>
                    <IconButton
                        size="small"
                        onClick={onEdit}
                        color="primary"
                        sx={{ position: 'absolute', top: 12, right: 12 }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Date
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {step.dateOfFulfilment ? dayjs(step.dateOfFulfilment).format('DD/MM/YYYY') : '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Opérateur
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {step.operator ?? '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Type de gaz
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {step.gasType ?? '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Pression (bar)
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {step.experimentPressure ?? '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Base gaz
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {step.gasBase ?? '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Bouteille
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {step.gasContainer ?? '-'}
                            </Typography>
                        </Grid>
                        {step.embaseIdentifier && (
                            <Grid item xs={6} md={3}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Embase
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {step.embaseIdentifier}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                    {step.observations && (
                        <Box sx={{ mt: 1.5 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Observations
                            </Typography>
                            <Typography variant="body1">{step.observations}</Typography>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
}

const WORKFLOW_STEPS = ['Test étanchéité BP', 'Remplissage BP', 'Remplissage HP'];

export function CategoryBpHpWorkflowCard({
    airtightnessSteps,
    gasFillingBpSteps,
    gasFillingHpSteps,
    commonData,
    onEditCommonData,
    onEditAirtightness,
    onEditFillingBp,
    onEditFillingHp,
    onDeleteRubrique,
    onAddRubrique,
    onAddHpRubrique,
    isCreating = false,
    isCreatingHp = false,
    isDeleting = false,
}: CategoryBpHpWorkflowCardProps) {
    const [expanded, setExpanded] = useState<boolean>(() => {
        const allTestsComplete = airtightnessSteps?.every((s) => s.dateOfFulfilment);
        const allFillingsComplete = gasFillingBpSteps?.every((s) => s.dateOfFulfilment);
        const allHpComplete = gasFillingHpSteps?.length ? gasFillingHpSteps.every((s) => s.dateOfFulfilment) : false;
        return !(allTestsComplete && allFillingsComplete && allHpComplete);
    });

    // Progress
    const hasAnyTestComplete = airtightnessSteps?.some((s) => s.dateOfFulfilment) || false;
    const hasAnyFillingBpComplete = gasFillingBpSteps?.some((s) => s.dateOfFulfilment) || false;
    const hasAllHpComplete = gasFillingHpSteps?.length ? gasFillingHpSteps.every((s) => s.dateOfFulfilment) : false;

    let activeStep = 0;
    if (hasAnyTestComplete) {
        activeStep = 1;
        if (hasAnyFillingBpComplete) {
            activeStep = 2;
            if (hasAllHpComplete) {
                activeStep = 3;
            }
        }
    }

    const isComplete =
        airtightnessSteps &&
        gasFillingBpSteps &&
        airtightnessSteps.length > 0 &&
        gasFillingBpSteps.length > 0 &&
        airtightnessSteps.every((s) => s.dateOfFulfilment) &&
        gasFillingBpSteps.every((s) => s.dateOfFulfilment) &&
        hasAllHpComplete;

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
                    <ScienceIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Workflow Gaz BP + HP
                    </Typography>
                    {isComplete && <Chip label="Complet" size="small" color="success" variant="outlined" />}
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
                        <CommonDataSection commonData={commonData} onEdit={onEditCommonData} labelSuffix="(BP)" />

                        <Divider />

                        {numRubriques === 0 ? (
                            <EmptyBpState onAdd={onAddRubrique} isCreating={isCreating} />
                        ) : (
                            <Stack spacing={3}>
                                {rubriqueIndices.map((index) => (
                                    <Box key={`rubrique-${index}`}>
                                        <BpRubriqueItem
                                            index={index}
                                            showNumber={numRubriques > 1}
                                            airtightnessStep={airtightnessSteps?.[index]}
                                            fillingStep={gasFillingBpSteps?.[index]}
                                            onEditAirtightness={onEditAirtightness}
                                            onEditFilling={onEditFillingBp}
                                            onDelete={
                                                numRubriques > 1
                                                    ? () =>
                                                          onDeleteRubrique(
                                                              airtightnessSteps?.[index],
                                                              gasFillingBpSteps?.[index],
                                                          )
                                                    : undefined
                                            }
                                            isDeleting={isDeleting}
                                        />
                                        {index < numRubriques - 1 && <Divider sx={{ my: 3 }} />}
                                    </Box>
                                ))}

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
                            </Stack>
                        )}

                        <Divider />

                        {/* Section Remplissage HP (collapsible sub-cards) */}
                        <Stack spacing={2}>
                            {gasFillingHpSteps?.map((hpStep, index) => (
                                <HpStepSubCard
                                    key={hpStep.uuid}
                                    step={hpStep}
                                    index={index}
                                    onEdit={() => onEditFillingHp(hpStep)}
                                />
                            ))}

                            <Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={onAddHpRubrique}
                                    disabled={isCreatingHp}
                                >
                                    {isCreatingHp ? 'Création...' : 'Ajouter un remplissage HP'}
                                </Button>
                            </Box>
                        </Stack>
                    </Stack>
                </Box>
            </Collapse>
        </Paper>
    );
}
