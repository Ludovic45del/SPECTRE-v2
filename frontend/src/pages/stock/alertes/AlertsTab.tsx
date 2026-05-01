/**
 * AlertsTab — onglet Alertes Stock (cf. CDC §5.4).
 *
 * - 3 cartes compteurs en haut.
 * - 3 sections : Périmés (danger), Péremption proche (warning), Stock bas (info).
 * - Cliquer une ligne ouvre l'EditItemModal.
 */

import { useMemo } from 'react';
import { Alert, Box, Skeleton, Stack } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { type StockCatalogItem, useStockAlerts } from '@entities/stock-item';
import { EditItemModal, useEditItemStore } from '@features/stock/edit-item';
import { AlertCounterCard } from './components/AlertCounterCard';
import { AlertRow } from './components/AlertRow';
import { AlertSection } from './components/AlertSection';
import { formatLocation } from '@entities/stock-item';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const formatDateMaybe = (d: Date | null) => (d ? dateFormatter.format(d) : '—');

const daysBetween = (from: Date, to: Date): number => {
    const ms = to.getTime() - from.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
};

function buildExpiredMeta(item: StockCatalogItem): { label: string; value: React.ReactNode }[] {
    return [
        {
            label: 'Périmé depuis le',
            value: <b style={{ color: '#b91c1c' }}>{formatDateMaybe(item.datePeremption)}</b>,
        },
        ...(item.quantite !== null && item.unite
            ? [{ label: 'Quantité', value: `${item.quantite} ${item.unite}` }]
            : []),
        ...(formatLocation(item) !== '—' ? [{ label: 'Emplacement', value: formatLocation(item) }] : []),
    ];
}

function buildExpiringSoonMeta(
    item: StockCatalogItem,
    today: Date,
): { label: string; value: React.ReactNode }[] {
    const days = item.datePeremption ? Math.max(0, daysBetween(today, item.datePeremption)) : null;
    return [
        {
            label: 'Péremption le',
            value: (
                <>
                    <b style={{ color: '#b45309' }}>{formatDateMaybe(item.datePeremption)}</b>
                    {days !== null && <> · dans <b>{days} jours</b></>}
                </>
            ),
        },
        ...(item.quantite !== null && item.unite
            ? [{ label: 'Quantité', value: `${item.quantite} ${item.unite}` }]
            : []),
    ];
}

function buildLowStockMeta(item: StockCatalogItem): { label: string; value: React.ReactNode }[] {
    return [
        {
            label: 'Stock actuel',
            value: (
                <b style={{ color: '#1d4ed8' }}>
                    {item.quantite ?? 0} {item.unite ?? ''}
                </b>
            ),
        },
        ...(item.seuilAlerte !== null && item.unite
            ? [{ label: "Seuil d'alerte", value: `${item.seuilAlerte} ${item.unite}` }]
            : []),
        ...(item.fournisseur ? [{ label: 'Fournisseur', value: item.fournisseur }] : []),
    ];
}

function AlertsLoadingSkeleton() {
    return (
        <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} variant="rounded" height={86} />
                ))}
            </Box>
            {Array.from({ length: 2 }, (_, i) => (
                <Skeleton key={i} variant="rounded" height={140} />
            ))}
        </Stack>
    );
}

export function AlertsTab() {
    const { data: alerts, isLoading, error } = useStockAlerts();
    const openEditModal = useEditItemStore((s) => s.open);

    const today = useMemo(() => new Date(), []);

    if (isLoading) return <AlertsLoadingSkeleton />;
    if (error) {
        return (
            <Alert severity="error" role="alert">
                Erreur lors du chargement des alertes :{' '}
                {error instanceof Error ? error.message : 'inconnue'}
            </Alert>
        );
    }
    if (!alerts) return null;

    const totalAlerts = alerts.expired.length + alerts.expiringSoon.length + alerts.lowStock.length;
    if (totalAlerts === 0) {
        return (
            <Alert severity="success" variant="outlined">
                Aucune alerte active. Tous les consommables sont sous seuil et les dates de péremption sont
                respectées.
            </Alert>
        );
    }

    return (
        <Box>
            {/* Compteurs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                <AlertCounterCard
                    label="Consommables périmés"
                    count={alerts.expired.length}
                    accentColor="#ef4444"
                    countColor="#b91c1c"
                />
                <AlertCounterCard
                    label="Péremption < 30 jours"
                    count={alerts.expiringSoon.length}
                    accentColor="#f59e0b"
                    countColor="#b45309"
                />
                <AlertCounterCard
                    label="Stock bas"
                    count={alerts.lowStock.length}
                    accentColor="#2563eb"
                    countColor="#1d4ed8"
                />
            </Box>

            {/* Sections */}
            {alerts.expired.length > 0 && (
                <AlertSection
                    title="Consommables périmés"
                    severity="danger"
                    count={alerts.expired.length}
                    icon={<ErrorOutlineIcon fontSize="small" />}
                >
                    {alerts.expired.map((item) => (
                        <AlertRow
                            key={item.uuid}
                            item={item}
                            metadata={buildExpiredMeta(item)}
                            onClick={() => openEditModal(item.uuid)}
                        />
                    ))}
                </AlertSection>
            )}

            {alerts.expiringSoon.length > 0 && (
                <AlertSection
                    title="Péremption proche (sous 30 jours)"
                    severity="warning"
                    count={alerts.expiringSoon.length}
                    icon={<WarningAmberIcon fontSize="small" />}
                >
                    {alerts.expiringSoon.map((item) => (
                        <AlertRow
                            key={item.uuid}
                            item={item}
                            metadata={buildExpiringSoonMeta(item, today)}
                            onClick={() => openEditModal(item.uuid)}
                        />
                    ))}
                </AlertSection>
            )}

            {alerts.lowStock.length > 0 && (
                <AlertSection
                    title="Stock bas (sous seuil d'alerte)"
                    severity="info"
                    count={alerts.lowStock.length}
                    icon={<EqualizerIcon fontSize="small" />}
                >
                    {alerts.lowStock.map((item) => (
                        <AlertRow
                            key={item.uuid}
                            item={item}
                            metadata={buildLowStockMeta(item)}
                            onClick={() => openEditModal(item.uuid)}
                        />
                    ))}
                </AlertSection>
            )}

            <EditItemModal />
        </Box>
    );
}
