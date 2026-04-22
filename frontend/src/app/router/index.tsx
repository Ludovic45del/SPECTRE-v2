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

// Lazy-loaded pages
const LoginPage = lazy(() => import('@pages/login'));
const SetInitialPasswordPage = lazy(() => import('@pages/set-initial-password'));
const HomePage = lazy(() => import('@pages/home'));
const AdminUsersPage = lazy(() => import('@pages/admin/users'));
const ChangePasswordPage = lazy(() => import('@pages/change-password'));
const CampaignsPage = lazy(() => import('@pages/campaigns'));
const CampaignDetailsPage = lazy(() => import('@pages/campaign-details'));
const FsecsPage = lazy(() => import('@pages/fsecs'));
const FsecDetailsPage = lazy(() => import('@pages/fsec-details'));
const FasPage = lazy(() => import('@pages/fas'));
const FaDetailsPage = lazy(() => import('@pages/fa-details'));
const EmbasesPage = lazy(() => import('@pages/embases'));
const EmbaseDetailsPage = lazy(() => import('@pages/embase-details'));
const PlanningPage = lazy(() => import('@pages/planning'));

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
