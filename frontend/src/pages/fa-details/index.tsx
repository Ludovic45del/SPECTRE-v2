/**
 * FA Details Page - Fiche d'Anomalie
 * @module pages/fa-details
 *
 * Tabbed layout aligned with FSEC Details: Phase 1 and Phases 2 & 3
 */

import { Box, Container, CircularProgress, Alert } from '@mui/material';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { useParams, useLocation } from 'react-router-dom';
import { useFa } from '@entities/fa';
import { FaHeader } from '@features/fa';
import { RouteTransition } from '@shared/ui/RouteTransition';
import { RoutedTabs, TabItem } from '@widgets/routed-tabs';
import { Phase1Tab } from './tabs/Phase1Tab';
import { Phase23Tab } from './tabs/Phase23Tab';
import 'dayjs/locale/fr';

// ============================================================================
// Constants
// ============================================================================

const FA_TABS: TabItem[] = [
    { path: 'phase1', label: 'Phase 1 - Ouvert' },
    { path: 'phase23', label: 'Phases 2 & 3' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function FaDetailsPage() {
    const { uuid = '' } = useParams<{ uuid: string }>();
    const location = useLocation();

    const { data: fa, isLoading, error } = useFa(uuid);

    // Loading state
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    // Error state
    if (error || !fa) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">
                    Erreur lors du chargement de la FA: {error instanceof Error ? error.message : 'FA introuvable'}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ py: 3 }}>
            {/* Header */}
            <FaHeader fa={fa} />

            {/* Tab bar */}
            <Box sx={{ mt: 3 }}>
                <RoutedTabs tabs={FA_TABS} baseUrl={`/fa-details/${uuid}`} />
            </Box>

            {/* Tab content */}
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <RouteTransition>
                        <Box sx={{ mt: 3 }}>
                            {(location.pathname.includes('/phase1') || location.pathname.endsWith(uuid)) && (
                                <Phase1Tab fa={fa} onReset={reset} />
                            )}
                            {location.pathname.includes('/phase23') && <Phase23Tab fa={fa} onReset={reset} />}
                        </Box>
                    </RouteTransition>
                )}
            </QueryErrorResetBoundary>
        </Container>
    );
}
