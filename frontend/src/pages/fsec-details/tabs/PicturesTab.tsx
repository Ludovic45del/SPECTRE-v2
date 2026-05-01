/**
 * FSEC Pictures Tab
 * @module pages/fsec-details/tabs
 *
 * Displays the photo session with:
 * - Session info (operator, date) - one per FSEC
 * - List of views/photos with names and links
 */

import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import dayjs from 'dayjs';
import {
    PicturesStep,
    PhotoView,
    usePicturesStepsByFsec,
    usePhotoViewsByPicturesStep,
    useCreatePicturesStep,
} from '@entities/fsec/steps';
import { useFsec } from '@entities/fsec';
import { useCampaign } from '@entities/campaign';
import { PicturesSessionModal, PhotoViewModal } from '@features/fsec/edit-pictures';
import { UserChip } from '@entities/user';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib';
import { motion } from '@shared/ui/motion';

const slugify = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();

function buildViewLink(
    campaignName: string | null | undefined,
    year: number | null | undefined,
    installationLabel: string | null | undefined,
    viewName: string,
): string {
    const parts = [
        campaignName ? slugify(campaignName) : 'campagne',
        year ?? 'annee',
        installationLabel ? slugify(installationLabel) : 'installation',
        'photos',
        slugify(viewName) || 'vue',
    ];
    return parts.join('/');
}

interface PicturesTabProps {
    fsecVersionId: string;
}

// ============ Session Card ============

function SessionCard({
    picturesStep,
    onEdit,
    onCreate,
    isCreating,
}: {
    picturesStep: PicturesStep | null;
    onEdit: () => void;
    onCreate: () => void;
    isCreating: boolean;
}) {
    const hasSession = Boolean(picturesStep);
    const isComplete = Boolean(picturesStep?.operator && picturesStep?.date);

    if (!hasSession) {
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
                <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} disabled={isCreating}>
                    {isCreating ? 'Création...' : 'Créer une session photo'}
                </Button>
            </Paper>
        );
    }

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
            <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CameraAltIcon color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                            Session Photo
                        </Typography>
                        {isComplete && <Chip label="Complet" color="success" />}
                    </Stack>
                    <IconButton size="small" onClick={onEdit} color="primary">
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Stack>

                <Grid container spacing={2}>
                    <Grid item xs={6} md={4}>
                        <Typography variant="caption" color="text.secondary">
                            Opérateur
                        </Typography>
                        <Box>
                            <UserChip
                                userUuid={picturesStep?.operatorUserUuid}
                                fallbackText={picturesStep?.operator}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={4}>
                        <Typography variant="caption" color="text.secondary">
                            Date de réalisation
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {picturesStep?.date ? dayjs(picturesStep.date).format('DD/MM/YYYY') : '-'}
                        </Typography>
                    </Grid>
                </Grid>

                {picturesStep?.comments && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                            Commentaires
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            {picturesStep.comments}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}

// ============ Photo View Item ============

function PhotoViewItem({
    view,
    isLast,
    onEdit,
    fallbackLink,
}: {
    view: PhotoView;
    isLast: boolean;
    onEdit: () => void;
    fallbackLink: string;
}) {
    const { showNotification } = useNotification();

    const handleCopy = (e: ReactMouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(view.link || fallbackLink);
        showNotification('Lien copié !', 'success');
    };

    return (
        <ListItem
            divider={!isLast}
            secondaryAction={
                <Tooltip title="Copier le lien" arrow>
                    <IconButton size="small" onClick={handleCopy}>
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            }
            sx={{
                py: 1.5,
                transition: `background-color ${motion.base}`,
                cursor: 'pointer',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
            }}
            onClick={onEdit}
        >
            <ListItemText
                primary={
                    <Typography variant="body2" fontWeight={600}>
                        {view.name}
                    </Typography>
                }
            />
        </ListItem>
    );
}

// ============ Photo Views List ============

function PhotoViewsList({
    views,
    onAdd,
    onEdit,
    buildFallbackLink,
}: {
    views?: PhotoView[];
    onAdd: () => void;
    onEdit: (view: PhotoView) => void;
    buildFallbackLink: (viewName: string) => string;
}) {
    if (!views?.length) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    borderColor: 'divider',
                    borderStyle: 'dashed',
                    textAlign: 'center',
                }}
            >
                <ImageIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                    Aucune vue ajoutée
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ajoutez des vues pour référencer les photos
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd}>
                    Ajouter une vue
                </Button>
            </Paper>
        );
    }

    return (
        <Paper variant="outlined" sx={{ borderRadius: 1, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <ImageIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>
                            Vues / Photos
                        </Typography>
                        <Chip label={views.length} color="primary" />
                    </Stack>
                    <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
                        Ajouter
                    </Button>
                </Stack>
            </Box>

            <List disablePadding>
                {views.map((view, index) => (
                    <PhotoViewItem
                        key={view.uuid}
                        view={view}
                        isLast={index === views.length - 1}
                        onEdit={() => onEdit(view)}
                        fallbackLink={buildFallbackLink(view.name)}
                    />
                ))}
            </List>
        </Paper>
    );
}

// ============ Main Component ============

export function PicturesTab({ fsecVersionId }: PicturesTabProps) {
    const { data: picturesSteps } = usePicturesStepsByFsec(fsecVersionId);
    const { data: fsec } = useFsec(fsecVersionId);
    const { data: campaign } = useCampaign(fsec?.campaignId ?? '');

    // Session modal state
    const [sessionModalOpen, setSessionModalOpen] = useState(false);

    // View modal state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedView, setSelectedView] = useState<PhotoView | null>(null);

    // Get the first (and only) pictures step for this FSEC
    const picturesStep = picturesSteps?.[0] ?? null;

    // Fetch photo views if session exists
    const { data: photoViews } = usePhotoViewsByPicturesStep(picturesStep?.uuid ?? '');

    // Create session mutation (for empty state)
    const createSessionMutation = useCreatePicturesStep();
    const { showNotification } = useNotification();

    const handleCreateSession = async () => {
        try {
            await createSessionMutation.mutateAsync({
                fsecVersionId,
            });
            showNotification('Session photo créée', 'success');
        } catch (error) {
            showNotification(getErrorMessage(error, 'Erreur lors de la création de la session'), 'error');
        }
    };

    const handleEditSession = () => {
        setSessionModalOpen(true);
    };

    const handleCloseSessionModal = () => {
        setSessionModalOpen(false);
    };

    const handleAddView = () => {
        setSelectedView(null);
        setViewModalOpen(true);
    };

    const handleEditView = (view: PhotoView) => {
        setSelectedView(view);
        setViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewModalOpen(false);
        setSelectedView(null);
    };

    return (
        <Box>
            <Stack spacing={3}>
                {/* Session Photo Card */}
                <SessionCard
                    picturesStep={picturesStep}
                    onEdit={handleEditSession}
                    onCreate={handleCreateSession}
                    isCreating={createSessionMutation.isPending}
                />

                {/* Photo Views List - Only show if session exists */}
                {picturesStep && (
                    <PhotoViewsList
                        views={photoViews}
                        onAdd={handleAddView}
                        onEdit={handleEditView}
                        buildFallbackLink={(viewName) =>
                            buildViewLink(campaign?.name, campaign?.year, campaign?.installation?.label, viewName)
                        }
                    />
                )}
            </Stack>

            {/* Modals */}
            <PicturesSessionModal
                open={sessionModalOpen}
                onClose={handleCloseSessionModal}
                fsecVersionId={fsecVersionId}
                step={picturesStep}
            />

            {picturesStep && (
                <PhotoViewModal
                    open={viewModalOpen}
                    onClose={handleCloseViewModal}
                    picturesStepId={picturesStep.uuid}
                    view={selectedView}
                />
            )}
        </Box>
    );
}
