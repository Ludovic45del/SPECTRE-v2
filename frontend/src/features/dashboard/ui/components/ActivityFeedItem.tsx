/**
 * Single activity feed row with icon, badges, status, and date.
 * @module features/dashboard/ui/components/ActivityFeedItem
 */

import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, Typography, alpha, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import {
    BRAND_COLORS,
    TRANSITION,
    formatDateRelative,
    type DashboardActivityItem,
    type EntityType,
} from '@entities/dashboard';
import CircleLetterIcon from './CircleLetterIcon';

const ENTITY_LABEL: Record<EntityType, string> = {
    campaign: 'Campagne',
    fsec: 'FSEC',
    fa: "Fiche d'Anomalie",
    embase: 'Embase',
    planning: 'Planning',
};

interface ActivityDetailProps {
    readonly item: DashboardActivityItem;
    readonly isDark: boolean;
    readonly typeColor: string;
}

const ActivityDetail = memo(function ActivityDetail({ item, isDark, typeColor }: ActivityDetailProps) {
    return (
        <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Name + type badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.88rem' }} noWrap>
                    {item.name}
                </Typography>
                <Chip
                    label={ENTITY_LABEL[item.type]}
                    size="small"
                    sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        bgcolor: alpha(typeColor, isDark ? 0.15 : 0.08),
                        color: typeColor,
                        letterSpacing: '0.02em',
                    }}
                />
            </Box>

            {/* Detail line */}
            {item.detail && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}
                    noWrap
                >
                    {item.detail}
                </Typography>
            )}

            {/* Status chip + relative date */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                    label={item.statusLabel}
                    size="small"
                    sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        bgcolor: alpha(item.statusColor, isDark ? 0.2 : 0.12),
                        color: isDark ? alpha(item.statusColor, 0.9) : item.statusColor,
                    }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                        {formatDateRelative(item.date)}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
});

const feedItemSx = (isDark: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    px: 1.5,
    py: 1.5,
    borderRadius: 2.5,
    cursor: 'pointer',
    transition: `all ${TRANSITION}`,
    borderBottom: '1px solid',
    borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    '&:last-child': { borderBottom: 'none' },
    '&:hover': {
        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.025)',
        '& .activity-arrow': { opacity: 1, transform: 'translateX(0)' },
    },
    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
});

export default memo(function ActivityFeedItem({ item }: { readonly item: DashboardActivityItem }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const typeColor = BRAND_COLORS[item.type];

    const rootSx = useMemo(() => feedItemSx(isDark), [isDark]);

    const handleClick = useCallback(() => navigate(item.link), [navigate, item.link]);
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') navigate(item.link);
        },
        [navigate, item.link],
    );

    return (
        <Box role="link" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown} sx={rootSx}>
            <CircleLetterIcon type={item.type} />
            <ActivityDetail item={item} isDark={isDark} typeColor={typeColor} />
            <OpenInNewIcon
                className="activity-arrow"
                sx={{
                    fontSize: 16,
                    color: 'text.disabled',
                    opacity: 0,
                    transform: 'translateX(-4px)',
                    transition: `all ${TRANSITION}`,
                    flexShrink: 0,
                }}
            />
        </Box>
    );
});
