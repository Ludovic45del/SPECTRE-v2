/**
 * Sidebar Navigation Component
 * @module widgets/sidebar
 */

import { memo, useCallback, useMemo, useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Tooltip,
    type SxProps,
    type Theme,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useSidebarStore } from './sidebar.store';
import { useThemeStore } from '@shared/lib/theme.store';
import { useAuthStore } from '@features/auth';
import { useStockAlerts } from '@entities/stock-item';
import { queryClient } from '@shared/lib/query-client';
import { motion } from '@shared/ui/motion';
import CEALogo from '@shared/assets/images/CEALogo.png';

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_CLOSED = 64;
const ICON_SIZE = 28;
const NAV_ITEM_HEIGHT = 44;
const NAV_ITEM_GAP = 4; // mb: 0.5 = 4px

// Aliases vers les tokens motion. `TRANSITION` = micro-interactions (hover,
// color), `TRANSITION_SPRING` = indicateur coulissant (overshoot doux).
const TRANSITION = motion.base;
const TRANSITION_SPRING = motion.spring;

const COLORS = {
    brand: '#E31837',
    iconInactive: 'primary.light',
    iconActive: 'primary.main',
    glowActive: 'rgba(25, 118, 210, 0.4)',
} as const;

// ============================================================================
// Utilities
// ============================================================================

const getIconColor = (isActive?: boolean) => (isActive ? COLORS.iconActive : COLORS.iconInactive);

const circleIconStyles: SxProps<Theme> = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

// ============================================================================
// Icon Components
// ============================================================================

interface CircleIconProps {
    isActive?: boolean;
    children: ReactNode;
}

const CircleIcon = memo(function CircleIcon({ isActive, children }: CircleIconProps) {
    return (
        <Box
            sx={{
                ...circleIconStyles,
                borderColor: getIconColor(isActive),
                transition: `all ${TRANSITION_SPRING}`,
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isActive ? `0 0 20px ${COLORS.glowActive}` : 'none',
            }}
        >
            {children}
        </Box>
    );
});

interface TextCircleIconProps {
    isActive?: boolean;
    label: string;
    fontSize?: string;
    letterSpacing?: string;
}

const TextCircleIcon = memo(function TextCircleIcon({
    isActive,
    label,
    fontSize = '0.9rem',
    letterSpacing,
}: TextCircleIconProps) {
    return (
        <CircleIcon isActive={isActive}>
            <Typography
                sx={{
                    color: getIconColor(isActive),
                    fontSize,
                    fontWeight: 700,
                    letterSpacing,
                    transition: `color ${TRANSITION}`,
                }}
            >
                {label}
            </Typography>
        </CircleIcon>
    );
});

const HomeCircleIcon = memo(function HomeCircleIcon({ isActive }: { isActive?: boolean }) {
    return (
        <CircleIcon isActive={isActive}>
            <HomeIcon
                sx={{
                    color: getIconColor(isActive),
                    fontSize: '1rem',
                    transition: `color ${TRANSITION}`,
                }}
            />
        </CircleIcon>
    );
});

const StockCircleIcon = memo(function StockCircleIcon({ isActive }: { isActive?: boolean }) {
    return (
        <CircleIcon isActive={isActive}>
            <Inventory2Icon
                sx={{
                    color: getIconColor(isActive),
                    fontSize: '0.95rem',
                    transition: `color ${TRANSITION}`,
                }}
            />
        </CircleIcon>
    );
});

const MaterielCircleIcon = memo(function MaterielCircleIcon({ isActive }: { isActive?: boolean }) {
    return (
        <CircleIcon isActive={isActive}>
            <PrecisionManufacturingIcon
                sx={{
                    color: getIconColor(isActive),
                    fontSize: '0.95rem',
                    transition: `color ${TRANSITION}`,
                }}
            />
        </CircleIcon>
    );
});

const AdminCircleIcon = memo(function AdminCircleIcon({ isActive }: { isActive?: boolean }) {
    return (
        <CircleIcon isActive={isActive}>
            <AdminPanelSettingsIcon
                sx={{
                    color: getIconColor(isActive),
                    fontSize: '1rem',
                    transition: `color ${TRANSITION}`,
                }}
            />
        </CircleIcon>
    );
});

// ============================================================================
// Navigation Configuration
// ============================================================================

interface NavSubItem {
    path: string;
    label: string;
    /** Badge de notification (compteur affiché à droite). 0 ou undefined → pas de badge. */
    badgeCount?: number;
}

interface NavItem {
    path: string;
    label: string;
    icon: (isActive: boolean) => ReactNode;
    /** Sous-items affichés en dépliant l'entrée quand sa section est active. */
    children?: NavSubItem[];
}

/** Élément aplati pour le rendu (parent OU enfant), 1 ligne = 1 entrée. */
type FlatNavItem = ({ kind: 'parent' } & NavItem) | ({ kind: 'child' } & NavSubItem);

const BASE_NAV_ITEMS: NavItem[] = [
    { path: '/', label: 'Accueil', icon: (isActive) => <HomeCircleIcon isActive={isActive} /> },
    { path: '/campagnes', label: 'Campagnes', icon: (isActive) => <TextCircleIcon isActive={isActive} label="C" /> },
    {
        path: '/fsecs',
        label: 'FSEC',
        icon: (isActive) => (
            <TextCircleIcon isActive={isActive} label="Fsec" fontSize="0.55rem" letterSpacing="-0.3px" />
        ),
    },
    {
        path: '/fas',
        label: "Fiches d'Anomalie",
        icon: (isActive) => <TextCircleIcon isActive={isActive} label="FA" fontSize="0.7rem" />,
    },
    { path: '/embases', label: 'Embases', icon: (isActive) => <TextCircleIcon isActive={isActive} label="E" /> },
    { path: '/planning', label: 'Planning', icon: (isActive) => <TextCircleIcon isActive={isActive} label="P" /> },
    {
        path: '/indicateurs',
        label: 'Indicateurs',
        icon: (isActive) => <TextCircleIcon isActive={isActive} label="KPI" fontSize="0.55rem" letterSpacing="-0.3px" />,
        children: [
            { path: '/indicateurs/fa', label: 'FA' },
            { path: '/indicateurs/fsec', label: 'FSEC' },
        ],
    },
    {
        path: '/materiel',
        label: 'Matériel',
        icon: (isActive) => <MaterielCircleIcon isActive={isActive} />,
    },
    {
        path: '/stock',
        label: 'Stock',
        icon: (isActive) => <StockCircleIcon isActive={isActive} />,
        children: [
            { path: '/stock/catalogue', label: 'Catalogue' },
            { path: '/stock/mouvements', label: 'Mouvements' },
            { path: '/stock/alertes', label: 'Alertes' },
        ],
    },
];

const ADMIN_NAV_ITEM: NavItem = {
    path: '/admin/utilisateurs',
    label: 'Administration',
    icon: (isActive) => <AdminCircleIcon isActive={isActive} />,
};

// ============================================================================
// Sliding Indicator Component
// ============================================================================

interface SlidingIndicatorProps {
    activeIndex: number;
    isOpen: boolean;
}

const SlidingIndicator = memo(function SlidingIndicator({ activeIndex, isOpen }: SlidingIndicatorProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (activeIndex < 0) return null;

    return (
        <Box
            component="li"
            aria-hidden="true"
            sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: NAV_ITEM_HEIGHT,
                transform: `translateY(${activeIndex * (NAV_ITEM_HEIGHT + NAV_ITEM_GAP)}px)`,
                borderRadius: 24,
                bgcolor: 'primary.50',
                transition: mounted ? `transform ${TRANSITION_SPRING}` : 'none',
                zIndex: 0,
                pointerEvents: 'none',
                // Left accent bar
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 4,
                    height: isOpen ? 24 : 20,
                    borderRadius: '0 4px 4px 0',
                    bgcolor: 'primary.main',
                    transition: `all ${TRANSITION_SPRING}`,
                    boxShadow: `0 0 12px ${COLORS.glowActive}`,
                },
                // Gradient overlay
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 24,
                    background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.12) 0%, rgba(25, 118, 210, 0.04) 100%)',
                },
            }}
        />
    );
});

// ============================================================================
// NavItem Component
// ============================================================================

interface NavItemComponentProps {
    item: NavItem;
    isOpen: boolean;
    isActive: boolean;
    onNavigate: (path: string) => void;
}

const NavSubItemComponent = memo(function NavSubItemComponent({
    item,
    isActive,
    onNavigate,
}: {
    item: NavSubItem;
    isActive: boolean;
    onNavigate: (path: string) => void;
}) {
    const handleClick = useCallback(() => onNavigate(item.path), [onNavigate, item.path]);

    return (
        <ListItem
            disablePadding
            sx={{ height: NAV_ITEM_HEIGHT, mb: `${NAV_ITEM_GAP}px`, position: 'relative', zIndex: 1 }}
        >
            <ListItemButton
                onClick={handleClick}
                sx={{
                    borderRadius: 2,
                    py: 0.75,
                    pl: 4.5, // indent : aligné après l'icône cercle parent
                    pr: 1.5,
                    height: '100%',
                    bgcolor: 'transparent',
                    transition: `all ${TRANSITION}`,
                    '&:hover': {
                        bgcolor: isActive ? 'transparent' : 'grey.100',
                    },
                    gap: 1,
                }}
            >
                <ListItemText
                    primary={item.label}
                    slotProps={{
                        primary: {
                            sx: {
                                fontWeight: isActive ? 600 : 400,
                                fontSize: '0.82rem',
                                color: isActive ? 'primary.main' : 'text.secondary',
                                whiteSpace: 'nowrap',
                                transition: `all ${TRANSITION}`,
                            },
                        },
                    }}
                />
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <Chip
                        label={item.badgeCount}
                        color="error"
                        sx={{
                            // Badge dense : on conserve une hauteur réduite par rapport à
                            // la chip standard du thème (22px) pour l'intégrer dans la rangée.
                            height: 18,
                            minWidth: 22,
                            fontSize: '0.68rem',
                        }}
                    />
                )}
            </ListItemButton>
        </ListItem>
    );
});

const NavItemComponent = memo(function NavItemComponent({ item, isOpen, isActive, onNavigate }: NavItemComponentProps) {
    const handleClick = useCallback(() => onNavigate(item.path), [onNavigate, item.path]);

    return (
        <ListItem
            disablePadding
            sx={{ height: NAV_ITEM_HEIGHT, mb: `${NAV_ITEM_GAP}px`, position: 'relative', zIndex: 1 }}
        >
            <Tooltip title={isOpen ? '' : item.label} placement="right" arrow>
                <ListItemButton
                    onClick={handleClick}
                    sx={{
                        borderRadius: 2,
                        py: 1.25,
                        px: 1.5,
                        height: '100%',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        bgcolor: 'transparent',
                        transition: `all ${TRANSITION}`,
                        '&:hover': {
                            bgcolor: isActive ? 'transparent' : 'grey.100',
                            transform: isActive ? 'none' : 'translateX(4px)',
                        },
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: isOpen ? 36 : 'auto',
                            justifyContent: 'center',
                            transition: `all ${TRANSITION_SPRING}`,
                        }}
                    >
                        {item.icon(isActive)}
                    </ListItemIcon>
                    {isOpen && (
                        <ListItemText
                            primary={item.label}
                            slotProps={{
                                primary: {
                                    sx: {
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: '0.9rem',
                                        color: isActive ? 'primary.main' : 'text.primary',
                                        whiteSpace: 'nowrap',
                                        transition: `all ${TRANSITION}`,
                                        transform: isActive ? 'translateX(2px)' : 'none',
                                    },
                                },
                            }}
                        />
                    )}
                </ListItemButton>
            </Tooltip>
        </ListItem>
    );
});

// ============================================================================
// Sidebar Component
// ============================================================================

export interface SidebarUserInfo {
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
}

export interface SidebarProps {
    /** Current user info for the footer card. Undefined while loading. */
    user?: SidebarUserInfo;
    /** Map of role keys to human-readable labels */
    roleLabels: Record<string, string>;
    /** Callback déclenché au clic sur la carte profil du footer. */
    onProfileClick?: () => void;
}

function SidebarComponent({ user: me, roleLabels, onProfileClick }: SidebarProps) {
    const location = useLocation();
    const pathname = location.pathname;
    const navigate = useNavigate();
    const { isOpen, toggle } = useSidebarStore();
    const { mode, toggleMode } = useThemeStore();
    const logout = useAuthStore((s) => s.logout);
    const role = useAuthStore((s) => s.role);

    const NAV_ITEMS = useMemo(
        () => (role === 'chef_labo' ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS),
        [role],
    );

    // Compteur d'alertes Stock (cf. CDC §5.4) — affiché en badge sur le sous-item Alertes.
    const { data: stockAlerts } = useStockAlerts();
    const stockAlertsCount = stockAlerts
        ? stockAlerts.lowStock.length + stockAlerts.expired.length + stockAlerts.expiringSoon.length
        : 0;

    /**
     * Liste linéaire pour le rendu : 1 entrée = 1 ligne (NAV_ITEM_HEIGHT).
     * Les sous-items d'un parent ne sont insérés que si la sidebar est ouverte
     * ET que la section parent est active (chemin commence par /parent).
     */
    const FLAT_NAV_ITEMS = useMemo<FlatNavItem[]>(() => {
        const flat: FlatNavItem[] = [];
        for (const item of NAV_ITEMS) {
            flat.push({ kind: 'parent', ...item });
            if (isOpen && pathname.startsWith(item.path)) {
                if (item.children) {
                    for (const child of item.children) {
                        const enriched: NavSubItem =
                            child.path === '/stock/alertes' ? { ...child, badgeCount: stockAlertsCount } : child;
                        flat.push({ kind: 'child', ...enriched });
                    }
                }
            }
        }
        return flat;
    }, [NAV_ITEMS, isOpen, pathname, stockAlertsCount]);

    const handleLogout = useCallback(async () => {
        await logout();
        queryClient.clear();
        navigate('/login');
    }, [logout, navigate]);

    /**
     * Index de l'item actif : on prend le chemin le plus spécifique qui matche
     * (sinon le parent éclipserait son enfant déplié).
     */
    const activeIndex = useMemo(() => {
        let bestIdx = -1;
        let bestLen = -1;
        FLAT_NAV_ITEMS.forEach((item, idx) => {
            const matches = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
            if (matches && item.path.length > bestLen) {
                bestIdx = idx;
                bestLen = item.path.length;
            }
        });
        return bestIdx;
    }, [pathname, FLAT_NAV_ITEMS]);

    const checkIsActive = useCallback((idx: number) => idx === activeIndex, [activeIndex]);

    const sidebarStyles = useMemo<SxProps<Theme>>(
        () => ({
            width: isOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED,
            height: '100vh',
            position: 'fixed',
            inset: '0 auto 0 0',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200,
            transition: `width ${TRANSITION}`,
            contain: 'layout style',
            overflow: 'hidden',
        }),
        [isOpen],
    );

    return (
        <Box component="nav" role="navigation" aria-label="Navigation principale" sx={sidebarStyles}>
            {/* Header — clic sur le logo pour basculer le menu */}
            <Box
                sx={{
                    px: 1.5,
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    minHeight: 56,
                }}
            >
                <Tooltip title={isOpen ? 'Réduire le menu' : 'Étendre le menu'} placement="right" arrow>
                    <Box
                        component="button"
                        type="button"
                        onClick={toggle}
                        aria-label={isOpen ? 'Réduire le menu' : 'Étendre le menu'}
                        aria-expanded={isOpen}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            cursor: 'pointer',
                            borderRadius: 1.5,
                            p: 0.5,
                            transition: `background-color ${TRANSITION}`,
                            border: 'none',
                            bgcolor: 'transparent',
                            font: 'inherit',
                            color: 'inherit',
                            textAlign: 'left',
                            '&:hover': {
                                bgcolor: 'action.hover',
                                '& img': { transform: 'scale(1.05)' },
                            },
                            '&:active img': { transform: 'scale(0.96)' },
                            '&:focus-visible': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: 2,
                            },
                        }}
                    >
                        <Box
                            component="img"
                            src={CEALogo}
                            alt="CEA"
                            sx={{
                                width: isOpen ? 36 : 32,
                                height: 'auto',
                                borderRadius: 1,
                                transition: `all ${TRANSITION_SPRING}`,
                                flexShrink: 0,
                            }}
                        />
                        {isOpen && (
                            <Typography
                                variant="h6"
                                component="span"
                                sx={{
                                    fontWeight: 800,
                                    fontSize: '1.35rem',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: COLORS.brand,
                                    lineHeight: 1,
                                }}
                            >
                                Spectre
                            </Typography>
                        )}
                    </Box>
                </Tooltip>
            </Box>

            {/* Navigation */}
            <List
                sx={{
                    position: 'relative',
                    px: 1,
                    py: 1.5,
                    flex: 1,
                }}
            >
                <SlidingIndicator activeIndex={activeIndex} isOpen={isOpen} />
                {FLAT_NAV_ITEMS.map((item, idx) =>
                    item.kind === 'parent' ? (
                        <NavItemComponent
                            key={item.path}
                            item={item}
                            isOpen={isOpen}
                            isActive={checkIsActive(idx)}
                            onNavigate={navigate}
                        />
                    ) : (
                        <NavSubItemComponent
                            key={item.path}
                            item={item}
                            isActive={checkIsActive(idx)}
                            onNavigate={navigate}
                        />
                    ),
                )}
            </List>

            {/* Footer — User card */}
            <Box
                sx={{
                    borderTop: 1,
                    borderColor: 'divider',
                    p: 1.5,
                }}
            >
                {/* User avatar + info — clic ouvre la modale profil */}
                <Tooltip
                    title={
                        isOpen
                            ? me
                                ? 'Voir / modifier mon profil'
                                : ''
                            : me
                              ? `${me.firstName && me.lastName ? `${me.firstName} ${me.lastName}` : me.username} — ${roleLabels[me.role] ?? me.role}`
                              : ''
                    }
                    placement="right"
                    arrow
                >
                    <Box
                        component="button"
                        type="button"
                        onClick={onProfileClick}
                        disabled={!me || !onProfileClick}
                        aria-label="Ouvrir mon profil"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            p: isOpen ? 1 : 0.5,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            mb: 1,
                            justifyContent: isOpen ? 'flex-start' : 'center',
                            transition: `all ${TRANSITION}`,
                            border: 'none',
                            font: 'inherit',
                            color: 'inherit',
                            textAlign: 'left',
                            width: '100%',
                            cursor: me && onProfileClick ? 'pointer' : 'default',
                            '&:hover': me && onProfileClick ? { bgcolor: 'action.selected' } : undefined,
                            '&:focus-visible': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: 2,
                            },
                            '&:disabled': {
                                cursor: 'default',
                            },
                        }}
                    >
                        {/* Avatar initiales */}
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                letterSpacing: '-0.5px',
                                transition: `all ${TRANSITION_SPRING}`,
                            }}
                        >
                            {me?.firstName && me?.lastName ? (
                                `${me.firstName[0]}${me.lastName[0]}`.toUpperCase()
                            ) : me?.username ? (
                                me.username.slice(0, 2).toUpperCase()
                            ) : (
                                <PersonRoundedIcon sx={{ fontSize: 18 }} />
                            )}
                        </Box>
                        {isOpen && me && (
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        lineHeight: 1.3,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {me.firstName && me.lastName ? `${me.firstName} ${me.lastName}` : me.username}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: '0.7rem',
                                        lineHeight: 1.2,
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {roleLabels[me.role] ?? me.role}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Tooltip>

                {/* Actions row */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isOpen ? 'space-between' : 'center',
                        gap: 0.5,
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={mode === 'light' ? 'Mode sombre' : 'Mode clair'} placement="top" arrow>
                            <IconButton
                                onClick={toggleMode}
                                aria-label={mode === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
                                size="small"
                                sx={{
                                    color: 'text.secondary',
                                    transition: `all ${TRANSITION}`,
                                    '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
                                }}
                            >
                                {mode === 'light' ? (
                                    <DarkModeRoundedIcon sx={{ fontSize: 18 }} />
                                ) : (
                                    <LightModeRoundedIcon sx={{ fontSize: 18 }} />
                                )}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Se deconnecter" placement="top" arrow>
                            <IconButton
                                onClick={handleLogout}
                                aria-label="Se deconnecter"
                                size="small"
                                sx={{
                                    color: 'text.secondary',
                                    transition: `all ${TRANSITION}`,
                                    '&:hover': { color: 'error.main', bgcolor: 'action.hover' },
                                }}
                            >
                                <LogoutRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    {isOpen && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                            v1.0.0
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export const Sidebar = memo(SidebarComponent);
export { SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED };
