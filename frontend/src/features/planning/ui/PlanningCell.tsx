/**
 * PlanningCell — Cellule interactive du planning avec barre Gantt et drag highlight.
 */
import React, { memo } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    type BarPosition,
    type PlanningColors,
    GRID_LABEL_WIDTH,
    GRID_SUB_LABEL_WIDTH,
} from '../lib/planning.constants';
import { getBarBorderRadius } from '../lib/planning.bar-utils';
import { useIsCellInRange, usePlanningColors } from '../lib/planning.hooks';
import { motion } from '@shared/ui/motion';

// ====================== Hover-enabled td for timeline cells ======================

export const HoverTd = styled('td')({
    transition: motion.transition(['background-color', 'box-shadow'], 'fast'),
    '&:hover': {
        boxShadow: 'inset 0 0 0 100px rgba(25, 118, 210, 0.06)',
    },
});

interface PlanningCellProps {
    rowId: string;
    colIndex: number;
    isCurrent: boolean;
    isWeekend: boolean;
    weekState?: 'vacances' | 'fermeture';
    bar?: { color: string; position: BarPosition; label?: string };
    children?: React.ReactNode;
}

const stickyZIndex = 2;

export function getCellBg(
    colors: PlanningColors,
    isCurrent: boolean,
    isWeekend: boolean,
    weekState?: 'vacances' | 'fermeture',
    isInRange?: boolean,
): string {
    if (isInRange) return colors.dragHighlight;
    if (isCurrent) return colors.currentDay;
    if (weekState === 'fermeture') return colors.fermeture;
    if (weekState === 'vacances') return colors.vacances;
    if (isWeekend) return colors.weekend;
    return colors.cellBg;
}

export const PlanningCell = memo(function PlanningCell({
    rowId,
    colIndex,
    isCurrent,
    isWeekend,
    weekState,
    bar,
    children,
}: PlanningCellProps) {
    const colors = usePlanningColors();
    const isInRange = useIsCellInRange(rowId, colIndex);

    return (
        <HoverTd
            role="gridcell"
            aria-selected={isInRange}
            data-row-id={rowId}
            data-col-index={colIndex}
            style={{
                position: 'relative',
                padding: 0,
                borderTop: `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
                borderLeft:
                    bar && (bar.position === 'middle' || bar.position === 'end')
                        ? 'none'
                        : `1px solid ${colors.border}`,
                borderRight:
                    bar && (bar.position === 'start' || bar.position === 'middle')
                        ? 'none'
                        : `1px solid ${colors.border}`,
                backgroundColor: getCellBg(colors, isCurrent, isWeekend, weekState, isInRange),
                cursor: 'crosshair',
                height: 32,
                verticalAlign: 'middle',
                textAlign: 'center',
                fontSize: 12,
                color: colors.textPrimary,
                userSelect: 'none',
            }}
        >
            {bar && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 3,
                        bottom: 3,
                        left: bar.position === 'start' || bar.position === 'single' ? 2 : 0,
                        right: bar.position === 'end' || bar.position === 'single' ? 2 : 0,
                        backgroundColor: bar.color,
                        borderRadius: getBarBorderRadius(bar.position),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 600,
                        color: colors.barText,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        opacity: 0.85,
                    }}
                >
                    {bar.label}
                </Box>
            )}
            {!bar && children}
        </HoverTd>
    );
});

// ====================== Sticky Label Cells ======================

interface StickyLabelCellProps {
    children: React.ReactNode;
    rowSpan?: number;
    isSubLabel?: boolean;
    bold?: boolean;
    onClick?: () => void;
    onDoubleClick?: () => void;
    accentColor?: string;
    isHeader?: boolean;
    role?: React.AriaRole;
    'aria-selected'?: boolean;
}

export const StickyLabelCell = memo(function StickyLabelCell({
    children,
    rowSpan,
    isSubLabel,
    bold,
    onClick,
    onDoubleClick,
    accentColor,
    isHeader,
    role: cellRole,
    'aria-selected': ariaSelected,
}: StickyLabelCellProps) {
    const colors = usePlanningColors();
    const left = isSubLabel ? GRID_LABEL_WIDTH : 0;
    const width = isSubLabel ? GRID_SUB_LABEL_WIDTH : GRID_LABEL_WIDTH;

    return (
        <HoverTd
            role={cellRole ?? 'gridcell'}
            aria-selected={ariaSelected}
            rowSpan={rowSpan}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            style={{
                position: 'sticky',
                left,
                zIndex: stickyZIndex,
                width,
                minWidth: width,
                maxWidth: width,
                backgroundColor: isHeader ? colors.sectionBg : colors.white,
                borderRight: `2px solid ${colors.borderStrong}`,
                border: `1px solid ${colors.border}`,
                borderTop: isHeader ? `2px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
                borderLeft: accentColor ? `4px solid ${accentColor}` : `1px solid ${colors.border}`,
                padding: '4px 8px',
                fontSize: 13,
                fontWeight: bold ? 600 : 500,
                color: colors.accent,
                textAlign: 'left',
                verticalAlign: 'middle',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: onClick || onDoubleClick ? 'pointer' : 'default',
            }}
        >
            {children}
        </HoverTd>
    );
});
