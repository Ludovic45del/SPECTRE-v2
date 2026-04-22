/**
 * FSEC Header Component
 * @module features/fsec-header
 *
 * Style: Aligned with CampaignHeader
 * Displays FSEC header with navigation, info and workflow stepper.
 */

import { useState, useCallback, useMemo, memo } from 'react';
import {
    Box,
    Paper,
    Stack,
    Typography,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataChip } from '@widgets/data-chip';
import { Fsec, useDeleteFsec } from '@entities/fsec';
import { useCampaign } from '@entities/campaign';
import { FsecWorkflowStepper } from './FsecWorkflowStepper';
import { useNotification } from '@shared/ui';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

interface FsecHeaderProps {
    fsec: Fsec;
}

function FsecHeaderComponent({ fsec }: FsecHeaderProps) {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const deleteMutation = useDeleteFsec();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Fetch campaign data
    const { data: campaign } = useCampaign(fsec.campaignId ?? '');

    // Memoized computed values
    const formattedLastUpdated = useMemo(() => {
        if (!fsec.lastUpdated) return null;
        return dayjs(fsec.lastUpdated).format('DD/MM/YYYY');
    }, [fsec.lastUpdated]);

    const formattedCampaignName = useMemo(() => {
        if (!campaign) return fsec.name;
        const installationLabel = campaign.installation?.label ?? 'UNK';
        return `${campaign.year}-${installationLabel}_${campaign.name}`;
    }, [campaign, fsec.name]);

    // Memoized handlers
    const handleOpenDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(true);
    }, []);

    const handleCloseDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(false);
    }, []);

    const handleDelete = useCallback(async () => {
        try {
            await deleteMutation.mutateAsync(fsec.versionUuid);
            showNotification('FSEC supprimé', 'success');
            navigate('/fsecs');
        } catch {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }, [fsec.versionUuid, deleteMutation, showNotification, navigate]);

    return (
        <Paper
            component="header"
            variant="outlined"
            sx={{
                p: 3,
                borderRadius: 1,
                bgcolor: 'background.paper',
                borderColor: 'divider',
            }}
            role="banner"
            aria-label={`En-tête du FSEC ${fsec.name}`}
        >
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems="center"
                spacing={4}
            >
                {/* Left: Back button + Copyright icon + Campaign info */}
                <Box sx={{ minWidth: 300 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton
                            component={Link}
                            to="/fsecs"
                            aria-label="Retour à la liste des FSECs"
                            sx={{
                                width: 40,
                                height: 40,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: '50%',
                                bgcolor: 'background.paper',
                                color: 'text.secondary',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                    borderColor: 'primary.main',
                                    color: 'primary.main',
                                    transform: 'translateX(-2px)',
                                },
                            }}
                        >
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                border: '3px solid',
                                borderColor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Typography
                                sx={{
                                    color: 'primary.main',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    letterSpacing: '-0.5px',
                                }}
                            >
                                Fsec
                            </Typography>
                        </Box>
                        <Stack spacing={0.5}>
                            {/* Tags at top */}
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                {campaign?.type && (
                                    <DataChip
                                        label={campaign.type.label}
                                        color={campaign.type.color}
                                        sx={{ height: 24, fontSize: '0.75rem' }}
                                    />
                                )}
                                {campaign?.installation && (
                                    <DataChip
                                        label={campaign.installation.label}
                                        color={campaign.installation.color ?? '#E91E63'}
                                        sx={{ height: 24, fontSize: '0.75rem' }}
                                    />
                                )}
                            </Stack>
                            {/* FSEC name */}
                            <Typography variant="h4" fontWeight="bold" component="h1">
                                {fsec.name}
                            </Typography>
                            {/* Campaign breadcrumb link */}
                            {campaign && (
                                <Box
                                    component={Link}
                                    to={`/campagne-details/${campaign.uuid}/overview`}
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 1.5,
                                        py: 0.25,
                                        borderRadius: '100px',
                                        bgcolor: 'action.hover',
                                        color: 'text.secondary',
                                        textDecoration: 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        width: 'fit-content',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            bgcolor: 'primary.50',
                                            color: 'primary.main',
                                        },
                                    }}
                                >
                                    Campagne : {formattedCampaignName}
                                </Box>
                            )}
                            {/* Last modification date below */}
                            {formattedLastUpdated && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Dernière modification effectuée le {formattedLastUpdated}
                                </Typography>
                            )}
                        </Stack>
                    </Stack>
                </Box>

                {/* Center: Workflow Stepper */}
                <Box sx={{ flexGrow: 1, maxWidth: 700 }} role="navigation" aria-label="Workflow du FSEC">
                    <FsecWorkflowStepper fsec={fsec} />
                </Box>

                {/* Right: Delete action */}
                <Box>
                    <Tooltip title="Supprimer le FSEC">
                        <IconButton
                            onClick={handleOpenDeleteDialog}
                            aria-label="Supprimer le FSEC"
                            sx={{
                                width: 40,
                                height: 40,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: '50%',
                                bgcolor: 'background.paper',
                                color: 'text.secondary',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: 'error.lighter',
                                    borderColor: 'error.main',
                                    color: 'error.main',
                                },
                            }}
                        >
                            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Stack>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                maxWidth="xs"
                fullWidth
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">Supprimer le FSEC</DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Êtes-vous sûr de vouloir supprimer le FSEC <strong>{fsec.name}</strong> ? Cette action est
                        irréversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={handleCloseDeleteDialog} color="inherit">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export const FsecHeader = memo(FsecHeaderComponent);
