/**
 * Campaign Details Layout
 * @module pages/campaign-details
 *
 * Main layout for campaign details with tabbed navigation.
 * Uses React Router for tab routing and memoization for performance.
 */

import { memo, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Box, Container, Alert, Skeleton, Stack } from '@mui/material';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { useCampaign } from '@entities/campaign';
import { CampaignHeader } from '@features/campaign/campaign-header';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { RoutedTabs, TabItem } from '@widgets/routed-tabs';
import { CampaignOverviewPage } from './overview';
import { CampaignDocumentsPage } from './documents';
import { CampaignFsecsPage } from './fsecs';
import { CampaignFasPage } from './fas';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TABS: TabItem[] = [
    { path: 'overview', label: "Vue d'ensemble" },
    { path: 'documents', label: 'Documents' },
    { path: 'fsec', label: 'FSEC' },
    { path: 'fa', label: 'FA' },
] as const;

type TabPath = 'overview' | 'documents' | 'fsec' | 'fa';

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────────────────────────

const CampaignDetailsSkeleton = memo(function CampaignDetailsSkeleton() {
    return (
        <Container maxWidth={false} sx={{ py: 3 }}>
            <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
            <Skeleton variant="rounded" height={48} width={300} sx={{ mb: 3 }} />
            <Stack spacing={3}>
                <Skeleton variant="rounded" height={200} />
                <Skeleton variant="rounded" height={150} />
            </Stack>
        </Container>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Extract active tab from pathname
// ─────────────────────────────────────────────────────────────────────────────

function getActiveTab(pathname: string): TabPath {
    if (pathname.includes('/documents')) return 'documents';
    if (pathname.includes('/fsec')) return 'fsec';
    if (pathname.includes('/fa')) return 'fa';
    return 'overview';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

function CampaignDetailsPage() {
    const { campaignUuid = '' } = useParams<{ campaignUuid: string }>();
    const location = useLocation();

    // Fetch campaign details
    const { data: campaign, isLoading, error, isError } = useCampaign(campaignUuid);

    // Memoize active tab to prevent unnecessary re-renders
    const activeTab = useMemo(() => getActiveTab(location.pathname), [location.pathname]);

    // Memoize tab content to avoid re-creation
    const tabContent = useMemo(() => {
        if (!campaign) return null;

        switch (activeTab) {
            case 'overview':
                return (
                    <ErrorBoundary compact sectionName="Vue d'ensemble">
                        <CampaignOverviewPage campaign={campaign} />
                    </ErrorBoundary>
                );
            case 'documents':
                return (
                    <ErrorBoundary compact sectionName="Documents">
                        <CampaignDocumentsPage campaign={campaign} />
                    </ErrorBoundary>
                );
            case 'fsec':
                return (
                    <ErrorBoundary compact sectionName="FSEC">
                        <CampaignFsecsPage campaign={campaign} />
                    </ErrorBoundary>
                );
            case 'fa':
                return (
                    <ErrorBoundary compact sectionName="FA">
                        <CampaignFasPage campaign={campaign} />
                    </ErrorBoundary>
                );
            default:
                return null;
        }
    }, [campaign, activeTab]);

    // Loading state with skeleton
    if (isLoading) {
        return <CampaignDetailsSkeleton />;
    }

    // Error state
    if (isError || !campaign) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" role="alert">
                    Erreur lors du chargement de la campagne:{' '}
                    {error instanceof Error ? error.message : 'Campagne introuvable'}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ py: 3 }}>
            {/* Header */}
            <CampaignHeader campaign={campaign} />

            {/* Tabs Navigation */}
            <Box component="nav" aria-label="Navigation campagne" sx={{ mt: 3 }}>
                <RoutedTabs tabs={TABS} baseUrl={`/campagne-details/${campaignUuid}`} />
            </Box>

            {/* Tab Content */}
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <ErrorBoundary compact onReset={reset}>
                        <Box component="main" role="tabpanel" aria-label={`Onglet ${activeTab}`} sx={{ mt: 3 }}>
                            {tabContent}
                        </Box>
                    </ErrorBoundary>
                )}
            </QueryErrorResetBoundary>
        </Container>
    );
}

export default memo(CampaignDetailsPage);
