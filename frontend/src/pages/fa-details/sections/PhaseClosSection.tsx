/**
 * Phase Clos Section - FA Details
 * @module pages/fa-details/sections
 *
 * Display of Phase 3 (Clos) closure information with close action
 */

import { memo, useState } from 'react';
import { Box, IconButton, Paper, Typography, Stack, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Fa } from '@entities/fa';
import { UserChip } from '@entities/user';
import { formatDateShort } from '@shared/lib';
import { FaSectionHeader, PAPER_BASE_SX, EDIT_BUTTON_SX } from '../components';
import { ClosePhaseModal } from './ClosePhaseModal';

// ============================================================================
// Types
// ============================================================================

interface PhaseClosSectionProps {
    fa: Fa;
}

// ============================================================================
// Component
// ============================================================================

export const PhaseClosSection = memo(function PhaseClosSection({ fa }: PhaseClosSectionProps) {
    const isClosed = fa.statusId === 2;
    const canClose = fa.statusId === 1;
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <Paper variant="outlined" sx={PAPER_BASE_SX} component="section" aria-label="Phase 3 - Clos">
            {(canClose || isClosed) && (
                <IconButton onClick={() => setModalOpen(true)} aria-label="Clôturer la FA" sx={EDIT_BUTTON_SX}>
                    <EditIcon fontSize="small" />
                </IconButton>
            )}

            <FaSectionHeader label="Phase 3 - Clos" chipColor="#66BB6A" />

            {isClosed ? (
                <Stack spacing={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Date de clôture
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {formatDateShort(fa.closureDate)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Validé par
                            </Typography>
                            <UserChip userUuid={fa.closureValidatorUserUuid} fallbackText={fa.closureValidatorName} />
                        </Grid>
                    </Grid>

                    {fa.closureValidation && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Validation de clôture
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mt: 0.5 }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {fa.closureValidation}
                                </Typography>
                            </Paper>
                        </Box>
                    )}
                </Stack>
            ) : (
                <Typography color="text.disabled" sx={{ py: 2, textAlign: 'center' }}>
                    Phase non encore atteinte
                </Typography>
            )}

            <ClosePhaseModal open={modalOpen} onClose={() => setModalOpen(false)} fa={fa} />
        </Paper>
    );
});
