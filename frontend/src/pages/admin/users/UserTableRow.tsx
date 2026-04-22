/**
 * UserTableRow - Memoized table row sub-component for AdminUsersPage
 * @module pages/admin/users/UserTableRow
 */

import { memo, useState, useCallback } from 'react';
import {
    TableRow,
    TableCell,
    Typography,
    Chip,
    alpha,
    useTheme,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';

import { ROLE_LABELS, PERMISSION_GROUP_LABELS, type PermissionGroup, type User } from '@entities/user';

import { ROLE_COLORS } from './AdminUsersPage.constants';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DialogType = 'edit' | 'reset' | 'toggle';

export interface UserTableRowProps {
    user: User;
    onOpenDialog: (user: User, dialog: DialogType) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const UserTableRow = memo(function UserTableRow({ user, onOpenDialog }: UserTableRowProps) {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleOpenMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    }, []);

    const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

    const handleAction = useCallback(
        (dialog: DialogType) => {
            handleCloseMenu();
            onOpenDialog(user, dialog);
        },
        [user, onOpenDialog, handleCloseMenu],
    );

    const handleEdit = useCallback(() => handleAction('edit'), [handleAction]);
    const handleReset = useCallback(() => handleAction('reset'), [handleAction]);
    const handleToggle = useCallback(() => handleAction('toggle'), [handleAction]);

    return (
        <TableRow
            hover
            sx={{
                transition: 'background-color 0.15s ease',
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
            }}
        >
            <TableCell>
                <Typography fontWeight={500}>{user.username}</Typography>
            </TableCell>
            <TableCell>
                <Typography>{user.lastName || '-'}</Typography>
            </TableCell>
            <TableCell>
                <Typography>{user.firstName || '-'}</Typography>
            </TableCell>
            <TableCell>
                <Chip
                    label={ROLE_LABELS[user.role] ?? user.role}
                    size="small"
                    sx={{
                        bgcolor: alpha(ROLE_COLORS[user.role] ?? '#757575', 0.12),
                        color: ROLE_COLORS[user.role] ?? '#757575',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                    }}
                />
            </TableCell>
            <TableCell>
                <Typography variant="body2">{user.laboratoire || '-'}</Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2">{user.service || '-'}</Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2">{user.numero || '-'}</Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2">{user.bureau || '-'}</Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2" color="text.secondary">
                    {PERMISSION_GROUP_LABELS[user.permissionGroup as PermissionGroup] ?? user.permissionGroup}
                </Typography>
            </TableCell>
            <TableCell>
                <Chip
                    label={user.isActive ? 'Actif' : 'Inactif'}
                    size="small"
                    sx={{
                        bgcolor: alpha(user.isActive ? '#4caf50' : '#f44336', 0.12),
                        color: user.isActive ? '#4caf50' : '#f44336',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                    }}
                />
            </TableCell>
            <TableCell align="center" sx={{ px: 0 }}>
                <IconButton size="small" onClick={handleOpenMenu}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem onClick={handleEdit}>
                        <ListItemIcon>
                            <EditIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Modifier</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleReset}>
                        <ListItemIcon>
                            <LockResetIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Réinitialiser le mot de passe</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleToggle}>
                        <ListItemIcon>
                            {user.isActive ? <PersonOffIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText>{user.isActive ? 'Désactiver' : 'Réactiver'}</ListItemText>
                    </MenuItem>
                </Menu>
            </TableCell>
        </TableRow>
    );
});
