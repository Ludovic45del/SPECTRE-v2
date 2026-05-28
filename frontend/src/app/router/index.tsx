/**
 * App Router - Lazy-loaded routes with authentication
 * @module app/router
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { MainLayout } from '../layouts';
import { useAuthStore } from '@features/auth';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { pageLoaders } from './prefetch';

// Lazy-loaded pages (loaders shared with the hover-prefetch map, see ./prefetch)
const LoginPage = lazy(pageLoaders.login);
const SetInitialPasswordPage = lazy(pageLoaders.setInitialPassword);
const HomePage = lazy(pageLoaders.home);
const AdminUsersPage = lazy(pageLoaders.adminUsers);
const ChangePasswordPage = lazy(pageLoaders.changePassword);
const CampaignsPage = lazy(pageLoaders.campaigns);
const CampaignDetailsPage = lazy(pageLoaders.campaignDetails);
const FsecsPage = lazy(pageLoaders.fsecs);
const FsecDetailsPage = lazy(pageLoaders.fsecDetails);
const FasPage = lazy(pageLoaders.fas);
const FaDetailsPage = lazy(pageLoaders.faDetails);
const EmbasesPage = lazy(pageLoaders.embases);
const EmbaseDetailsPage = lazy(pageLoaders.embaseDetails);
const PlanningPage = lazy(pageLoaders.planning);
const IndicateursFaPage = lazy(pageLoaders.indicateursFa);
const IndicateursFsecPage = lazy(pageLoaders.indicateursFsec);
const StockPage = lazy(pageLoaders.stock);
const MaterielPage = lazy(pageLoaders.materiel);
const MaterielMachinesView = lazy(pageLoaders.materielMachines);

// Minimal loader for login page Suspense
function LoginLoader() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
}

// QueryErrorResetBoundary + ErrorBoundary wrapper
function QuerySafeErrorBoundary({ sectionName, children }: { sectionName: string; children: React.ReactNode }) {
    return (
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <ErrorBoundary onReset={reset} sectionName={sectionName}>
                    {children}
                </ErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const tokens = useAuthStore((state) => state.tokens);
    const forcePasswordChange = useAuthStore((state) => state.forcePasswordChange);
    const location = useLocation();

    // If store says authenticated but tokens are missing/invalid, force logout
    if (!isAuthenticated || !tokens?.access || !tokens?.refresh) {
        return <Navigate to="/login" replace />;
    }

    // Force password change redirect
    if (forcePasswordChange && location.pathname !== '/changer-mot-de-passe') {
        return <Navigate to="/changer-mot-de-passe" replace />;
    }

    return <>{children}</>;
}

// Public Route wrapper (redirect to home if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export const router = createBrowserRouter([
    {
        path: '/login',
        element: (
            <PublicRoute>
                <Suspense fallback={<LoginLoader />}>
                    <LoginPage />
                </Suspense>
            </PublicRoute>
        ),
    },
    {
        path: '/auth/set-initial-password',
        element: (
            <Suspense fallback={<LoginLoader />}>
                <SetInitialPasswordPage />
            </Suspense>
        ),
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: (
                    <QuerySafeErrorBoundary sectionName="Accueil">
                        <HomePage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'campagnes',
                element: (
                    <QuerySafeErrorBoundary sectionName="Campagnes">
                        <CampaignsPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'campagne-details/:campaignUuid/*',
                element: (
                    <QuerySafeErrorBoundary sectionName="Détails campagne">
                        <CampaignDetailsPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'fsecs',
                element: (
                    <QuerySafeErrorBoundary sectionName="FSECs">
                        <FsecsPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'fsec-details/:versionUuid/*',
                element: (
                    <QuerySafeErrorBoundary sectionName="Détails FSEC">
                        <FsecDetailsPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'fas',
                element: (
                    <QuerySafeErrorBoundary sectionName="Fiches d'Anomalie">
                        <FasPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'fa-details/:uuid/*',
                element: (
                    <QuerySafeErrorBoundary sectionName="Détails FA">
                        <FaDetailsPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'embases',
                element: (
                    <QuerySafeErrorBoundary sectionName="Embases">
                        <EmbasesPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'embase-details/:uuid/*',
                element: (
                    <QuerySafeErrorBoundary sectionName="Détails Embase">
                        <EmbaseDetailsPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'planning',
                element: (
                    <QuerySafeErrorBoundary sectionName="Planning">
                        <PlanningPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'indicateurs',
                element: <Navigate to="/indicateurs/fa" replace />,
            },
            {
                path: 'indicateurs/fa',
                element: (
                    <QuerySafeErrorBoundary sectionName="Indicateurs FA">
                        <IndicateursFaPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'indicateurs/fsec',
                element: (
                    <QuerySafeErrorBoundary sectionName="Indicateurs FSEC">
                        <IndicateursFsecPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'stock/*',
                element: (
                    <QuerySafeErrorBoundary sectionName="Stock">
                        <StockPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'materiel',
                element: (
                    <QuerySafeErrorBoundary sectionName="Matériel">
                        <MaterielPage />
                    </QuerySafeErrorBoundary>
                ),
                children: [{ index: true, element: <MaterielMachinesView /> }],
            },
            {
                path: 'admin/utilisateurs',
                element: (
                    <QuerySafeErrorBoundary sectionName="Administration">
                        <AdminUsersPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: 'changer-mot-de-passe',
                element: (
                    <QuerySafeErrorBoundary sectionName="Changement de mot de passe">
                        <ChangePasswordPage />
                    </QuerySafeErrorBoundary>
                ),
            },
            {
                path: '*',
                element: <Navigate to="/" replace />,
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/login" replace />,
    },
]);
