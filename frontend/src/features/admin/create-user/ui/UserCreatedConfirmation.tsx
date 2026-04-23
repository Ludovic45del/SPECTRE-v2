/**
 * UserCreatedConfirmation - Confirmation dialog after user creation
 * Affiche l'URL d'activation signée (TTL 24h, single-use) à communiquer
 * hors-bande. Le mot de passe en clair n'est plus jamais renvoyé.
 * @module features/admin/create-user
 */

import { memo, useCallback } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { type UserCreated } from '@entities/user';
import { useNotificationStore } from '@shared/lib';

interface UserCreatedConfirmationProps {
    open: boolean;
    user: UserCreated;
    onClose: () => void;
}

function UserCreatedConfirmationComponent({ open, user, onClose }: UserCreatedConfirmationProps) {
    const showNotification = useNotificationStore((s) => s.showNotification);

    const handleCopyUrl = useCallback(() => {
        if (user.activationUrl) {
            navigator.clipboard.writeText(user.activationUrl);
            showNotification("Lien d'activation copié dans le presse-papier", 'info');
        }
    }, [user, showNotification]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 3,
                    py: 2,
                }}
            >
                <Typography variant="h6" fontWeight={700} fontSize="0.95rem">
                    Utilisateur créé
                </Typography>
                <IconButton onClick={onClose} size="small" aria-label="Fermer">
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                    <Alert severity="warning">
                        Communiquez ce lien d&apos;activation <strong>hors-bande</strong> (mail interne, SMS, chat). Il
                        expire dans <strong>{user.activationTokenTtlHours}h</strong> et ne pourra être utilisé qu&apos;
                        <strong>une seule fois</strong>.
                    </Alert>
                    <TextField
                        label="Matricule"
                        value={user.username}
                        slotProps={{ input: { readOnly: true } }}
                        fullWidth
                    />
                    <TextField
                        label="Lien d'activation (usage unique)"
                        value={user.activationUrl}
                        slotProps={{
                            input: {
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleCopyUrl} size="small" title="Copier">
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                        fullWidth
                    />
                    <Typography variant="body2" color="text.secondary">
                        L&apos;utilisateur ouvre ce lien et définit son mot de passe. Le lien est invalidé dès sa
                        première utilisation.
                    </Typography>
                </Stack>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} variant="contained" size="small">
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export const UserCreatedConfirmation = memo(UserCreatedConfirmationComponent);
