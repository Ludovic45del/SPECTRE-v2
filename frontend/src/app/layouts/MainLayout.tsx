/**
 * Main Layout Component
 * @module app/layouts
 *
 * Optimized layout with collapsible sidebar
 */

import { Suspense, memo, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Sidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED, useSidebarStore } from '@widgets/sidebar';
import type { SidebarUserInfo } from '@widgets/sidebar';
import { useAuthStore } from '@features/auth';
import { useMe, ROLE_LABELS } from '@entities/user';
import { SplashScreen } from '@shared/ui/SplashScreen';

const PageLoader = memo(function PageLoader() {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
            }}
        >
            <CircularProgress />
        </Box>
    );
});

function MainLayoutComponent() {
    const isOpen = useSidebarStore((state) => state.isOpen);
    const marginLeft = isOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
    const showSplash = useAuthStore((s) => s.showSplash);
    const clearSplash = useAuthStore((s) => s.clearSplash);
    const { data: meData } = useMe();

    const sidebarUser = useMemo<SidebarUserInfo | undefined>(
        () =>
            meData
                ? {
                      username: meData.username,
                      firstName: meData.firstName,
                      lastName: meData.lastName,
                      role: meData.role,
                  }
                : undefined,
        [meData],
    );

    const handleSplashComplete = useCallback(() => {
        clearSplash();
    }, [clearSplash]);

    if (showSplash) {
        return <SplashScreen onComplete={handleSplashComplete} />;
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Box
                component="a"
                href="#main-content"
                sx={{
                    position: 'absolute',
                    left: '-9999px',
                    top: 'auto',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    '&:focus': {
                        position: 'fixed',
                        top: 8,
                        left: 8,
                        width: 'auto',
                        height: 'auto',
                        overflow: 'visible',
                        zIndex: 9999,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                    },
                }}
            >
                Aller au contenu principal
            </Box>
            <Sidebar user={sidebarUser} roleLabels={ROLE_LABELS} />
            <Box
                id="main-content"
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: `${marginLeft}px`,
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                    },
                    contain: 'layout style',
                }}
            >
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </Box>
        </Box>
    );
}

export const MainLayout = memo(MainLayoutComponent);
