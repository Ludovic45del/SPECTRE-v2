/**
 * AssemblyItemsTable — tableau récap des éléments/consommables liés à une FSEC.
 *
 * - Chargé via `useFsecAssemblyItems(fsecUuid)` (payload enrichi : catalog_item joint).
 * - Lecture seule si la FSEC est verrouillée (`disabled` prop).
 * - Suppression d'une ligne : confirmation puis libération côté backend.
 *
 * Cf. CDC §5.3.
 */

import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    Alert as MuiAlert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { useFsecAssemblyItems, useRemoveAssemblyItem, type FsecAssemblyItemDetail } from '@entities/fsec-assembly-item';
import { QuantityBadge, RubricBadge, StatusBadge, formatLocation, type StockCatalogItem } from '@entities/stock-item';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib/error-utils';

interface AssemblyItemsTableProps {
    fsecUuid: string;
    /** Si vrai, le tableau est en lecture seule (FSEC tirée). */
    disabled?: boolean;
}

export function AssemblyItemsTable({ fsecUuid, disabled = false }: AssemblyItemsTableProps) {
    const { data: items, isLoading, error } = useFsecAssemblyItems(fsecUuid);
    const removeMutation = useRemoveAssemblyItem(fsecUuid);
    const { showNotification } = useNotification();

    const [deleteTarget, setDeleteTarget] = useState<FsecAssemblyItemDetail | null>(null);

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await removeMutation.mutateAsync(deleteTarget.uuid);
            showNotification(`« ${deleteTarget.catalogItem.name} » retiré du tableau récap`, 'success');
            setDeleteTarget(null);
        } catch (err) {
            showNotification(getErrorMessage(err, 'Erreur lors de la suppression'), 'error');
        }
    };

    if (isLoading) {
        return <Skeleton variant="rounded" height={180} />;
    }

    if (error) {
        return (
            <MuiAlert severity="error" role="alert">
                Erreur de chargement des éléments : {error instanceof Error ? error.message : 'inconnue'}
            </MuiAlert>
        );
    }

    if (!items || items.length === 0) {
        return (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                    Aucun élément ni consommable n'est associé à cette FSEC.
                </Typography>
            </Paper>
        );
    }

    return (
        <>
            <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'divider' }}>
                <Table size="small" aria-label="Tableau récap des éléments et consommables de la FSEC">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Référence</TableCell>
                            <TableCell>Rubrique</TableCell>
                            <TableCell>État / Stock</TableCell>
                            <TableCell>Emplacement</TableCell>
                            <TableCell>Remarque</TableCell>
                            <TableCell align="right">{disabled ? '' : 'Actions'}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((row) => (
                            <AssemblyItemRow
                                key={row.uuid}
                                row={row}
                                disabled={disabled}
                                onDelete={() => setDeleteTarget(row)}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                aria-labelledby="confirm-delete-assembly-item"
            >
                <DialogTitle id="confirm-delete-assembly-item">Retirer cet élément ?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Vous êtes sur le point de retirer <strong>{deleteTarget?.catalogItem.name}</strong> du tableau
                        récap.
                        {deleteTarget?.catalogItem.kind === 'element' && (
                            <>
                                {' '}
                                L'élément redeviendra <em>disponible</em> dans le catalogue.
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} color="inherit">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={removeMutation.isPending}
                    >
                        {removeMutation.isPending ? 'Suppression…' : 'Retirer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

interface AssemblyItemRowProps {
    row: FsecAssemblyItemDetail;
    disabled: boolean;
    onDelete: () => void;
}

function AssemblyItemRow({ row, disabled, onDelete }: AssemblyItemRowProps) {
    const item: StockCatalogItem = row.catalogItem;

    return (
        <TableRow hover>
            <TableCell>
                <Stack spacing={0.25}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.name}
                    </Typography>
                    {item.caracteristique && (
                        <Typography variant="caption" color="text.secondary">
                            {item.caracteristique}
                        </Typography>
                    )}
                </Stack>
            </TableCell>
            <TableCell>
                <Typography variant="body2" color="text.secondary">
                    {item.reference ?? '—'}
                </Typography>
            </TableCell>
            <TableCell>
                <RubricBadge category={item.category} />
            </TableCell>
            <TableCell>
                {item.kind === 'element' && item.status ? (
                    <StatusBadge status={item.status} />
                ) : item.kind === 'consumable' ? (
                    <QuantityBadge item={item} />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        —
                    </Typography>
                )}
            </TableCell>
            <TableCell>
                <Typography variant="body2" color="text.secondary">
                    {formatLocation(item)}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {row.remarque || '—'}
                </Typography>
            </TableCell>
            <TableCell align="right">
                {!disabled && (
                    <Tooltip title="Retirer du tableau récap">
                        <span>
                            <IconButton size="small" color="error" onClick={onDelete}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
            </TableCell>
        </TableRow>
    );
}
