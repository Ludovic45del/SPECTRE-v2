/**
 * FSEC Table Row Component
 * @module pages/fsecs/components/FsecTableRow
 */

import { memo, useCallback } from 'react';
import { TableRow, TableCell, Typography, IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getStatusInfo, getCategoryInfo } from '@entities/fsec';
import { DataChip } from '@widgets/data-chip';
import type { FsecWithCampaign } from '../fsec-list-utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FsecTableRowProps {
    fsec: FsecWithCampaign;
    onNavigate: (versionUuid: string) => void;
    onNavigateCampaign: (e: React.MouseEvent, campaignId: string | null) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const FsecTableRow = memo(function FsecTableRow({ fsec, onNavigate, onNavigateCampaign }: FsecTableRowProps) {
    const theme = useTheme();
    const status = getStatusInfo(fsec.statusId);
    const category = getCategoryInfo(fsec.categoryId);

    const handleDoubleClick = useCallback(() => {
        onNavigate(fsec.versionUuid);
    }, [fsec.versionUuid, onNavigate]);

    const handleButtonClick = useCallback(() => {
        onNavigate(fsec.versionUuid);
    }, [fsec.versionUuid, onNavigate]);

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
                <Typography fontWeight={500}>{fsec.name}</Typography>
            </TableCell>
            <TableCell>
                {fsec.campaignId ? (
                    <Typography
                        component="span"
                        onClick={(e) => onNavigateCampaign(e, fsec.campaignId)}
                        sx={{
                            color: 'primary.main',
                            fontWeight: 500,
                            cursor: 'pointer',
                            px: 1,
                            py: 0.25,
                            mx: -1,
                            borderRadius: 0.5,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                color: 'primary.dark',
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                transform: 'translateX(2px)',
                            },
                            '&:active': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                transform: 'translateX(2px) scale(0.98)',
                            },
                        }}
                    >
                        {fsec.campaignName}
                    </Typography>
                ) : (
                    <Typography color="text.secondary">-</Typography>
                )}
            </TableCell>
            <TableCell>
                <Typography>{fsec.campaignYear ?? '-'}</Typography>
            </TableCell>
            <TableCell>
                <DataChip label={status.label} color={status.color} />
            </TableCell>
            <TableCell>
                <DataChip label={category.label} color={category.color} />
            </TableCell>
            <TableCell align="center">
                <Tooltip title="Voir les détails">
                    <IconButton
                        size="small"
                        onClick={handleButtonClick}
                        aria-label={`Voir les d\u00e9tails de ${fsec.name}`}
                    >
                        <ArrowForwardIcon />
                    </IconButton>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
});
