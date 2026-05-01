/**
 * LabMachineRow — A single machine row within a salle, with event bars,
 * drag-to-move, resize, and inline editing support.
 * Supports column virtualization: only visible columns are rendered as <td>,
 * off-screen columns are replaced by colSpan spacer cells.
 */
import { memo, useCallback, useMemo, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Add, Delete, NotesOutlined } from '@mui/icons-material';
import dayjs from 'dayjs';
import { getEventCategoryMeta, labRowId } from '../../lib/planning.constants';
import { type PlanningData, usePlanningColors } from '../../lib/planning.hooks';
import { usePlanningStore } from '../../lib/planning.store';
import type { TimelineColumn } from '../../lib/planning.utils';
import type { VisibleColumnRange } from '../../lib/useColumnVirtualization';
import { resolveWeekState } from '../../lib/planning.grid-utils';
import { HoverTd, StickyLabelCell } from '../PlanningCell';
import type { LabEvent, LabMachine, LabSalle } from '@entities/planning/core/model/planning.schema';
import type { LabEventsMap } from '../../lib/planning.hooks';
import {
    useCreateLabMachine,
    useDeleteLabMachine,
    useDeleteLabSalle,
    useUpdateLabEvent,
    useUpdateLabMachine,
    useUpdateLabSalle,
} from '@entities/planning/core/api/planning.queries';
import {
    itemOverlapsColumn,
    getBarPosition,
    getBarBorderRadius,
    calculateResizePreview,
    getBarSpanCount,
} from '../../lib/planning.bar-utils';
import { useDragToMove } from '../../lib/useDragToMove';
import { useResizeBar } from '../../lib/useResizeBar';
import { EditableLabel } from './EditableLabel';
import { EventPopover } from './EventPopover';
import { motion } from '@shared/ui/motion';

// ── Stable sx constants (extracted outside component to avoid re-creation) ──

const resizeHandleBaseSx = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 8,
    cursor: 'col-resize',
    pointerEvents: 'auto',
    zIndex: 1,
    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
} as const;

const resizeHandleStartSx = { ...resizeHandleBaseSx, left: 0, borderRadius: '6px 0 0 6px' } as const;
const resizeHandleEndSx = { ...resizeHandleBaseSx, right: 0, borderRadius: '0 6px 6px 0' } as const;

const notesIconSx = { fontSize: 11, color: '#fff', flexShrink: 0, pointerEvents: 'auto' } as const;

const LabMachineRow = memo(function LabMachineRow({
    salle,
    machine,
    isFirstMachine,
    totalMachines,
    columns,
    planningData,
    labEvents,
    visibleRange,
}: {
    salle: LabSalle;
    machine: LabMachine;
    isFirstMachine: boolean;
    totalMachines: number;
    columns: TimelineColumn[];
    planningData: PlanningData;
    labEvents: LabEventsMap;
    visibleRange: VisibleColumnRange;
}) {
    const colors = usePlanningColors();
    const editMode = usePlanningStore((s) => s.editMode);
    const eventDrag = usePlanningStore((s) => s.eventDrag);

    const updateSalle = useUpdateLabSalle();
    const deleteSalle = useDeleteLabSalle();
    const createMachine = useCreateLabMachine();
    const updateMachine = useUpdateLabMachine();
    const deleteMachine = useDeleteLabMachine();
    const updateEvent = useUpdateLabEvent();

    const rowId = labRowId(machine.uuid);
    const machineEvents = labEvents.get(machine.uuid) ?? [];
    const [hovered, setHovered] = useState(false);
    const [popover, setPopover] = useState<{
        anchorEl: HTMLElement;
        defaultDate: string;
        existingEvent?: LabEvent;
    } | null>(null);

    // ---- Drag-to-move via shared hook ----
    const findItemAtColumn = useCallback(
        (col: TimelineColumn) => machineEvents.find((e) => itemOverlapsColumn(e, col)),
        [machineEvents],
    );

    const { handleCellMouseDown, skipNextClick: skipNextClickDrag } = useDragToMove<LabEvent>({
        columns,
        disabled: editMode,
        findItemAtColumn,
        onMove: (event, dayOffset) => {
            const newStartDate = dayjs(event.startDate).add(dayOffset, 'day').format('YYYY-MM-DD');
            const newEndDate = dayjs(event.endDate).add(dayOffset, 'day').format('YYYY-MM-DD');

            updateEvent.mutate({
                uuid: event.uuid,
                data: {
                    machineUuid: machine.uuid,
                    category: event.category,
                    description: event.description,
                    startDate: newStartDate,
                    endDate: newEndDate,
                },
            });
        },
    });

    // ---- Resize via shared hook ----
    const {
        resizing,
        handleResizeStart,
        skipNextClick: skipNextClickResize,
    } = useResizeBar({
        items: machineEvents,
        columns,
        onResize: (uuid, newStartDate, newEndDate) => {
            const ev = machineEvents.find((e) => e.uuid === uuid);
            if (!ev) return;
            updateEvent.mutate({
                uuid,
                data: {
                    machineUuid: machine.uuid,
                    category: ev.category,
                    description: ev.description,
                    startDate: newStartDate,
                    endDate: newEndDate,
                },
            });
        },
    });

    // Click handler: create/edit popover (skipped after a drag or resize)
    const handleCellClick = useCallback(
        (e: React.MouseEvent<HTMLTableCellElement>, col: TimelineColumn) => {
            if (editMode) return;
            if (skipNextClickDrag.current || skipNextClickResize.current) {
                skipNextClickDrag.current = false;
                skipNextClickResize.current = false;
                return;
            }
            const evIdx = machineEvents.findIndex((ev) => itemOverlapsColumn(ev, col));
            if (evIdx >= 0) {
                setPopover({
                    anchorEl: e.currentTarget,
                    defaultDate: col.start.format('YYYY-MM-DD'),
                    existingEvent: machineEvents[evIdx],
                });
            } else {
                setPopover({
                    anchorEl: e.currentTarget,
                    defaultDate: col.start.format('YYYY-MM-DD'),
                });
            }
        },
        [machineEvents, editMode, skipNextClickDrag, skipNextClickResize],
    );

    // Drag visual state for this row (cross-machine drag via event drag store)
    const isDragSource = eventDrag?.machineKey === machine.uuid;
    const isDragTarget = eventDrag?.currentRowId === rowId;
    const dragHasMoved = eventDrag
        ? eventDrag.originColIndex !== eventDrag.currentColIndex || eventDrag.rowId !== eventDrag.currentRowId
        : false;

    // ── Precomputed timeline data with column virtualization ──
    const timelineCells = useMemo(() => {
        const { startCol, endCol } = visibleRange;

        // Precompute resize preview range using shared util
        let resizePreview: { startIdx: number; endIdx: number; color: string } | null = null;
        if (resizing) {
            const ev = machineEvents.find((e) => e.uuid === resizing.itemId);
            if (ev) {
                const meta = getEventCategoryMeta(ev.category);
                resizePreview = calculateResizePreview(
                    ev,
                    columns,
                    resizing.edge,
                    resizing.currentColIdx,
                    meta?.color ?? colors.blue,
                );
            }
        }

        // Precompute event-to-column mapping for O(1) lookups
        const eventByCol = new Map<number, { event: LabEvent; eventIdx: number }>();
        for (let ei = 0; ei < machineEvents.length; ei++) {
            for (let ci = 0; ci < columns.length; ci++) {
                if (!eventByCol.has(ci) && itemOverlapsColumn(machineEvents[ei], columns[ci])) {
                    eventByCol.set(ci, { event: machineEvents[ei], eventIdx: ei });
                }
            }
        }

        const cells: React.ReactNode[] = [];

        // Left spacer for off-screen columns
        if (startCol > 0) {
            cells.push(<td key="spacer-left" colSpan={startCol} style={{ padding: 0, border: 'none', height: 32 }} />);
        }

        // Visible columns
        for (let idx = startCol; idx <= endCol && idx < columns.length; idx++) {
            const col = columns[idx];
            const weekState = resolveWeekState(col, planningData.weekStatesMap);

            // O(1) lookup from precomputed map
            const eventMatch = eventByCol.get(idx);
            const matchingEvent = eventMatch?.event;
            const matchingEventIdx = eventMatch?.eventIdx ?? -1;
            const catMeta = matchingEvent ? getEventCategoryMeta(matchingEvent.category) : undefined;
            const barPos = matchingEvent ? getBarPosition(matchingEvent, columns, idx) : undefined;

            // Drag visual feedback
            const isBeingDragged = isDragSource && dragHasMoved && matchingEventIdx === eventDrag!.eventIndex;
            const isDropTarget = isDragTarget && dragHasMoved && idx === eventDrag!.currentColIndex;

            // Resize visual feedback
            const isResizedEvent = resizing && matchingEvent?.uuid === resizing.itemId;
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
                        ...(isDropTarget
                            ? {
                                  border: `2px dashed ${colors.blue}`,
                              }
                            : {
                                  borderTop: `1px solid ${colors.border}`,
                                  borderBottom: `1px solid ${colors.border}`,
                                  borderLeft:
                                      barPos && (barPos === 'middle' || barPos === 'end')
                                          ? 'none'
                                          : `1px solid ${colors.border}`,
                                  borderRight:
                                      barPos && (barPos === 'start' || barPos === 'middle')
                                          ? 'none'
                                          : `1px solid ${colors.border}`,
                              }),
                        backgroundColor: col.isCurrent
                            ? colors.currentDay
                            : weekState === 'fermeture'
                              ? colors.fermeture
                              : weekState === 'vacances'
                                ? colors.vacances
                                : col.isWeekend
                                  ? colors.weekend
                                  : colors.cellBg,
                        cursor: editMode ? 'default' : matchingEvent ? 'grab' : 'pointer',
                        height: 32,
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        fontSize: 10,
                        userSelect: 'none',
                    }}
                >
                    {matchingEvent && catMeta && barPos && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 3,
                                bottom: 3,
                                left: barPos === 'start' || barPos === 'single' ? 2 : 0,
                                right: barPos === 'end' || barPos === 'single' ? 2 : 0,
                                bgcolor: catMeta.color,
                                borderRadius: getBarBorderRadius(barPos),
                                overflow: 'hidden',
                                opacity: isBeingDragged || isResizedEvent ? 0.3 : 0.85,
                                pointerEvents: 'none',
                                transition: `opacity ${motion.fast}`,
                            }}
                        >
                            {/* Resize handles at bar edges */}
                            {!editMode && !resizing && (barPos === 'start' || barPos === 'single') && (
                                <Box
                                    onMouseDown={(e) => handleResizeStart(e, matchingEvent, 'start', idx)}
                                    sx={resizeHandleStartSx}
                                />
                            )}
                            {!editMode && !resizing && (barPos === 'end' || barPos === 'single') && (
                                <Box
                                    onMouseDown={(e) => handleResizeStart(e, matchingEvent, 'end', idx)}
                                    sx={resizeHandleEndSx}
                                />
                            )}
                        </Box>
                    )}

                    {/* Centered label — outside bar to avoid overflow:hidden clipping */}
                    {matchingEvent && catMeta && (barPos === 'start' || barPos === 'single') && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 3,
                                bottom: 3,
                                left: 0,
                                width: `${getBarSpanCount(matchingEvent, columns) * 100}%`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                zIndex: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                {matchingEvent.description && (
                                    <Tooltip title={matchingEvent.description} arrow>
                                        <NotesOutlined sx={notesIconSx} />
                                    </Tooltip>
                                )}
                                <Typography fontSize={9} fontWeight={600} color="#fff" noWrap>
                                    {matchingEvent.category}
                                </Typography>
                            </Box>
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
                                border: `1px dashed rgba(255,255,255,0.6)`,
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    {/* Ghost bar at drop target */}
                    {isDropTarget && eventDrag && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 3,
                                bottom: 3,
                                left: 2,
                                right: 2,
                                bgcolor: (() => {
                                    const srcEvents = isDragSource
                                        ? machineEvents
                                        : (labEvents.get(eventDrag.machineKey) ?? []);
                                    const srcEvent = srcEvents[eventDrag.eventIndex];
                                    const meta = srcEvent ? getEventCategoryMeta(srcEvent.category) : undefined;
                                    return meta?.color ?? colors.blue;
                                })(),
                                borderRadius: '6px',
                                opacity: 0.5,
                                border: `2px dashed rgba(255,255,255,0.6)`,
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
        machineEvents,
        planningData.weekStatesMap,
        resizing,
        isDragSource,
        isDragTarget,
        dragHasMoved,
        eventDrag,
        rowId,
        colors,
        editMode,
        labEvents,
        handleCellMouseDown,
        handleCellClick,
        handleResizeStart,
        visibleRange,
    ]);

    return (
        <tr role="row" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {/* Salle cell — only on first machine row */}
            {isFirstMachine &&
                (editMode ? (
                    <EditableLabel
                        value={salle.name}
                        bold
                        rowSpan={totalMachines}
                        onCommit={(v) => updateSalle.mutate({ uuid: salle.uuid, data: { name: v } })}
                        extraContent={
                            <Box sx={{ display: 'flex', gap: 0.2 }}>
                                <Tooltip title="Ajouter une machine">
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            createMachine.mutate({
                                                salleUuid: salle.uuid,
                                                name: `Machine ${totalMachines + 1}`,
                                            })
                                        }
                                        sx={{ p: 0.2, color: colors.accent }}
                                    >
                                        <Add sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Supprimer la salle">
                                    <IconButton
                                        size="small"
                                        onClick={() => deleteSalle.mutate({ uuid: salle.uuid })}
                                        sx={{ p: 0.2, color: '#ef4444' }}
                                    >
                                        <Delete sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        }
                    />
                ) : (
                    <StickyLabelCell bold rowSpan={totalMachines}>
                        {salle.name}
                    </StickyLabelCell>
                ))}

            {/* Machine cell */}
            {editMode ? (
                <EditableLabel
                    value={machine.name}
                    isSubLabel
                    onCommit={(v) => updateMachine.mutate({ uuid: machine.uuid, data: { name: v } })}
                    extraContent={
                        hovered ? (
                            <Tooltip title="Supprimer cette machine">
                                <IconButton
                                    size="small"
                                    onClick={() => deleteMachine.mutate({ uuid: machine.uuid })}
                                    sx={{ p: 0.2, color: '#ef4444' }}
                                >
                                    <Delete sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Tooltip>
                        ) : undefined
                    }
                />
            ) : (
                <StickyLabelCell isSubLabel>{machine.name}</StickyLabelCell>
            )}

            {/* Timeline cells */}
            {timelineCells}

            {/* Event popover */}
            {popover && (
                <EventPopover
                    anchorEl={popover.anchorEl}
                    existingEvent={popover.existingEvent}
                    defaultDate={popover.defaultDate}
                    machineUuid={machine.uuid}
                    onClose={() => setPopover(null)}
                />
            )}
        </tr>
    );
});

export default LabMachineRow;
