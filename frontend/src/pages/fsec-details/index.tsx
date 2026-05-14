/**
 * FSEC Details Page
 * @module pages/fsec-details
 *
 * Style: Aligned with CampaignDetailsPage
 */

import { useMemo } from 'react';
import { Box, Container, CircularProgress, Alert } from '@mui/material';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { useParams, useLocation } from 'react-router-dom';
import { useFsec } from '@entities/fsec';
import { ErrorBoundary, RouteTransition } from '@shared/ui';
import { useCampaignTeam } from '@entities/campaign/team';
import { useFsecDocumentsByFsec } from '@entities/fsec/document';
import { RoutedTabs, TabItem } from '@widgets/routed-tabs';
import { FsecHeader } from '@features/fsec/fsec-header';
import { OverviewTab } from './tabs/OverviewTab';
import { AssemblyTab } from './tabs/AssemblyTab';
import { ControleTab } from './tabs/ControleTab';
import { PicturesTab } from './tabs/PicturesTab';
import { GasStepsTab } from './tabs/GasStepsTab';
import { ResultsTab } from './tabs/ResultsTab';
import 'dayjs/locale/fr';

const BASE_TABS: TabItem[] = [
    { path: 'overview', label: "Vue d'ensemble" },
    { path: 'assemblage', label: 'Assemblage' },
    { path: 'controle', label: 'Contrôle métrologique' },
    { path: 'photos', label: 'Vue/Photo' },
];

const GAS_TAB: TabItem = { path: 'gaz', label: 'Gaz' };
const RESULTS_TAB: TabItem = { path: 'resultats', label: 'Alignement/Livraison/Résultats' };

function getTabs(categoryId: number | null | undefined): TabItem[] {
    const hasGas = categoryId != null && categoryId !== 0;
    return hasGas ? [...BASE_TABS, GAS_TAB, RESULTS_TAB] : [...BASE_TABS, RESULTS_TAB];
}

export default function FsecDetailsPage() {
    const { versionUuid = '' } = useParams<{ versionUuid: string }>();
    const location = useLocation();

    const { data: fsec, isLoading, error } = useFsec(versionUuid);
    const { data: campaignTeam } = useCampaignTeam(fsec?.campaignId ?? '');
    const { data: documents } = useFsecDocumentsByFsec(versionUuid);

    const tabs = useMemo(() => getTabs(fsec?.categoryId ?? null), [fsec?.categoryId]);
    const hasGas = fsec?.categoryId != null && fsec?.categoryId !== 0;

    // Guard clause AFTER all hooks (React Rules of Hooks)
    if (!versionUuid) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">Identifiant FSEC manquant dans l'URL</Alert>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !fsec) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">
                    Erreur lors du chargement du FSEC: {error instanceof Error ? error.message : 'FSEC introuvable'}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ py: 3 }}>
            {/* Header */}
            <FsecHeader fsec={fsec} />

            {/* Tabs */}
            <Box sx={{ mt: 3 }}>
                <RoutedTabs tabs={tabs} baseUrl={`/fsec-details/${versionUuid}`} />
            </Box>

            {/* Content - EB-1 fix: each tab wrapped in ErrorBoundary */}
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <RouteTransition>
                        <Box sx={{ mt: 3 }}>
                            {(location.pathname.includes('/overview') || location.pathname.endsWith(versionUuid)) && (
                                <ErrorBoundary compact onReset={reset}>
                                    <OverviewTab fsec={fsec} campaignTeam={campaignTeam} documents={documents} />
                                </ErrorBoundary>
                            )}
                            {location.pathname.includes('/assemblage') && (
                                <ErrorBoundary compact onReset={reset}>
                                    <AssemblyTab
                                        fsecVersionId={versionUuid}
                                        fsecUuid={fsec.fsecUuid}
                                        fsecStatusId={fsec.statusId ?? 0}
                                    />
                                </ErrorBoundary>
                            )}
                            {location.pathname.includes('/controle') && (
                                <ErrorBoundary compact onReset={reset}>
                                    <ControleTab fsecVersionId={versionUuid} />
                                </ErrorBoundary>
                            )}
                            {location.pathname.includes('/photos') && (
                                <ErrorBoundary compact onReset={reset}>
                                    <PicturesTab fsecVersionId={versionUuid} />
                                </ErrorBoundary>
                            )}
                            {hasGas && location.pathname.includes('/gaz') && (
                                <ErrorBoundary compact onReset={reset}>
                                    <GasStepsTab fsecVersionId={versionUuid} categoryId={fsec.categoryId} />
                                </ErrorBoundary>
                            )}
                            {location.pathname.includes('/resultats') && (
                                <ErrorBoundary compact onReset={reset}>
                                    <ResultsTab fsec={fsec} />
                                </ErrorBoundary>
                            )}
                        </Box>
                    </RouteTransition>
                )}
            </QueryErrorResetBoundary>
        </Container>
    );
}
