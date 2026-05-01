/**
 * Phase En Cours Section - FA Details
 * @module pages/fa-details/sections
 *
 * Displays Phase 2 (En cours) with view and edit modes
 */

import { memo, useCallback, useState } from 'react';
import { Box, Button, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Fa, getTypeInfo, getCriticalityInfo } from '@entities/fa';
import { ValidatePhaseModal } from '@features/fa';

import { FaSectionHeader, PAPER_BASE_SX, EDIT_BUTTON_SX } from '../components';
import { useFaPhaseEnCoursForm } from '../hooks';
import { PhaseEnCoursEditMode } from './PhaseEnCoursEditMode';
import { PhaseEnCoursViewMode } from './PhaseEnCoursViewMode';

// ============================================================================
// Types
// ============================================================================

interface PhaseEnCoursSectionProps {
    fa: Fa;
}

// ============================================================================
// Component
// ============================================================================

export const PhaseEnCoursSection = memo(function PhaseEnCoursSection({ fa }: PhaseEnCoursSectionProps) {
    const { form, setForm, isEditing, isSaving, startEditing, cancelEditing, save } = useFaPhaseEnCoursForm(fa);
    const [validateOpen, setValidateOpen] = useState(false);

    const typeInfo = getTypeInfo(fa.typeId ?? null);
    const criticalityInfo = getCriticalityInfo(fa.criticalityId ?? null);

    const handleOpenValidate = useCallback(() => setValidateOpen(true), []);
    const handleCloseValidate = useCallback(() => setValidateOpen(false), []);

    // statusId 1 = En cours (en attente de validation IEC pour passer à Clos)
    const canValidate = fa.statusId === 1 && !fa.iecValidationProgress;

    return (
        <Paper
            variant="outlined"
            sx={PAPER_BASE_SX}
            component="section"
            aria-label="Phase 2 - En cours / Clos"
            aria-busy={isSaving}
        >
            {!isEditing && (
                <IconButton
                    onClick={startEditing}
                    aria-label="Modifier les informations de la Phase 2 En cours"
                    sx={EDIT_BUTTON_SX}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            )}

            <FaSectionHeader label="Phase 2 - En cours" chipColor="info" />

            {isEditing ? (
                <PhaseEnCoursEditMode
                    form={form}
                    setForm={setForm}
                    onCancel={cancelEditing}
                    onSave={save}
                    isPending={isSaving}
                />
            ) : (
                <>
                    <PhaseEnCoursViewMode fa={fa} typeInfo={typeInfo} criticalityInfo={criticalityInfo} />
                    {canValidate && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<VerifiedIcon />}
                                onClick={handleOpenValidate}
                                aria-label="Valider la phase En cours"
                            >
                                Valider la phase En cours (IEC)
                            </Button>
                        </Box>
                    )}
                </>
            )}

            <ValidatePhaseModal open={validateOpen} onClose={handleCloseValidate} fa={fa} phase="progress" />
        </Paper>
    );
});
