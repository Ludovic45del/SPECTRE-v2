/**
 * HP Gas Workflow Card Component
 * @module pages/fsec-details/tabs/components
 *
 * Individual collapsible cards for HP gas filling steps (Category 2 - Gaz HP only).
 * Design aligned with AssemblyTab / ControleTab pattern.
 */

import { useState } from 'react';
import { Box, Button, Chip, Collapse, Divider, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import dayjs from 'dayjs';
import type { GasFillingHpStep } from '@entities/fsec/steps';

interface CategoryHpWorkflowCardProps {
    steps?: GasFillingHpStep[];
    onEdit: (step?: GasFillingHpStep) => void;
    onAdd: () => void;
    isCreating?: boolean;
}

function GasFillingHpStepCard({ step, index, onEdit }: { step: GasFillingHpStep; index: number; onEdit: () => void }) {
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
            {/* Header */}
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

function EmptyHpCard({ onAdd }: { onAdd: () => void }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 4,
                borderRadius: 1,
                bgcolor: 'background.paper',
                borderColor: 'divider',
                textAlign: 'center',
            }}
        >
            <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
                Ajouter un remplissage HP
            </Button>
        </Paper>
    );
}

export function CategoryHpWorkflowCard({ steps, onEdit, onAdd, isCreating = false }: CategoryHpWorkflowCardProps) {
    return (
        <Stack spacing={3}>
            {steps?.length ? (
                <>
                    {steps.map((step, index) => (
                        <GasFillingHpStepCard key={step.uuid} step={step} index={index} onEdit={() => onEdit(step)} />
                    ))}
                    <Box>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd} disabled={isCreating}>
                            {isCreating ? 'Création...' : `Ajouter un remplissage HP`}
                        </Button>
                    </Box>
                </>
            ) : (
                <EmptyHpCard onAdd={onAdd} />
            )}
        </Stack>
    );
}
