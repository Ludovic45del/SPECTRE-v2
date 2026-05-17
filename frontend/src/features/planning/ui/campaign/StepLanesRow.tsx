/**
 * StepLanesRow — Ligne unique d'une étape dépliée : les barres FSEC s'empilent
 * sur des couloirs (lane packing) au lieu d'occuper chacune une ligne entière.
 *
 * Remplace l'ancienne boucle de `FsecRow` (une ligne pleine par FSEC).
 * Drag-to-move, resize, popover de création/édition par barre.
 */
import { memo, useCallback, useMemo, useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Check } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useUpdateCampaignStep } from '@entities/planning/core/api/planning.queries';
import type { PlanningCampaignStep } from '@entities/planning/core/model/planning.schema';
import type { Etape } from '../../lib/planning.constants';
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
import { assignLanes, LANE_HEIGHT, LANE_ROW_VPAD, laneRowHeight } from '../../lib/planning.lane-utils';
import { useDragToMove } from '../../lib/useDragToMove';
import { useResizeBar } from '../../lib/useResizeBar';
import { HoverTd, StickyLabelCell } from '../PlanningCell';
import { AssemblageInfoPopover } from '../AssemblageInfoPopover';
import { FsecStepPopover, type FsecOption } from './FsecStepPopover';
import { useCampaignContext } from './CampaignContext';
import type { FsecInfo } from './types';

// ── Constants ──

/** Marge verticale d'une barre à l'intérieur de son couloir. */
const BAR_GAP = 3;

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

interface StepLanesRowProps {
    etape: Etape;
    /** FSEC de la campagne concernées par cette étape. */
    etapeFsecs: FsecInfo[];
    /** Steps programmés de cette étape (campagne + étape). */
    stepsForEtape: PlanningCampaignStep[];
}

// ====================== Component ======================

export const StepLanesRow = memo(function StepLanesRow({ etape, etapeFsecs, stepsForEtape }: StepLanesRowProps) {
    const { campagne, columns, planningData, membres, salles, labEvents, visibleRange } = useCampaignContext();
    const colors = usePlanningColors();
    const selectedYear = usePlanningStore((s) => s.selectedYear);
    const updateStep = useUpdateCampaignStep();

    const isAssemblage = etape.label === 'Assemblage';
    const isMetrologie = etape.label === 'Métrologie';
    const hasAvailabilityDialog = isAssemblage || isMetrologie;

    // ── Lane packing ──
    const { laneByStep, laneCount } = useMemo(() => assignLanes(stepsForEtape), [stepsForEtape]);
    const rowHeight = laneRowHeight(laneCount);

    // ── Lookups ──
    const fsecByUuid = useMemo(() => new Map(etapeFsecs.map((f) => [f.versionUuid, f])), [etapeFsecs]);
    const stepByFsec = useMemo(
        () => new Map(stepsForEtape.map((s) => [s.fsecUuid, s])),
        [stepsForEtape],
    );
    /** FSEC sans step planifié — proposées à la création. */
    const unscheduledFsecOptions: FsecOption[] = useMemo(
        () =>
            etapeFsecs
                .filter((f) => !stepByFsec.has(f.versionUuid))
                .map((f) => ({ versionUuid: f.versionUuid, name: f.name })),
        [etapeFsecs, stepByFsec],
    );

    // ── Popover / dialog state ──
    const [popover, setPopover] = useState<{
        anchorEl: HTMLElement;
        defaultDate: string;
        existingStep?: PlanningCampaignStep;
        fsec?: FsecInfo;
    } | null>(null);
    const [availabilityDialog, setAvailabilityDialog] = useState<{
        column: TimelineColumn;
        fsecs: FsecInfo[];
    } | null>(null);

    // ── Drag-to-move ──
    const onMove = useCallback(
        (step: PlanningCampaignStep, dayOffset: number) => {
            if (!step.startDate || !step.endDate) return;
            updateStep.mutate({
                uuid: step.uuid,
                data: {
                    campaignUuid: step.campaignUuid,
                    fsecUuid: step.fsecUuid,
                    stepLabel: step.stepLabel,
                    year: step.year,
                    startDate: dayjs(step.startDate).add(dayOffset, 'day').format('YYYY-MM-DD'),
                    endDate: dayjs(step.endDate).add(dayOffset, 'day').format('YYYY-MM-DD'),
                },
            });
        },
        [updateStep],
    );
    const { handleItemMouseDown, skipNextClick } = useDragToMove<PlanningCampaignStep>({
        columns,
        findItemAtColumn: useCallback(() => undefined, []),
        onMove,
    });

    // ── Resize ──
    const onResize = useCallback(
        (uuid: string, newStart: string, newEnd: string) => {
            const step = stepsForEtape.find((s) => s.uuid === uuid);
            if (!step) return;
            updateStep.mutate({
                uuid,
                data: {
                    campaignUuid: step.campaignUuid,
                    fsecUuid: step.fsecUuid,
                    stepLabel: step.stepLabel,
                    year: step.year,
                    startDate: newStart,
                    endDate: newEnd,
                },
            });
        },
        [stepsForEtape, updateStep],
    );
    const { resizing, handleResizeStart, skipNextClick: skipNextClickResize } = useResizeBar({
        columns,
        items: stepsForEtape,
        onResize,
    });

    const consumeSkip = useCallback(() => {
        if (skipNextClick.current || skipNextClickResize.current) {
            skipNextClick.current = false;
            skipNextClickResize.current = false;
            return true;
        }
        return false;
    }, [skipNextClick, skipNextClickResize]);

    // ── Click handlers ──
    const handleBarClick = useCallback(
        (e: React.MouseEvent<HTMLElement>, step: PlanningCampaignStep, col: TimelineColumn) => {
            e.stopPropagation();
            if (consumeSkip()) return;
            const fsec = fsecByUuid.get(step.fsecUuid);
            if (hasAvailabilityDialog) {
                setAvailabilityDialog({ column: col, fsecs: fsec ? [fsec] : [] });
            } else {
                setPopover({
                    anchorEl: e.currentTarget,
                    defaultDate: step.startDate ?? col.start.format('YYYY-MM-DD'),
                    existingStep: step,
                    fsec,
                });
            }
        },
        [consumeSkip, fsecByUuid, hasAvailabilityDialog],
    );

    const handleEmptyClick = useCallback(
        (e: React.MouseEvent<HTMLTableCellElement>, col: TimelineColumn) => {
            if (consumeSkip()) return;
            if (hasAvailabilityDialog) {
                setAvailabilityDialog({ column: col, fsecs: etapeFsecs });
                return;
            }
            if (unscheduledFsecOptions.length === 0) return;
            setPopover({ anchorEl: e.currentTarget, defaultDate: col.start.format('YYYY-MM-DD') });
        },
        [consumeSkip, hasAvailabilityDialog, etapeFsecs, unscheduledFsecOptions.length],
    );

    // ── Timeline cells ──
    const { startCol, endCol } = visibleRange;
    const timelineCells = useMemo(() => {
        const cells: React.ReactNode[] = [];

        if (startCol > 0) {
            cells.push(
                <td key="spacer-left" colSpan={startCol} style={{ padding: 0, border: 'none', height: rowHeight }} />,
            );
        }

        for (let idx = startCol; idx <= endCol && idx < columns.length; idx++) {
            const col = columns[idx];
            const weekState = resolveWeekState(col, planningData.weekStatesMap);

            const bars: React.ReactNode[] = [];
            for (const step of stepsForEtape) {
                if (!itemOverlapsColumn(step, col)) continue;
                const lane = laneByStep.get(step.uuid) ?? 0;
                const barPos = getBarPosition(step, columns, idx);
                const fsec = fsecByUuid.get(step.fsecUuid);
                const isDone = fsec ? isFsecStepDone(fsec, etape) : false;
                const isResizedStep = resizing?.itemId === step.uuid;
                const top = lane * LANE_HEIGHT + LANE_ROW_VPAD + BAR_GAP;
                const barHeight = LANE_HEIGHT - 2 * BAR_GAP;
                const isEdge = barPos === 'start' || barPos === 'single';
                const isEndEdge = barPos === 'end' || barPos === 'single';

                bars.push(
                    <Box
                        key={step.uuid}
                        onMouseDown={(e) => handleItemMouseDown(e, step, idx)}
                        onClick={(e) => handleBarClick(e, step, col)}
                        sx={{
                            position: 'absolute',
                            top,
                            height: barHeight,
                            left: isEdge ? 2 : 0,
                            right: isEndEdge ? 2 : 0,
                            bgcolor: isDone ? '#4caf50' : etape.color,
                            borderRadius: getBarBorderRadius(barPos),
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.3,
                            px: 0.5,
                            overflow: 'hidden',
                            cursor: 'grab',
                            opacity: isResizedStep ? 0.3 : 1,
                            zIndex: 2,
                        }}
                    >
                        {isEdge && isDone && <Check sx={{ fontSize: 12, color: '#fff', flexShrink: 0 }} />}
                        {isEdge && fsec && (
                            <Typography
                                noWrap
                                sx={{ fontSize: 10, fontWeight: 600, color: colors.barText, lineHeight: 1 }}
                            >
                                {fsec.name}
                            </Typography>
                        )}
                        {!resizing && isEdge && (
                            <Box onMouseDown={(e) => handleResizeStart(e, step, 'start', idx)} sx={resizeHandleStartSx} />
                        )}
                        {!resizing && isEndEdge && (
                            <Box onMouseDown={(e) => handleResizeStart(e, step, 'end', idx)} sx={resizeHandleEndSx} />
                        )}
                    </Box>,
                );

                // Resize preview ghost
                if (isResizedStep && resizing) {
                    const preview = calculateResizePreview(step, columns, resizing.edge, resizing.currentColIdx, etape.color);
                    if (preview && idx >= preview.startIdx && idx <= preview.endIdx) {
                        const gStart = idx === preview.startIdx;
                        const gEnd = idx === preview.endIdx;
                        bars.push(
                            <Box
                                key={`${step.uuid}-ghost`}
                                sx={{
                                    position: 'absolute',
                                    top,
                                    height: barHeight,
                                    left: gStart ? 2 : 0,
                                    right: gEnd ? 2 : 0,
                                    bgcolor: preview.color,
                                    borderRadius:
                                        gStart && gEnd ? '6px' : gStart ? '6px 0 0 6px' : gEnd ? '0 6px 6px 0' : '0',
                                    opacity: 0.5,
                                    border: '1px dashed rgba(255,255,255,0.6)',
                                    pointerEvents: 'none',
                                    zIndex: 3,
                                }}
                            />,
                        );
                    }
                }
            }

            cells.push(
                <HoverTd
                    key={col.key}
                    role="gridcell"
                    data-col-index={idx}
                    onClick={(e) => handleEmptyClick(e, col)}
                    style={{
                        position: 'relative',
                        padding: 0,
                        height: rowHeight,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: col.isCurrent
                            ? colors.currentDay
                            : weekState === 'fermeture'
                              ? colors.fermeture
                              : weekState === 'vacances'
                                ? colors.vacances
                                : col.isWeekend
                                  ? colors.weekend
                                  : colors.cellBg,
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                >
                    {bars}
                </HoverTd>,
            );
        }

        const rightSpacerCols = columns.length - 1 - endCol;
        if (rightSpacerCols > 0) {
            cells.push(
                <td key="spacer-right" colSpan={rightSpacerCols} style={{ padding: 0, border: 'none', height: rowHeight }} />,
            );
        }

        return cells;
    }, [
        startCol,
        endCol,
        columns,
        rowHeight,
        stepsForEtape,
        laneByStep,
        fsecByUuid,
        etape,
        resizing,
        colors,
        planningData.weekStatesMap,
        handleItemMouseDown,
        handleBarClick,
        handleEmptyClick,
        handleResizeStart,
    ]);

    const scheduledCount = stepByFsec.size;

    return (
        <tr role="row">
            <StickyLabelCell isSubLabel accentColor={etape.color}>
                <Tooltip title="Cliquer une zone vide pour planifier une FSEC" placement="right">
                    <Typography fontSize={10} color="text.disabled" sx={{ pl: 2, fontStyle: 'italic' }}>
                        {scheduledCount}/{etapeFsecs.length} FSEC
                    </Typography>
                </Tooltip>
            </StickyLabelCell>

            {timelineCells}

            {popover && !hasAvailabilityDialog && (
                <FsecStepPopover
                    anchorEl={popover.anchorEl}
                    existingStep={popover.existingStep}
                    defaultDate={popover.defaultDate}
                    campaignUuid={campagne.uuid}
                    fsecUuid={popover.existingStep?.fsecUuid}
                    fsecName={popover.fsec?.name}
                    fsecOptions={popover.existingStep ? undefined : unscheduledFsecOptions}
                    stepLabel={etape.label}
                    stepColor={etape.color}
                    year={selectedYear}
                    onClose={() => setPopover(null)}
                />
            )}

            {availabilityDialog && hasAvailabilityDialog && (
                <AssemblageInfoPopover
                    column={availabilityDialog.column}
                    membres={membres}
                    salles={salles}
                    labEvents={labEvents}
                    planningData={planningData}
                    campaignUuid={campagne.uuid}
                    campaignFsecs={availabilityDialog.fsecs}
                    onClose={() => setAvailabilityDialog(null)}
                    stepLabel={etape.label}
                    stepColor={etape.color}
                    fonctionFilter={isAssemblage ? 'Assembleur' : 'Métrologue'}
                    fonctionLabel={isAssemblage ? 'Assembleurs' : 'Métrologues'}
                    salleName={isAssemblage ? 'B1' : 'B2'}
                />
            )}
        </tr>
    );
});
