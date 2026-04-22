/**
 * FSEC Overview Tab
 * @module pages/fsec-details/tabs
 *
 * Inline editing in boxes instead of modal
 * DTRI number from campaign (read-only)
 */

import { useMemo } from 'react';
import { Box, Grid, Stack, alpha, useTheme } from '@mui/material';
import { Fsec } from '@entities/fsec';
import { useCampaign } from '@entities/campaign';
import { CampaignTeamMember } from '@entities/campaign/team';
import { FsecDocument } from '@entities/fsec/document';
import { GeneralInfoSection } from './components/GeneralInfoSection';
import { TeamSection } from './components/TeamSection';
import { DocumentsSection } from './components/DocumentsSection';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OverviewTabProps {
    fsec: Fsec;
    campaignTeam?: CampaignTeamMember[];
    documents?: FsecDocument[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function OverviewTab({ fsec, campaignTeam, documents }: OverviewTabProps) {
    const theme = useTheme();

    // Fetch campaign for DTRI number
    const { data: campaign } = useCampaign(fsec.campaignId ?? '');

    // Styles
    const paperSx = useMemo(
        () => ({
            p: 3,
            borderRadius: 1,
            bgcolor: 'background.paper',
            borderColor: 'divider',
            position: 'relative' as const,
        }),
        [],
    );

    const editButtonSx = useMemo(
        () => ({
            position: 'absolute' as const,
            top: 12,
            right: 12,
            color: 'text.secondary',
            '&:hover': {
                color: 'primary.main',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
        }),
        [theme.palette.primary.main],
    );

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Left Column: General Info & Team */}
                <Grid item xs={12} md={8}>
                    <Stack spacing={3}>
                        <GeneralInfoSection
                            fsec={fsec}
                            dtriNumber={campaign?.dtriNumber}
                            paperSx={paperSx}
                            editButtonSx={editButtonSx}
                        />
                        <TeamSection campaignTeam={campaignTeam} paperSx={paperSx} />
                    </Stack>
                </Grid>

                {/* Right Column: Documents */}
                <Grid item xs={12} md={4}>
                    <DocumentsSection fsecVersionUuid={fsec.versionUuid} documents={documents} paperSx={paperSx} />
                </Grid>
            </Grid>
        </Box>
    );
}
