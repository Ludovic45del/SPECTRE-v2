/**
 * Embase Details Page
 * @module pages/embase-details
 *
 * Style: Aligned with FsecDetailsPage
 * Layout with 5 tabs: Voie V1, Mécanique, Voie V2, Étalonnage, Historique FSECs
 * Inline editing on Voie V1, Mécanique, Voie V2 tabs
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Box, Container, Alert, CircularProgress } from '@mui/material';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { useEmbase, useUpdateEmbase, embaseToCreateForm } from '@entities/embase';
import { type EmbaseCreate } from '@entities/embase';
import { EmbaseHeader } from '@features/embase/embase-header';
import {
    CreateEmbaseModal,
    EtalonnageTab,
    EtalonnageFormDialog,
    VoieV1Tab,
    MecaniqueTab,
    VoieV2Tab,
} from '@features/embase';
import { RoutedTabs } from '@widgets/routed-tabs';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { RouteTransition } from '@shared/ui/RouteTransition';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib';
import { TABS_1_VOIE, TABS_2_VOIES, getActiveTab } from './constants';
import { HistoriqueFsecTab, ComparisonDialog } from './components';

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

function EmbaseDetailsPage() {
    const { uuid = '' } = useParams<{ uuid: string }>();
    const location = useLocation();
    const { showSuccess, showError } = useNotification();

    const { data: embase, isLoading, error, isError } = useEmbase(uuid);
    const updateMutation = useUpdateEmbase();
    const [showComparison, setShowComparison] = useState(false);
    const [etalFormOpen, setEtalFormOpen] = useState(false);
    const [etalFormVoie, setEtalFormVoie] = useState<1 | 2>(1);

    const activeTab = useMemo(() => getActiveTab(location.pathname), [location.pathname]);

    const handleOpenComparison = useCallback(() => setShowComparison(true), []);
    const handleCloseComparison = useCallback(() => setShowComparison(false), []);

    const handleAddEtalonnage = useCallback((voie: 1 | 2) => {
        setEtalFormVoie(voie);
        setEtalFormOpen(true);
    }, []);
    const handleCloseEtalForm = useCallback(() => setEtalFormOpen(false), []);

    const handleSave = useCallback(
        async (overrides: Partial<EmbaseCreate>) => {
            if (!embase) return;
            try {
                await updateMutation.mutateAsync({
                    uuid: embase.uuid,
                    data: embaseToCreateForm(embase, overrides),
                });
                showSuccess('Embase mise à jour');
            } catch (err) {
                showError(getErrorMessage(err, 'Erreur lors de la mise à jour'));
            }
        },
        [embase, updateMutation, showSuccess, showError],
    );

    const tabContent = useMemo(() => {
        if (!embase) return null;

        switch (activeTab) {
            case 'voie-v1':
                return (
                    <ErrorBoundary compact sectionName="Voie V1">
                        <VoieV1Tab embase={embase} onSave={handleSave} isPending={updateMutation.isPending} />
                    </ErrorBoundary>
                );
            case 'mecanique':
                return (
                    <ErrorBoundary compact sectionName="Mécanique">
                        <MecaniqueTab embase={embase} onSave={handleSave} isPending={updateMutation.isPending} />
                    </ErrorBoundary>
                );
            case 'voie-v2':
                return (
                    <ErrorBoundary compact sectionName="Voie V2">
                        <VoieV2Tab embase={embase} onSave={handleSave} isPending={updateMutation.isPending} />
                    </ErrorBoundary>
                );
            case 'etalonnage':
                return (
                    <ErrorBoundary compact sectionName="Étalonnage">
                        <EtalonnageTab embaseUuid={embase.uuid} nombreVoies={embase.nombreVoies as 1 | 2} />
                    </ErrorBoundary>
                );
            case 'historique-fsec':
                return (
                    <ErrorBoundary compact sectionName="Historique FSEC">
                        <HistoriqueFsecTab embase={embase} />
                    </ErrorBoundary>
                );
            default:
                return (
                    <ErrorBoundary compact sectionName="Voie V1">
                        <VoieV1Tab embase={embase} onSave={handleSave} isPending={updateMutation.isPending} />
                    </ErrorBoundary>
                );
        }
    }, [embase, activeTab, handleSave, updateMutation.isPending]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !embase) {
        return (
            <Container maxWidth={false} sx={{ py: 3 }}>
                <Alert severity="error">{error?.message || 'Embase non trouvée'}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ py: 3 }}>
            <EmbaseHeader
                embase={embase}
                onCompare={embase.nombreVoies === 2 ? handleOpenComparison : undefined}
                onAddEtalonnage={handleAddEtalonnage}
            />

            <ComparisonDialog open={showComparison} onClose={handleCloseComparison} embase={embase} />

            <Box sx={{ mt: 3 }}>
                <RoutedTabs
                    tabs={embase.nombreVoies === 2 ? TABS_2_VOIES : TABS_1_VOIE}
                    baseUrl={`/embase-details/${uuid}`}
                />
            </Box>

            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <ErrorBoundary compact onReset={reset}>
                        <RouteTransition>
                            <Box sx={{ mt: 3 }}>{tabContent}</Box>
                        </RouteTransition>
                    </ErrorBoundary>
                )}
            </QueryErrorResetBoundary>

            <EtalonnageFormDialog
                open={etalFormOpen}
                onClose={handleCloseEtalForm}
                embaseUuid={uuid}
                voie={etalFormVoie}
            />

            <CreateEmbaseModal />
        </Container>
    );
}

export default memo(EmbaseDetailsPage);
