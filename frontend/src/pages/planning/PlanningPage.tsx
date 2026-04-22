/**
 * PlanningPage — Page principale du planning SPECTRE.
 * Simple assembleur : toolbar + grid. Toute la logique est dans features/planning.
 */
import { useEffect, useMemo } from 'react';
import { Container } from '@mui/material';
import { type Membre } from '@features/planning/lib/planning.constants';
import { useLabSalles, useLabEvents } from '@entities/planning/core/api/planning.queries';
import type { LabEvent } from '@entities/planning/core/model/planning.schema';
import { usePlanningStore } from '@features/planning/lib/planning.store';
import { PlanningToolbar } from '@features/planning/ui/PlanningToolbar';
import { PlanningGrid } from '@features/planning/ui/PlanningGrid';
import type { LabEventsMap } from '@features/planning/lib/planning.hooks';
import { ErrorBoundary } from '@shared/ui';

// Re-export for backward compat
export type { LabEventsMap } from '@features/planning/lib/planning.hooks';

export default function PlanningPage() {
    const resetUIState = usePlanningStore((s) => s.resetUIState);

    // Cleanup transient UI state (drag, selection, popover) on unmount
    useEffect(() => {
        return () => resetUIState();
    }, [resetUIState]);

    // TODO: replace with a real data source (e.g. usePlanningMembres() query)
    const membres: Membre[] = [];
    const { data: salles = [] } = useLabSalles();
    const { data: labEventsList = [] } = useLabEvents();

    const labEvents: LabEventsMap = useMemo(() => {
        const map = new Map<string, LabEvent[]>();
        for (const ev of labEventsList) {
            const list = map.get(ev.machineUuid) ?? [];
            list.push(ev);
            map.set(ev.machineUuid, list);
        }
        return map;
    }, [labEventsList]);

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <ErrorBoundary compact>
                <PlanningToolbar />
            </ErrorBoundary>
            <ErrorBoundary compact>
                <PlanningGrid membres={membres} salles={salles} labEvents={labEvents} />
            </ErrorBoundary>
        </Container>
    );
}
