/**
 * CampaignContext — Shared data for campaign sub-components.
 * Avoids prop drilling of columns, planningData, membres, salles, labEvents.
 */
import { createContext, useContext } from 'react';
import type { CampaignWithRelations } from '@entities/campaign/core/model/referential.schema';
import type { LabSalle } from '@entities/planning/core/model/planning.schema';
import type { Membre } from '../../lib/planning.constants';
import type { PlanningData, LabEventsMap } from '../../lib/planning.hooks';
import type { TimelineColumn } from '../../lib/planning.utils';
import type { VisibleColumnRange } from '../../lib/useColumnVirtualization';

export interface CampaignContextValue {
    campagne: CampaignWithRelations;
    columns: TimelineColumn[];
    planningData: PlanningData;
    membres: Membre[];
    salles: LabSalle[];
    labEvents: LabEventsMap;
    visibleRange: VisibleColumnRange;
    onNavigate: () => void;
}

export const CampaignContext = createContext<CampaignContextValue | null>(null);

export function useCampaignContext(): CampaignContextValue {
    const ctx = useContext(CampaignContext);
    if (!ctx) throw new Error('useCampaignContext must be used within CampaignContext.Provider');
    return ctx;
}
