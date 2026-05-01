/**
 * CatalogTab — onglet Catalogue Stock.
 *
 * Pattern aligné sur `pages/campaigns` :
 *  - Toolbar séparée
 *  - Header dans son propre Paper (Box flex + TableSortLabel)
 *  - Body dans un second Paper avec mt: 3, tableLayout: fixed + colgroup
 *  - Pagination intégrée dans le Paper du body
 */

import { useMemo } from 'react';
import {
    Alert,
    Box,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    TableSortLabel,
} from '@mui/material';
import { useCatalogItems, type StockCatalogItem } from '@entities/stock-item';
import { CreateItemModal, useCreateItemStore } from '@features/stock/create-item';
import { EditItemModal, useEditItemStore } from '@features/stock/edit-item';
import { CatalogToolbar, RubricFilterPills, useFilterCatalogStore } from '@features/stock/filter-catalog';
import { ROWS_PER_PAGE_OPTIONS, useEntityList } from '@shared/lib';
import { CATALOG_COLUMNS, COLUMN_WIDTHS, type CatalogSortColumn, sortCatalogItems } from './lib/catalog.helpers';
import { CatalogTableRow } from './components/CatalogTableRow';
import { EmptyCatalog } from './components/EmptyCatalog';

const TOTAL_COLS = CATALOG_COLUMNS.length + 1; // +1 pour la colonne actions

export function CatalogTab() {
    const filters = useFilterCatalogStore((s) => s.filters);
    const { data: items, isLoading, error } = useCatalogItems(filters);
    const openCreateModal = useCreateItemStore((s) => s.open);
    const openEditModal = useEditItemStore((s) => s.open);

    const handleRowClick = (item: StockCatalogItem) => openEditModal(item.uuid);

    const {
        sortColumn,
        sortDirection,
        page,
        rowsPerPage,
        handleSort,
        handleChangePage,
        handleChangeRowsPerPage,
        paginate,
    } = useEntityList<CatalogSortColumn>({ defaultSortColumn: 'name' });

    const sortedItems = useMemo(
        () => (items ? sortCatalogItems(items, sortColumn, sortDirection) : []),
        [items, sortColumn, sortDirection],
    );

    const paginatedItems = useMemo<StockCatalogItem[]>(() => paginate(sortedItems), [paginate, sortedItems]);

    const hasActiveFilters =
        filters.search.trim() !== '' ||
        filters.kind !== null ||
        filters.category !== null ||
        filters.status !== null ||
        filters.installation !== null;

    if (error) {
        return (
            <Alert severity="error" role="alert">
                Erreur lors du chargement du catalogue : {error instanceof Error ? error.message : 'inconnue'}
            </Alert>
        );
    }

    return (
        <Box>
            <CatalogToolbar onAdd={openCreateModal} />
            <RubricFilterPills items={items} />

            {/* Table Header — Paper séparé style Campaigns */}
            <Paper variant="outlined" sx={{ borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', py: 1.25 }}>
                    {CATALOG_COLUMNS.map((col) => (
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

            {/* Table Body */}
            <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderColor: 'divider', borderRadius: 1, mt: 3 }}
            >
                <Table sx={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        {Object.values(COLUMN_WIDTHS).map((width, i) => (
                            <col key={i} style={{ width }} />
                        ))}
                    </colgroup>
                    <TableBody>
                        {isLoading ? (
                            [...Array(8)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton variant="text" width="80%" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton variant="text" width="80%" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton variant="rounded" width={100} height={22} />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton variant="text" width="80%" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton variant="text" width="80%" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton variant="rounded" width={120} height={22} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Skeleton variant="circular" width={32} height={32} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : paginatedItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={TOTAL_COLS} sx={{ borderBottom: 'none' }}>
                                    <EmptyCatalog isInitialEmpty={!hasActiveFilters} onAdd={openCreateModal} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedItems.map((item) => (
                                <CatalogTableRow key={item.uuid} item={item} onClick={handleRowClick} />
                            ))
                        )}
                    </TableBody>
                </Table>
                {!isLoading && sortedItems.length > 0 && (
                    <TablePagination
                        component="div"
                        count={sortedItems.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                        labelRowsPerPage="Lignes par page :"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                    />
                )}
            </TableContainer>

            <CreateItemModal />
            <EditItemModal />
        </Box>
    );
}
