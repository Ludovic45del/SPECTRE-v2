/**
 * FSEC Metrology Tab
 * @module pages/fsec-details/tabs
 *
 * Style: Aligned with Campaign style
 */

import { useState } from 'react';
import { Box, Button, Divider, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import { MetrologyStep, getMetrologyMachine, getFsecRack } from '@entities/fsec/steps';
import StraightenIcon from '@mui/icons-material/Straighten';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import { MetrologyStepModal } from '@features/fsec/edit-metrology';

interface MetrologyTabProps {
    fsecVersionId: string;
    metrologySteps?: MetrologyStep[];
}

function MetrologyStepCard({ step, index, onEdit }: { step: MetrologyStep; index: number; onEdit: () => void }) {
    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1, bgcolor: 'background.paper', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <StraightenIcon color="primary" />
                    <Typography variant="h6">Métrologie {index + 1}</Typography>
                </Stack>
                <IconButton size="small" onClick={onEdit} color="primary">
                    <EditIcon />
                </IconButton>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {step.date ? dayjs(step.date).format('DD/MM/YYYY') : '-'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Métrologue
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {step.metrologistName || '-'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Conteneur / Rack
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {getFsecRack(step.rackId)?.label ?? '-'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Machine
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {getMetrologyMachine(step.machineId)?.label ?? '-'}
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Commentaires
                    </Typography>
                    <Typography variant="body1">{step.comments || 'Aucun commentaire'}</Typography>
                </Grid>
            </Grid>
        </Paper>
    );
}

function EmptyMetrologyCard({ onAdd }: { onAdd: () => void }) {
    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1, bgcolor: 'background.paper', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <StraightenIcon color="primary" />
                    <Typography variant="h6">Métrologie</Typography>
                </Stack>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onAdd}>
                    Ajouter
                </Button>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" color="text.secondary">
                Aucune étape de métrologie enregistrée
            </Typography>
        </Paper>
    );
}

export function MetrologyTab({ fsecVersionId, metrologySteps }: MetrologyTabProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<MetrologyStep | null>(null);

    const handleAdd = () => {
        setSelectedStep(null);
        setModalOpen(true);
    };

    const handleEdit = (step: MetrologyStep) => {
        setSelectedStep(step);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedStep(null);
    };

    return (
        <Box>
            <Stack spacing={3}>
                {metrologySteps?.length ? (
                    <>
                        {metrologySteps.map((step, index) => (
                            <MetrologyStepCard
                                key={step.uuid}
                                step={step}
                                index={index}
                                onEdit={() => handleEdit(step)}
                            />
                        ))}
                        <Box>
                            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
                                Ajouter une métrologie
                            </Button>
                        </Box>
                    </>
                ) : (
                    <EmptyMetrologyCard onAdd={handleAdd} />
                )}
            </Stack>

            <MetrologyStepModal
                open={modalOpen}
                onClose={handleCloseModal}
                fsecVersionId={fsecVersionId}
                step={selectedStep}
            />
        </Box>
    );
}
