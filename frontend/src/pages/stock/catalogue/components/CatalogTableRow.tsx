/**
 * Ligne du tableau Catalogue (formalisme aligné sur pages/campaigns).
 */

import { memo, useCallback } from 'react';
import {
    IconButton,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
    formatLocation,
    isElement,
    QuantityBadge,
    RubricBadge,
    StatusBadge,
    type StockCatalogItem,
} from '@entities/stock-item';
import { motion } from '@shared/ui/motion';

interface CatalogTableRowProps {
    item: StockCatalogItem;
    onClick?: (item: StockCatalogItem) => void;
}

export const CatalogTableRow = memo(function CatalogTableRow({ item, onClick }: CatalogTableRowProps) {
    const theme = useTheme();

    const handleDoubleClick = useCallback(() => {
        if (onClick) onClick(item);
    }, [item, onClick]);

    const handleButtonClick = useCallback(() => {
        if (onClick) onClick(item);
    }, [item, onClick]);

    return (
        <TableRow
            hover
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                transition: `background-color ${motion.fast}`,
                '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
            }}
            onDoubleClick={handleDoubleClick}
        >
            <TableCell>
                <Typography fontWeight={500}>{item.name}</Typography>
            </TableCell>
            <TableCell>
                <Typography
                    component="span"
                    sx={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        fontSize: '0.78rem',
                        color: 'text.secondary',
                    }}
                >
                    {item.reference ?? '—'}
                </Typography>
            </TableCell>
            <TableCell>
                <RubricBadge category={item.category} />
            </TableCell>
            <TableCell>
                <Typography color={item.fournisseur ? 'text.primary' : 'text.secondary'}>
                    {item.fournisseur ?? '—'}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography color="text.secondary">{formatLocation(item)}</Typography>
            </TableCell>
            <TableCell>
                {isElement(item) ? (
                    item.status ? (
                        <StatusBadge status={item.status} />
                    ) : (
                        <Typography color="text.secondary">—</Typography>
                    )
                ) : (
                    <QuantityBadge item={item} />
                )}
            </TableCell>
            <TableCell align="center">
                {onClick && (
                    <Tooltip title="Voir le détail">
                        <IconButton
                            size="small"
                            onClick={handleButtonClick}
                            aria-label={`Voir le détail de ${item.name}`}
                        >
                            <ArrowForwardIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </TableCell>
        </TableRow>
    );
});
