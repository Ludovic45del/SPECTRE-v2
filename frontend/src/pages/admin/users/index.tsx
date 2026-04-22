/**
 * Admin Users Page - Gestion des utilisateurs
 * @module pages/admin/users
 *
 * Style: Aligned with EmbasesPage / FsecsPage pattern
 * Features: Sortable columns, pagination, search, toolbar
 */

import { useMemo, useCallback, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TablePagination,
    TableSortLabel,
    Skeleton,
    Alert,
    Chip,
    alpha,
} from '@mui/material';

import { useUsers, type User } from '@entities/user';
import { FilterToolbar } from '@widgets/filter-toolbar';
import {
    CreateUserModal,
    EditUserModal,
    ResetPasswordDialog,
    ToggleUserDialog,
    useCreateUserStore,
} from '@features/admin';
import { useEntityList, ROWS_PER_PAGE_OPTIONS } from '@shared/lib';

import { COLUMN_WIDTHS, COLUMNS, SKELETON_CELLS, type SortColumn } from './AdminUsersPage.constants';
import { filterUsers, sortUsers } from './user-list-filters';
import { UserTableRow, type DialogType } from './UserTableRow';

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────

const PAPER_SX = { borderColor: 'divider', borderRadius: 1, overflow: 'hidden' } as const;
const TABLE_CONTAINER_SX = { borderColor: 'divider', borderRadius: 1, mt: 1.5 } as const;

const COLGROUP = (
    <colgroup>
        {Object.values(COLUMN_WIDTHS).map((width, i) => (
            <col key={i} style={{ width }} />
        ))}
    </colgroup>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
    const { data: users, isLoading, error } = useUsers();
    const openCreateModal = useCreateUserStore((s) => s.open);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [openDialog, setOpenDialog] = useState<DialogType | null>(null);
    const [searchName, setSearchName] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    const {
        sortColumn,
        sortDirection,
        page,
        rowsPerPage,
        handleSort,
        handleChangePage,
        handleChangeRowsPerPage,
        paginate,
    } = useEntityList<SortColumn>({ defaultSortColumn: 'username' });

    const processedUsers = useMemo(() => {
        if (!users) return [];
        return sortUsers(filterUsers(users, searchName, showInactive), sortColumn, sortDirection);
    }, [users, searchName, showInactive, sortColumn, sortDirection]);

    const paginatedUsers = useMemo(() => paginate(processedUsers), [paginate, processedUsers]);

    const handleOpenDialog = useCallback((user: User, dialog: DialogType) => {
        setSelectedUser(user);
        setOpenDialog(dialog);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setSelectedUser(null);
        setOpenDialog(null);
    }, []);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchName) count++;
        if (showInactive) count++;
        return count;
    }, [searchName, showInactive]);

    const handleResetFilters = useCallback(() => {
        setSearchName('');
        setShowInactive(false);
    }, []);

    const handleShowActifs = useCallback(() => setShowInactive(false), []);
    const handleShowTous = useCallback(() => setShowInactive(true), []);

    const renderPrefix = useCallback(
        () => (
            <>
                <Button
                    variant={!showInactive ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ borderRadius: 1, px: 2, height: 40, fontWeight: 600 }}
                    onClick={handleShowActifs}
                >
                    Actifs
                </Button>
                <Button
                    variant={showInactive ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ borderRadius: 1, px: 2, height: 40, fontWeight: 600 }}
                    onClick={handleShowTous}
                >
                    Tous
                </Button>
            </>
        ),
        [showInactive, handleShowActifs, handleShowTous],
    );

    const renderFilterChips = useCallback(() => {
        const isFiltered = !showInactive;
        const label = isFiltered ? 'Actifs' : 'Inactifs inclus';
        const color = isFiltered ? '#4caf50' : '#f44336';
        const textColor = isFiltered ? '#2e7d32' : '#f44336';
        return (
            <Chip
                label={label}
                size="small"
                onDelete={isFiltered ? handleShowTous : handleShowActifs}
                sx={{
                    bgcolor: alpha(color, isFiltered ? 0.12 : 0.1),
                    color: textColor,
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': { color: textColor },
                }}
            />
        );
    }, [showInactive, handleShowActifs, handleShowTous]);

    const toolbarProps = useMemo(
        () => ({
            searchPlaceholder: 'Rechercher un utilisateur...',
            filterName: searchName,
            onFilterNameChange: setSearchName,
            onResetFilters: handleResetFilters,
            activeFilterCount,
            onAdd: openCreateModal,
            renderPopoverContent: () => null,
            renderFilterChips,
            renderPrefix,
            hideFilterButton: true as const,
        }),
        [searchName, handleResetFilters, activeFilterCount, openCreateModal, renderFilterChips, renderPrefix],
    );

    if (error) {
        return (
            <Container maxWidth={false} sx={{ py: 4 }}>
                <Alert severity="error">Erreur lors du chargement des utilisateurs: {error.message}</Alert>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container maxWidth={false} sx={{ py: 4 }}>
                <FilterToolbar {...toolbarProps} />
                <Paper variant="outlined" sx={PAPER_SX}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1.25 }}>
                        {COLUMNS.map((col) => (
                            <Box key={col.key} sx={{ width: col.width, pl: 2 }}>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>{col.label}</Typography>
                            </Box>
                        ))}
                        <Box sx={{ width: COLUMN_WIDTHS.actions }} />
                    </Box>
                </Paper>
                <TableContainer component={Paper} variant="outlined" sx={TABLE_CONTAINER_SX}>
                    <Table sx={{ tableLayout: 'fixed' }}>
                        {COLGROUP}
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    {SKELETON_CELLS.map((cell, j) => (
                                        <TableCell key={j} align={cell.align}>
                                            <Skeleton variant={cell.variant} width={cell.width} height={cell.height} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <FilterToolbar {...toolbarProps} />
            <Paper variant="outlined" sx={PAPER_SX}>
                <Box sx={{ display: 'flex', alignItems: 'center', py: 1.25 }}>
                    {COLUMNS.map((col) => (
                        <Box key={col.key} sx={{ width: col.width, pl: 2 }}>
                            <TableSortLabel
                                active={sortColumn === col.key}
                                direction={sortColumn === col.key ? sortDirection : 'asc'}
                                onClick={() => handleSort(col.key)}
                                sx={{ fontWeight: 500, fontSize: '0.95rem' }}
                            >
                                {col.label}
                            </TableSortLabel>
                        </Box>
                    ))}
                    <Box sx={{ width: COLUMN_WIDTHS.actions }} />
                </Box>
            </Paper>
            <TableContainer component={Paper} variant="outlined" sx={TABLE_CONTAINER_SX}>
                <Table sx={{ tableLayout: 'fixed' }}>
                    {COLGROUP}
                    <TableBody>
                        {paginatedUsers.map((user) => (
                            <UserTableRow key={user.uuid} user={user} onOpenDialog={handleOpenDialog} />
                        ))}
                        {paginatedUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={11} align="center">
                                    <Typography color="text.secondary" sx={{ py: 4 }}>
                                        Aucun utilisateur trouvé
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={processedUsers.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                    labelRowsPerPage="Lignes par page:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                />
            </TableContainer>
            <CreateUserModal />
            <EditUserModal user={selectedUser} open={openDialog === 'edit'} onClose={handleCloseDialog} />
            <ResetPasswordDialog user={selectedUser} open={openDialog === 'reset'} onClose={handleCloseDialog} />
            <ToggleUserDialog user={selectedUser} open={openDialog === 'toggle'} onClose={handleCloseDialog} />
        </Container>
    );
}
