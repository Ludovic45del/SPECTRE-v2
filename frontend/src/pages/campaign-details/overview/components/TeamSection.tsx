/**
 * Team Section - MOE, RCE, IEC members
 * @module pages/campaign-details/overview/components
 */

import { memo } from 'react';
import { Box, Grid, Paper, Typography, TextField, IconButton } from '@mui/material';
import { CampaignWithRelations } from '@entities/campaign';
import { getMemberNameByRole } from '@entities/campaign/team';
import EditIcon from '@mui/icons-material/Edit';
import { useCampaignTeamForm } from '../hooks';
import { SectionHeader } from './SectionHeader';
import { FormActions } from './FormActions';
import { EDIT_BUTTON_SX, PAPER_BASE_SX } from './styles';

export interface TeamSectionProps {
    campaign: CampaignWithRelations;
}

export const TeamSection = memo(function TeamSection({ campaign }: TeamSectionProps) {
    const { form, isEditing, isSaving, teamMembers, setField, startEditing, cancelEditing, save } =
        useCampaignTeamForm(campaign);

    return (
        <Paper variant="outlined" sx={PAPER_BASE_SX} role="region" aria-label="Équipe de la campagne">
            {!isEditing && (
                <IconButton size="small" onClick={startEditing} sx={EDIT_BUTTON_SX} aria-label="Modifier l'équipe">
                    <EditIcon fontSize="small" />
                </IconButton>
            )}

            <SectionHeader title="Équipe" />

            {isEditing ? (
                <Box
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        save();
                    }}
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="MOE"
                                value={form.moe}
                                onChange={(e) => setField('moe', e.target.value)}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="RCE"
                                value={form.rce}
                                onChange={(e) => setField('rce', e.target.value)}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="IEC"
                                value={form.iec}
                                onChange={(e) => setField('iec', e.target.value)}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <FormActions onCancel={cancelEditing} isSaving={isSaving} />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                            MOE
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {getMemberNameByRole(teamMembers, 'MOE')}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                            RCE
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {getMemberNameByRole(teamMembers, 'RCE')}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                            IEC
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {getMemberNameByRole(teamMembers, 'IEC')}
                        </Typography>
                    </Grid>
                </Grid>
            )}
        </Paper>
    );
});
