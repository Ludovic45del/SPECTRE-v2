/**
 * ResetPasswordDialog - Dialog de reinitialisation du mot de passe
 * Retourne un lien d'activation signé (TTL 24h, single-use) plutôt qu'un mot
 * de passe en clair — fix audit sécurité.
 * @module features/admin/reset-password
 */

import { memo, useCallback, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    Divider,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { type PasswordResetResponse, type User, useResetPassword } from '@entities/user';
import { useModalSubmit, useNotificationStore } from '@shared/lib';

interface ResetPasswordDialogProps {
    user: User | null;
    open: boolean;
    onClose: () => void;
}

function ResetPasswordDialogComponent({ user, open, onClose }: ResetPasswordDialogProps) {
    const resetMutation = useResetPassword();
    const showNotification = useNotificationStore((s) => s.showNotification);
    const [result, setResult] = useState<PasswordResetResponse | null>(null);

    const handleClose = useCallback(() => {
        setResult(null);
        onClose();
    }, [onClose]);

    const submitReset = useModalSubmit((uuid: string) => resetMutation.mutateAsync(uuid), {
        successMessage: `Mot de passe de ${user?.username} réinitialisé`,
        errorMessage: 'Erreur lors de la réinitialisation',
        onSuccess: (r) => setResult(r),
    });

    const handleReset = useCallback(async () => {
        if (!user) return;
        await submitReset(user.uuid);
    }, [user, submitReset]);

    const handleCopy = useCallback(() => {
        if (result?.activationUrl) {
            navigator.clipboard.writeText(result.activationUrl);
            showNotification("Lien d'activation copié dans le presse-papier", 'info');
        }
    }, [result, showNotification]);

    if (result) {
        return (
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
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
                        Lien d&apos;activation émis
                    </Typography>
                    <IconButton onClick={handleClose} size="small" aria-label="Fermer">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                        <Alert severity="warning">
                            Communiquez ce lien <strong>hors-bande</strong> à {user?.username}. Il expire dans{' '}
                            <strong>{result.activationTokenTtlHours}h</strong> et ne pourra être utilisé qu&apos;
                            <strong>une seule fois</strong>.
                        </Alert>
                        <TextField
                            label="Lien d'activation (usage unique)"
                            value={result.activationUrl}
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleCopy} size="small" title="Copier">
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            fullWidth
                        />
                        <Typography variant="body2" color="text.secondary">
                            L&apos;ancien mot de passe est d&apos;ores et déjà invalidé. L&apos;utilisateur définit son
                            nouveau mot de passe en ouvrant ce lien.
                        </Typography>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClose} variant="contained" size="small">
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
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
                    Réinitialiser le mot de passe
                </Typography>
                <IconButton onClick={handleClose} size="small" aria-label="Fermer">
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
                <DialogContentText>
                    Réinitialiser le mot de passe de <strong>{user?.username}</strong> ? Un lien d&apos;activation
                    signé (usage unique, TTL 24h) sera généré et l&apos;ancien mot de passe sera immédiatement
                    invalidé.
                </DialogContentText>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 3 }}>
                <Button type="button" onClick={handleClose} variant="text" color="inherit" sx={{ fontWeight: 600 }}>
                    Annuler
                </Button>
                <Button
                    onClick={handleReset}
                    variant="contained"
                    color="warning"
                    size="small"
                    disabled={resetMutation.isPending}
                >
                    {resetMutation.isPending ? 'Réinitialisation...' : 'Réinitialiser'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export const ResetPasswordDialog = memo(ResetPasswordDialogComponent);
