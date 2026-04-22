/**
 * Planning Hooks — timeline, drag selection, data aggregation
 * @module features/planning/lib
 */

import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    useCampaignSteps,
    useCellAnnotations,
    useFsecCellLinks,
    useMemberPeriods,
    useWeekStates,
} from '@entities/planning/core/api/planning.queries';
import type {
    LabEvent,
    PlanningCampaignStep,
    PlanningCellAnnotation,
    PlanningFsecCellLink,
    PlanningMemberPeriod,
    PlanningWeekState,
} from '@entities/planning/core/model/planning.schema';

/** Map from machineUuid -> array of lab events for that machine. */
export type LabEventsMap = Map<string, LabEvent[]>;
import { type PlanningColors, PLANNING_COLORS_DARK, PLANNING_COLORS_LIGHT } from './planning.constants';
import { usePlanningStore } from './planning.store';
import {
    type TimelineColumn,
    type TimelineData,
    columnToWeekNums,
    computeTimeline,
    getCellCoordFromEvent,
} from './planning.utils';

// ====================== Theme-aware Colors ======================

export function usePlanningColors(): PlanningColors {
    const theme = useTheme();
    return theme.palette.mode === 'dark' ? PLANNING_COLORS_DARK : PLANNING_COLORS_LIGHT;
}

// ====================== Timeline Hook ======================

export function usePlanningTimeline(anchorDate: string): TimelineData {
    return useMemo(() => computeTimeline(anchorDate), [anchorDate]);
}

// ====================== Data Aggregation Hook ======================

/** Map from memberName → array of their periods */
export type MemberPeriodsMap = Map<string, PlanningMemberPeriod[]>;

/** Map from "campaignUuid#stepLabel" → array of PlanningCampaignStep (one per FSEC) */
export type CampaignStepsMap = Map<string, PlanningCampaignStep[]>;

/** Map from "campaignUuid#stepLabel#fsecUuid" → single PlanningCampaignStep */
export type FsecStepMap = Map<string, PlanningCampaignStep>;

export interface PlanningData {
    weekStates: PlanningWeekState[];
    weekStatesMap: Map<number, 'vacances' | 'fermeture'>;
    memberPeriods: PlanningMemberPeriod[];
    memberPeriodsMap: MemberPeriodsMap;
    campaignSteps: PlanningCampaignStep[];
    campaignStepsMap: CampaignStepsMap;
    fsecStepMap: FsecStepMap;
    fsecCellLinks: PlanningFsecCellLink[];
    fsecLinksMap: Map<string, PlanningFsecCellLink[]>;
    cellAnnotations: PlanningCellAnnotation[];
    annotationsMap: Map<string, { uuid: string; text: string }>;
    isLoading: boolean;
}

export function usePlanningData(year: number): PlanningData {
    const { data: weekStates = [], isLoading: wsLoading } = useWeekStates(year);
    const { data: memberPeriods = [], isLoading: mpLoading } = useMemberPeriods(year);
    const { data: campaignSteps = [], isLoading: csLoading } = useCampaignSteps(year);
    const { data: fsecCellLinks = [], isLoading: flLoading } = useFsecCellLinks(year);
    const { data: cellAnnotations = [], isLoading: caLoading } = useCellAnnotations(year);

    const weekStatesMap = useMemo(() => {
        const map = new Map<number, 'vacances' | 'fermeture'>();
        for (const ws of weekStates) map.set(ws.weekNum, ws.state);
        return map;
    }, [weekStates]);

    const memberPeriodsMap: MemberPeriodsMap = useMemo(() => {
        const map = new Map<string, PlanningMemberPeriod[]>();
        for (const p of memberPeriods) {
            const list = map.get(p.memberName) ?? [];
            list.push(p);
            map.set(p.memberName, list);
        }
        return map;
    }, [memberPeriods]);

    const campaignStepsMap: CampaignStepsMap = useMemo(() => {
        const map = new Map<string, PlanningCampaignStep[]>();
        for (const cs of campaignSteps) {
            const key = `${cs.campaignUuid}#${cs.stepLabel}`;
            const arr = map.get(key) ?? [];
            arr.push(cs);
            map.set(key, arr);
        }
        return map;
    }, [campaignSteps]);

    const fsecStepMap: FsecStepMap = useMemo(() => {
        const map = new Map<string, PlanningCampaignStep>();
        for (const cs of campaignSteps) {
            map.set(`${cs.campaignUuid}#${cs.stepLabel}#${cs.fsecUuid}`, cs);
        }
        return map;
    }, [campaignSteps]);

    const fsecLinksMap = useMemo(() => {
        const map = new Map<string, PlanningFsecCellLink[]>();
        for (const link of fsecCellLinks) {
            const key = `${link.campaignUuid}#${link.stepLabel}#${link.weekNum}`;
            const arr = map.get(key) ?? [];
            arr.push(link);
            map.set(key, arr);
        }
        return map;
    }, [fsecCellLinks]);

    const annotationsMap = useMemo(() => {
        const map = new Map<string, { uuid: string; text: string }>();
        for (const ann of cellAnnotations) {
            map.set(`${ann.campaignUuid}#${ann.stepLabel}#${ann.weekNum}`, { uuid: ann.uuid, text: ann.text });
        }
        return map;
    }, [cellAnnotations]);

    return {
        weekStates,
        weekStatesMap,
        memberPeriods,
        memberPeriodsMap,
        campaignSteps,
        campaignStepsMap,
        fsecStepMap,
        fsecCellLinks,
        fsecLinksMap,
        cellAnnotations,
        annotationsMap,
        isLoading: wsLoading || mpLoading || csLoading || flLoading || caLoading,
    };
}

// ====================== Drag Selection Hook ======================

export function useDragSelection(columns: TimelineColumn[], editMode: boolean) {
    const store = usePlanningStore;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!editMode || e.button !== 0) return;
            const coord = getCellCoordFromEvent(e);
            if (!coord) return;
            e.preventDefault();
            store.getState().startDrag(coord);
        },
        [editMode],
    );

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const state = store.getState();
        if (!state.isDragging) return;
        const coord = getCellCoordFromEvent(e);
        if (!coord) return;
        state.updateDrag(coord);
    }, []);

    const handleMouseUp = useCallback(
        (e: React.MouseEvent) => {
            const state = store.getState();
            if (!state.isDragging) return;

            state.endDrag();

            const newState = store.getState();
            const range = newState.selectedRange;
            if (!range) return;

            // Determine section from rowId prefix
            let section: 'member' | 'lab' | 'campaign';
            if (range.rowId.startsWith('member:')) section = 'member';
            else if (range.rowId.startsWith('lab:')) section = 'lab';
            else if (range.rowId.startsWith('campaign:')) section = 'campaign';
            else return;

            // Resolve time slots
            const timeSlots: Array<{ year: number; weekNum: number }> = [];
            const seen = new Set<string>();
            for (let i = range.startColIndex; i <= range.endColIndex; i++) {
                const col = columns[i];
                if (!col) continue;
                const weekNums = columnToWeekNums(col);
                for (const wn of weekNums) {
                    const key = `${col.year}#${wn}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        timeSlots.push({ year: col.year, weekNum: wn });
                    }
                }
            }

            // Extract campaign info if applicable
            let campaignUuid: string | undefined;
            let stepLabel: string | undefined;
            if (section === 'campaign') {
                const parts = range.rowId.slice('campaign:'.length).split('#');
                campaignUuid = parts[0];
                stepLabel = parts.slice(1).join('#');
            }

            // Compute anchor position for popover (avoid storing HTMLElement in store)
            const td = (e.target as HTMLElement).closest('td') as HTMLElement | null;
            if (!td) return;
            const rect = td.getBoundingClientRect();
            const anchorPosition = { top: rect.bottom, left: rect.left + rect.width / 2 };

            newState.openPopover({
                anchorPosition,
                section,
                rowId: range.rowId,
                timeSlots,
                campaignUuid,
                stepLabel,
            });
        },
        [columns],
    );

    return { handleMouseDown, handleMouseMove, handleMouseUp };
}

// ====================== Cell in range check ======================

export function useIsCellInRange(rowId: string, colIndex: number): boolean {
    return usePlanningStore((state) => {
        // During drag
        if (state.isDragging && state.dragOrigin && state.dragCurrent) {
            if (state.dragOrigin.rowId !== rowId) return false;
            const minCol = Math.min(state.dragOrigin.colIndex, state.dragCurrent.colIndex);
            const maxCol = Math.max(state.dragOrigin.colIndex, state.dragCurrent.colIndex);
            return colIndex >= minCol && colIndex <= maxCol;
        }
        // After drag (selected range)
        if (state.selectedRange) {
            if (state.selectedRange.rowId !== rowId) return false;
            return colIndex >= state.selectedRange.startColIndex && colIndex <= state.selectedRange.endColIndex;
        }
        return false;
    });
}
