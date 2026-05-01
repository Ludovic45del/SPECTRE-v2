/**
 * Phase Ouvert Section - FA Details
 * @module pages/fa-details/sections
 *
 * Displays Phase 1 (Ouvert) with view and edit modes
 */

import { memo, useCallback, useState } from 'react';
import { Box, Button, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Fa } from '@entities/fa';
import { ValidatePhaseModal } from '@features/fa';

import { FaSectionHeader, PAPER_BASE_SX, EDIT_BUTTON_SX } from '../components';
import { useFaPhaseOuvertForm } from '../hooks';
import { PhaseOuvertEditMode } from './PhaseOuvertEditMode';
import { PhaseOuvertViewMode } from './PhaseOuvertViewMode';

// ============================================================================
// Types
// ============================================================================

interface PhaseOuvertSectionProps {
    fa: Fa;
}

// ============================================================================
// Component
// ============================================================================

export const PhaseOuvertSection = memo(function PhaseOuvertSection({ fa }: PhaseOuvertSectionProps) {
    const { form, setForm, isEditing, isSaving, startEditing, cancelEditing, save } = useFaPhaseOuvertForm(fa);
    const [validateOpen, setValidateOpen] = useState(false);

    const handleOpenValidate = useCallback(() => setValidateOpen(true), []);
    const handleCloseValidate = useCallback(() => setValidateOpen(false), []);

    // statusId 0 = Ouvert (en attente de validation IEC)
    const canValidate = fa.statusId === 0 && !fa.iecValidationOpen;

    return (
        <Paper
            variant="outlined"
            sx={PAPER_BASE_SX}
            component="section"
            aria-label="Phase 1 - Ouvert"
            aria-busy={isSaving}
        >
            {!isEditing && (
                <IconButton
                    onClick={startEditing}
                    aria-label="Modifier les informations de la Phase 1 Ouvert"
                    sx={EDIT_BUTTON_SX}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            )}

            <FaSectionHeader label="Phase 1 - Ouvert" chipColor="warning" />

            {isEditing ? (
                <PhaseOuvertEditMode
                    form={form}
                    setForm={setForm}
                    onCancel={cancelEditing}
                    onSave={save}
                    isPending={isSaving}
                />
            ) : (
                <>
                    <PhaseOuvertViewMode fa={fa} />
                    {canValidate && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<VerifiedIcon />}
                                onClick={handleOpenValidate}
                                aria-label="Valider la phase Ouvert"
                            >
                                Valider la phase Ouvert (IEC)
                            </Button>
                        </Box>
                    )}
                </>
            )}

            <ValidatePhaseModal open={validateOpen} onClose={handleCloseValidate} fa={fa} phase="open" />
        </Paper>
    );
});
