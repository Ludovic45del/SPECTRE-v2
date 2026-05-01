/**
 * AlertRow — ligne d'item dans une section d'alerte.
 */

import { Box, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { formatLocation, type StockCatalogItem } from '@entities/stock-item';
import { motion } from '@shared/ui/motion';

interface AlertRowProps {
    item: StockCatalogItem;
    /** Métadonnées spécifiques à la sévérité (ex. date péremption, stock courant). */
    metadata: { label: string; value: React.ReactNode }[];
    onClick?: (item: StockCatalogItem) => void;
}

export function AlertRow({ item, metadata, onClick }: AlertRowProps) {
    return (
        <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            onClick={onClick ? () => onClick(item) : undefined}
            sx={{
                px: 2.5,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
                cursor: onClick ? 'pointer' : 'default',
                transition: `background-color ${motion.fast}`,
                '&:hover': { bgcolor: onClick ? 'action.hover' : 'transparent' },
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 0.25 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.name}</Typography>
                    {item.reference && (
                        <Typography
                            component="span"
                            sx={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                                fontSize: '0.72rem',
                                color: 'text.secondary',
                            }}
                        >
                            {item.reference}
                        </Typography>
                    )}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                    {metadata.map((m, i) => (
                        <Typography
                            key={i}
                            variant="caption"
                            color="text.secondary"
                            sx={{ '& b': { color: 'text.primary' } }}
                        >
                            {m.label}&nbsp;: {m.value}
                        </Typography>
                    ))}
                    {!metadata.find((m) => m.label === 'Emplacement') && formatLocation(item) !== '—' && (
                        <Typography variant="caption" color="text.secondary">
                            Emplacement&nbsp;: {formatLocation(item)}
                        </Typography>
                    )}
                </Stack>
            </Box>
            {onClick && (
                <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{ color: 'primary.main', fontSize: '0.8rem' }}
                >
                    <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 500 }}>
                        Gérer
                    </Typography>
                    <ChevronRightIcon fontSize="small" />
                </Stack>
            )}
        </Stack>
    );
}
