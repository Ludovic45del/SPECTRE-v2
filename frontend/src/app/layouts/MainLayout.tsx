/**
 * Main Layout Component
 * @module app/layouts
 *
 * Sidebar pinned (clic sur le logo CEA pour basculer), avec une transition
 * d'entrée discrète (`pageEnter`) sur le contenu de page à chaque
 * changement de SECTION top-level — pas à chaque changement d'onglet
 * interne d'une page détail (sinon le header re-flash sous l'animation
 * et l'effet est désagréable). Les rubriques internes utilisent leur
 * propre `<RouteTransition>` plus localisé.
 */

import { Suspense, memo, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Sidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED, useSidebarStore } from '@widgets/sidebar';
import type { SidebarUserInfo } from '@widgets/sidebar';
import { useMe, ROLE_LABELS } from '@entities/user';
import { motionDuration, motionEasing } from '@shared/ui/motion';

// Fallback Suspense — discret (pas de spinner intrusif quand le code-split
// arrive en quelques ms). Affiche un cercle uniquement après 200 ms via
// `animation-delay`, ce qui couvre la majorité des cas sans flash visuel.
const PageLoader = memo(function PageLoader() {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                opacity: 0,
                animation: `pl-fade ${motionDuration.base}ms ${motionEasing.decelerate} 200ms forwards`,
                '@keyframes pl-fade': {
                    to: { opacity: 1 },
                },
            }}
        >
            <CircularProgress size={28} thickness={4} />
        </Box>
    );
});

// Sections où le 1er segment d'URL identifie une page détail (`fsec-details/:uuid`,
// `campagne-details/:uuid`, etc.). Pour ces routes, la clé d'animation est
// figée sur les 2 premiers segments → changer d'onglet (`/overview` → `/assemblage`)
// ne déclenche PAS le pageEnter global, seul `<RouteTransition>` interne joue.
const DETAIL_SECTIONS = new Set(['fsec-details', 'campagne-details', 'fa-details', 'embase-details', 'stock']);

function getSectionKey(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return '/';
    if (segments.length >= 2 && DETAIL_SECTIONS.has(segments[0])) {
        return `/${segments[0]}/${segments[1]}`;
    }
    return pathname;
}

function MainLayoutComponent() {
    const location = useLocation();
    const isOpen = useSidebarStore((state) => state.isOpen);
    const marginLeft = isOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
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
                    transition: `margin-left ${motionDuration.medium}ms ${motionEasing.standard}`,
                    '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                    },
                    contain: 'layout style',
                }}
            >
                <Suspense fallback={<PageLoader />}>
                    {/*
                     * `key={getSectionKey(...)}` force un remount du wrapper
                     * uniquement à chaque changement de SECTION top-level
                     * (pas à chaque sous-route d'une page détail). Sinon le
                     * header de la page (FSEC, Campagne, FA, Embase) re-flashait
                     * en même temps que le contenu d'onglet → animation
                     * imperceptible et désagréable. Les rubriques internes
                     * sont animées par <RouteTransition>.
                     */}
                    <Box
                        key={getSectionKey(location.pathname)}
                        sx={{
                            animation: `pageEnter ${motionDuration.medium}ms ${motionEasing.apple} both`,
                            willChange: 'opacity, transform',
                            '@keyframes pageEnter': {
                                '0%': { opacity: 0, transform: 'translateY(8px)' },
                                '100%': { opacity: 1, transform: 'translateY(0)' },
                            },
                            '@media (prefers-reduced-motion: reduce)': {
                                animation: 'none',
                            },
                        }}
                    >
                        <Outlet />
                    </Box>
                </Suspense>
            </Box>
        </Box>
    );
}

export const MainLayout = memo(MainLayoutComponent);
