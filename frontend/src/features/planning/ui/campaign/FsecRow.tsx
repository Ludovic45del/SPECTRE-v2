/**
 * FsecRow — Ligne individuelle d'une FSEC dans le planning campagne.
 * Drag-to-move, resize, popover DatePicker.
 * Supports column virtualization via CampaignContext.visibleRange.
 */
import { memo, useCallback, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Check } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useUpdateCampaignStep } from '@entities/planning/core/api/planning.queries';
import type { PlanningCampaignStep } from '@entities/planning/core/model/planning.schema';
import { campaignFsecRowId, type Etape } from '../../lib/planning.constants';
import { usePlanningColors } from '../../lib/planning.hooks';
import { usePlanningStore } from '../../lib/planning.store';
import { type TimelineColumn, isFsecStepDone } from '../../lib/planning.utils';
import { resolveWeekState } from '../../lib/planning.grid-utils';
import {
    itemOverlapsColumn,
    getBarPosition,
    getBarBorderRadius,
    calculateResizePreview,
} from '../../lib/planning.bar-utils';
import { useDragToMove } from '../../lib/useDragToMove';
import { useResizeBar } from '../../lib/useResizeBar';
import { HoverTd, StickyLabelCell } from '../PlanningCell';
import { FsecStepPopover } from './FsecStepPopover';
import { AssemblageInfoPopover } from '../AssemblageInfoPopover';
import { useCampaignContext } from './CampaignContext';
import type { FsecInfo } from './types';

// ── Stable sx constants ──

const resizeHandleBaseSx = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 8,
    cursor: 'col-resize',
    pointerEvents: 'auto',
    zIndex: 3,
    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
} as const;

const resizeHandleStartSx = { ...resizeHandleBaseSx, left: 0, borderRadius: '6px 0 0 6px' } as const;
const resizeHandleEndSx = { ...resizeHandleBaseSx, right: 0, borderRadius: '0 6px 6px 0' } as const;

// ====================== Types ======================

interface FsecRowProps {
    etape: Etape;
    fsec: FsecInfo;
}

// ====================== Component ======================

export const FsecRow = memo(function FsecRow({ etape, fsec }: FsecRowProps) {
    const { campagne, columns, planningData, membres, salles, labEvents, visibleRange } = useCampaignContext();
    const colors = usePlanningColors();
    const navigate = useNavigate();
    const selectedYear = usePlanningStore((s) => s.selectedYear);
    const rowId = campaignFsecRowId(campagne.uuid, etape.label, fsec.fsecUuid);

    const updateStep = useUpdateCampaignStep();

    // Get existing step for this campaign + etape + fsec
    const fsecStepKey = `${campagne.uuid}#${etape.label}#${fsec.versionUuid}`;
    const step = planningData.fsecStepMap.get(fsecStepKey) ?? null;

    // Workflow status: is this FSEC "done" for this etape?
    const hasWorkflow = etape.minStatusForDone !== undefined || etape.useShootingDate;
    const isDone = hasWorkflow && isFsecStepDone(fsec, etape);

    const isAssemblage = etape.label === 'Assemblage';
    const isMetrologie = etape.label === 'Métrologie';
    const hasAvailabilityDialog = isAssemblage || isMetrologie;

    const [popover, setPopover] = useState<{
        anchorEl: HTMLElement;
        defaultDate: string;
        existingStep?: PlanningCampaignStep;
    } | null>(null);

    const [availabilityDialog, setAvailabilityDialog] = useState<{
        column: TimelineColumn;
    } | null>(null);

    // Drag-to-move hook
    const { handleCellMouseDown, skipNextClick } = useDragToMove<PlanningCampaignStep>({
        columns,
        findItemAtColumn: useCallback(
            (col: TimelineColumn) => (step && itemOverlapsColumn(step, col) ? step : undefined),
            [step],
        ),
        onMove: useCallback(
            (item: PlanningCampaignStep, dayOffset: number) => {
                const newStartDate = dayjs(item.startDate).add(dayOffset, 'day').format('YYYY-MM-DD');
                const newEndDate = dayjs(item.endDate).add(dayOffset, 'day').format('YYYY-MM-DD');
                updateStep.mutate({
                    uuid: item.uuid,
                    data: {
                        campaignUuid: campagne.uuid,
                        fsecUuid: fsec.versionUuid,
                        stepLabel: etape.label,
                        year: selectedYear,
                        startDate: newStartDate,
                        endDate: newEndDate,
                    },
                });
            },
            [campagne.uuid, fsec.versionUuid, etape.label, selectedYear, updateStep],
        ),
    });

    // Resize hook
    const {
        resizing,
        handleResizeStart,
        skipNextClick: skipNextClickResize,
    } = useResizeBar({
        columns,
        items: step ? [step] : [],
        onResize: useCallback(
            (uuid: string, newStart: string, newEnd: string) => {
                updateStep.mutate({
                    uuid,
                    data: {
                        campaignUuid: campagne.uuid,
                        fsecUuid: fsec.versionUuid,
                        stepLabel: etape.label,
                        year: selectedYear,
                        startDate: newStart,
                        endDate: newEnd,
                    },
                });
            },
            [campagne.uuid, fsec.versionUuid, etape.label, selectedYear, updateStep],
        ),
    });

    // Click handler: create/edit popover (or assemblage dialog)
    const handleCellClick = useCallback(
        (e: React.MouseEvent<HTMLTableCellElement>, col: TimelineColumn) => {
            if (skipNextClick.current || skipNextClickResize.current) {
                skipNextClick.current = false;
                skipNextClickResize.current = false;
                return;
            }
            if (hasAvailabilityDialog) {
                setAvailabilityDialog({ column: col });
            } else {
                setPopover({
                    anchorEl: e.currentTarget,
                    defaultDate: col.start.format('YYYY-MM-DD'),
                    existingStep: step && itemOverlapsColumn(step, col) ? step : undefined,
                });
            }
        },
        [step, skipNextClick, skipNextClickResize, hasAvailabilityDialog],
    );

    // ── Precomputed timeline cells with column virtualization ──
    const timelineCells = useMemo(() => {
        const { startCol, endCol } = visibleRange;

        // Precompute resize preview range
        const resizePreview =
            resizing && step
                ? calculateResizePreview(step, columns, resizing.edge, resizing.currentColIdx, etape.color)
                : null;

        const cells: React.ReactNode[] = [];

        // Left spacer for off-screen columns
        if (startCol > 0) {
            cells.push(<td key="spacer-left" colSpan={startCol} style={{ padding: 0, border: 'none', height: 32 }} />);
        }

        // Visible columns
        for (let idx = startCol; idx <= endCol && idx < columns.length; idx++) {
            const col = columns[idx];
            const weekState = resolveWeekState(col, planningData.weekStatesMap);

            // Bar from step dates
            const inRange = step ? itemOverlapsColumn(step, col) : false;
            const barPos = step && inRange ? getBarPosition(step, columns, idx) : undefined;

            // Resize visual feedback
            const isResizedStep = resizing && step?.uuid === resizing.itemId;
            const isInResizePreview = resizePreview && idx >= resizePreview.startIdx && idx <= resizePreview.endIdx;
            const isResizePreviewStart = isInResizePreview && idx === resizePreview!.startIdx;
            const isResizePreviewEnd = isInResizePreview && idx === resizePreview!.endIdx;

            cells.push(
                <HoverTd
                    key={col.key}
                    role="gridcell"
                    data-row-id={rowId}
                    data-col-index={idx}
                    onMouseDown={(e) => handleCellMouseDown(e, col, idx)}
                    onClick={(e) => handleCellClick(e, col)}
                    style={{
                        position: 'relative',
                        padding: 0,
                        borderTop: `1px solid ${colors.border}`,
                        borderBottom: `1px solid ${colors.border}`,
                        borderLeft:
                            barPos && (barPos === 'middle' || barPos === 'end') ? 'none' : `1px solid ${colors.border}`,
                        borderRight:
                            barPos && (barPos === 'start' || barPos === 'middle')
                                ? 'none'
                                : `1px solid ${colors.border}`,
                        backgroundColor: col.isCurrent
                            ? colors.currentDay
                            : weekState === 'fermeture'
                              ? colors.fermeture
                              : weekState === 'vacances'
                                ? colors.vacances
                                : col.isWeekend
                                  ? colors.weekend
                                  : colors.cellBg,
                        cursor: inRange ? 'grab' : 'pointer',
                        height: 32,
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        fontSize: 10,
                        userSelect: 'none',
                    }}
                >
                    {/* Step bar */}
                    {barPos && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 3,
                                bottom: 3,
                                left: barPos === 'start' || barPos === 'single' ? 2 : 0,
                                right: barPos === 'end' || barPos === 'single' ? 2 : 0,
                                bgcolor: isDone ? '#4caf50' : etape.color,
                                borderRadius: getBarBorderRadius(barPos),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                px: 0.3,
                                opacity: isResizedStep ? 0.3 : 1,
                                pointerEvents: 'none',
                                transition: 'opacity 0.15s ease',
                            }}
                        >
                            {/* Done check on start cell */}
                            {isDone && (barPos === 'start' || barPos === 'single') && (
                                <Check sx={{ fontSize: 14, color: '#fff', zIndex: 2 }} />
                            )}

                            {/* Resize handles */}
                            {!resizing && (barPos === 'start' || barPos === 'single') && (
                                <Box
                                    onMouseDown={(e) => step && handleResizeStart(e, step, 'start', idx)}
                                    sx={resizeHandleStartSx}
                                />
                            )}
                            {!resizing && (barPos === 'end' || barPos === 'single') && (
                                <Box
                                    onMouseDown={(e) => step && handleResizeStart(e, step, 'end', idx)}
                                    sx={resizeHandleEndSx}
                                />
                            )}
                        </Box>
                    )}

                    {/* Resize preview ghost bar */}
                    {isInResizePreview && resizePreview && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 3,
                                bottom: 3,
                                left: isResizePreviewStart ? 2 : 0,
                                right: isResizePreviewEnd ? 2 : 0,
                                bgcolor: resizePreview.color,
                                borderRadius:
                                    isResizePreviewStart && isResizePreviewEnd
                                        ? '6px'
                                        : isResizePreviewStart
                                          ? '6px 0 0 6px'
                                          : isResizePreviewEnd
                                            ? '0 6px 6px 0'
                                            : '0',
                                opacity: 0.5,
                                border: '1px dashed rgba(255,255,255,0.6)',
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                </HoverTd>,
            );
        }

        // Right spacer for off-screen columns
        const rightSpacerCols = columns.length - 1 - endCol;
        if (rightSpacerCols > 0) {
            cells.push(
                <td key="spacer-right" colSpan={rightSpacerCols} style={{ padding: 0, border: 'none', height: 32 }} />,
            );
        }

        return cells;
    }, [
        columns,
        step,
        resizing,
        planningData.weekStatesMap,
        etape,
        isDone,
        rowId,
        colors,
        handleCellMouseDown,
        handleCellClick,
        handleResizeStart,
        visibleRange,
    ]);

    return (
        <tr role="row">
            <StickyLabelCell
                isSubLabel
                accentColor={etape.color}
                onClick={() => navigate(`/fsec-details/${fsec.versionUuid}/overview`)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 2 }}>
                    {hasWorkflow && (
                        <Box
                            sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                bgcolor: isDone ? '#4caf50' : colors.border,
                            }}
                        >
                            {isDone && <Check sx={{ fontSize: 10, color: '#fff' }} />}
                        </Box>
                    )}
                    <Typography
                        fontSize={11}
                        noWrap
                        sx={{
                            color: colors.textSecondary,
                            cursor: 'pointer',
                            '&:hover': { color: colors.accent, textDecoration: 'underline' },
                        }}
                    >
                        {fsec.name}
                    </Typography>
                </Box>
            </StickyLabelCell>

            {/* Timeline cells */}
            {timelineCells}

            {/* Popover (standard etapes without availability dialog) */}
            {popover && !hasAvailabilityDialog && (
                <FsecStepPopover
                    anchorEl={popover.anchorEl}
                    existingStep={popover.existingStep}
                    defaultDate={popover.defaultDate}
                    campaignUuid={campagne.uuid}
                    fsecUuid={fsec.versionUuid}
                    fsecName={fsec.name}
                    stepLabel={etape.label}
                    stepColor={etape.color}
                    year={selectedYear}
                    onClose={() => setPopover(null)}
                />
            )}

            {/* Availability dialog (Assemblage / Metrologie -- single FSEC) */}
            {availabilityDialog && hasAvailabilityDialog && (
                <AssemblageInfoPopover
                    column={availabilityDialog.column}
                    membres={membres}
                    salles={salles}
                    labEvents={labEvents}
                    planningData={planningData}
                    campaignUuid={campagne.uuid}
                    campaignFsecs={[fsec]}
                    onClose={() => setAvailabilityDialog(null)}
                    stepLabel={etape.label}
                    stepColor={etape.color}
                    fonctionFilter={isAssemblage ? 'Assembleur' : 'Métrologue'}
                    fonctionLabel={isAssemblage ? 'Assembleurs' : 'Métrologues'}
                    salleName={isAssemblage ? 'A1' : 'A2'}
                />
            )}
        </tr>
    );
});
