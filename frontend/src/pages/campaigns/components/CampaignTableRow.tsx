/**
 * Campaign Table Row Component
 * @module pages/campaigns/components
 */

import { useCallback, memo } from 'react';
import { TableRow, TableCell, Typography, IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { CampaignWithRelations } from '@entities/campaign';
import { DataChip } from '@widgets/data-chip';
import { formatCampaignName } from '../lib/campaigns.helpers';

interface CampaignTableRowProps {
    campaign: CampaignWithRelations;
    onNavigate: (uuid: string) => void;
}

export const CampaignTableRow = memo(function CampaignTableRow({ campaign, onNavigate }: CampaignTableRowProps) {
    const theme = useTheme();

    const handleDoubleClick = useCallback(() => {
        onNavigate(campaign.uuid);
    }, [campaign.uuid, onNavigate]);

    const handleButtonClick = useCallback(() => {
        onNavigate(campaign.uuid);
    }, [campaign.uuid, onNavigate]);

    return (
        <TableRow
            hover
            sx={{
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
            }}
            onDoubleClick={handleDoubleClick}
        >
            <TableCell>
                <DataChip label={campaign.semester} color="#6B7280" />
            </TableCell>
            <TableCell>
                <Typography fontWeight={500}>{formatCampaignName(campaign)}</Typography>
            </TableCell>
            <TableCell>
                {campaign.type ? (
                    <DataChip label={campaign.type.label} color={campaign.type.color} />
                ) : (
                    <Typography color="text.secondary">-</Typography>
                )}
            </TableCell>
            <TableCell>
                {campaign.status ? (
                    <DataChip label={campaign.status.label} color={campaign.status.color} />
                ) : (
                    <Typography color="text.secondary">-</Typography>
                )}
            </TableCell>
            <TableCell align="center">
                <Tooltip title="Voir les détails">
                    <IconButton
                        size="small"
                        onClick={handleButtonClick}
                        aria-label={`Voir les détails de ${campaign.name}`}
                    >
                        <ArrowForwardIcon />
                    </IconButton>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
});
