/**
 * AssemblageInfoPopover — Dialog affichant la dispo assembleurs / machines A1
 * ET permettant de planifier l'assemblage des FSECs de la campagne.
 *
 * Suit le pattern StepModalLayout (header titre + close, Divider, DialogActions).
 */
import { useMemo } from 'react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { softChipSx } from '@shared/lib';
import { getEventCategoryMeta, getPeriodeMeta, type Membre } from '../lib/planning.constants';
import type { PlanningData } from '../lib/planning.hooks';
import { type TimelineColumn, dateRangeOverlapsColumn } from '../lib/planning.utils';
import type { LabSalle } from '@entities/planning/core/model/planning.schema';
import type { LabEventsMap } from '../lib/planning.hooks';
import { FsecPlanningRow, type FsecInfo } from './assemblage/FsecPlanningRow';

// ====================== Types ======================

interface StepAvailabilityConfig {
    /** Step label (e.g. 'Assemblage', 'Métrologie') */
    stepLabel: string;
    /** Step color */
    stepColor: string;
    /** Membre fonction to filter (e.g. 'Assembleur', 'Métrologue') */
    fonctionFilter: string;
    /** Display label for the role section (e.g. 'Assembleurs', 'Métrologues') */
    fonctionLabel: string;
    /** Salle name to show machines for (e.g. 'A1', 'A2') */
    salleName: string;
}

interface AssemblageInfoPopoverProps extends StepAvailabilityConfig {
    column: TimelineColumn;
    membres: Membre[];
    salles: LabSalle[];
    labEvents: LabEventsMap;
    planningData: PlanningData;
    campaignUuid: string;
    campaignFsecs: FsecInfo[];
    onClose: () => void;
}

// ====================== Main Component ======================

export function AssemblageInfoPopover({
    column,
    membres,
    salles,
    labEvents,
    planningData,
    campaignUuid,
    campaignFsecs,
    onClose,
    stepLabel,
    stepColor: _stepColor,
    fonctionFilter,
    fonctionLabel,
    salleName,
}: AssemblageInfoPopoverProps) {
    const theme = useTheme();

    // ---------- Role availability ----------
    const roleMembers = useMemo(() => membres.filter((m) => m.fonction === fonctionFilter), [membres, fonctionFilter]);

    const memberSchedules = useMemo(
        () =>
            roleMembers.map((m) => {
                const periods = planningData.memberPeriodsMap.get(m.nom) ?? [];
                const overlapping = periods.filter((p) => dateRangeOverlapsColumn(p, column));
                return { name: m.nom, periods: overlapping, isAvailable: overlapping.length === 0 };
            }),
        [roleMembers, planningData.memberPeriodsMap, column],
    );

    const availableMemberCount = memberSchedules.filter((a) => a.isAvailable).length;

    // ---------- Salle machines availability ----------
    const salle = useMemo(() => salles.find((s) => s.name === salleName), [salles, salleName]);

    const machineSchedules = useMemo(() => {
        if (!salle) return [];
        return salle.machines.map((machine) => {
            const events = labEvents.get(machine.uuid) ?? [];
            const overlapping = events.filter((ev) => dateRangeOverlapsColumn(ev, column));
            return { name: machine.name, events: overlapping, isAvailable: overlapping.length === 0 };
        });
    }, [salle, labEvents, column]);

    const availableMachineCount = machineSchedules.filter((m) => m.isAvailable).length;

    // ---------- Stable data for day tooltips ----------
    const salleMachines = useMemo(() => salle?.machines.map((m) => ({ uuid: m.uuid, name: m.name })) ?? [], [salle]);

    // ---------- FSEC planning counts ----------
    const scheduledCount = useMemo(() => {
        return campaignFsecs.filter((f) => {
            const key = `${campaignUuid}#${stepLabel}#${f.versionUuid}`;
            return planningData.fsecStepMap.has(key);
        }).length;
    }, [campaignFsecs, campaignUuid, stepLabel, planningData.fsecStepMap]);

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
            {/* Header — StepModalLayout pattern */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 0 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>
                        {stepLabel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        S{column.label} — {column.start.format('DD/MM')} au {column.end.format('DD/MM/YYYY')}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" aria-label="Fermer la modale">
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ pt: 2 }}>
                {/* ===== Role members ===== */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                        {fonctionLabel}
                    </Typography>
                    {memberSchedules.length > 0 && (
                        <Chip
                            label={`${availableMemberCount} / ${memberSchedules.length} dispo`}
                            color={availableMemberCount === memberSchedules.length ? 'success' : 'warning'}
                        />
                    )}
                </Box>

                <Stack spacing={0.5} sx={{ mb: 2 }}>
                    {memberSchedules.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 1 }}>
                            Aucun {fonctionLabel.toLowerCase()}
                        </Typography>
                    ) : (
                        memberSchedules.map((a) => (
                            <Box
                                key={a.name}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 1.5,
                                    py: 0.8,
                                    borderRadius: 1,
                                    border: `1px solid`,
                                    borderColor: 'divider',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {a.isAvailable ? (
                                        <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                                    ) : (
                                        <CancelIcon sx={{ fontSize: 16, color: theme.palette.grey[400] }} />
                                    )}
                                    <Typography variant="body2" fontWeight={500}>
                                        {a.name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {a.isAvailable ? (
                                        <Chip label="Disponible" color="success" />
                                    ) : (
                                        a.periods.map((p) => {
                                            const meta = getPeriodeMeta(p.periodType);
                                            return (
                                                <Chip
                                                    key={p.uuid}
                                                    label={meta?.label ?? p.periodType}
                                                    sx={softChipSx(meta?.color ?? '#999')}
                                                />
                                            );
                                        })
                                    )}
                                </Box>
                            </Box>
                        ))
                    )}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* ===== Machines A1 ===== */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                        Machines — Salle {salleName}
                    </Typography>
                    {salle && machineSchedules.length > 0 && (
                        <Chip
                            label={`${availableMachineCount} / ${machineSchedules.length} dispo`}
                            color={availableMachineCount === machineSchedules.length ? 'success' : 'warning'}
                        />
                    )}
                </Box>

                <Stack spacing={0.5} sx={{ mb: 2 }}>
                    {!salle ? (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 1 }}>
                            Salle {salleName} non trouvée
                        </Typography>
                    ) : machineSchedules.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 1 }}>
                            Aucune machine
                        </Typography>
                    ) : (
                        machineSchedules.map((m) => (
                            <Box
                                key={m.name}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 1.5,
                                    py: 0.8,
                                    borderRadius: 1,
                                    border: `1px solid`,
                                    borderColor: 'divider',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {m.isAvailable ? (
                                        <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                                    ) : (
                                        <CancelIcon sx={{ fontSize: 16, color: theme.palette.grey[400] }} />
                                    )}
                                    <Typography variant="body2" fontWeight={500}>
                                        {m.name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {m.isAvailable ? (
                                        <Chip label="Disponible" color="success" />
                                    ) : (
                                        m.events.map((ev) => {
                                            const meta = getEventCategoryMeta(ev.category);
                                            return (
                                                <Chip
                                                    key={ev.uuid}
                                                    label={ev.category}
                                                    sx={softChipSx(meta?.color ?? '#999')}
                                                />
                                            );
                                        })
                                    )}
                                </Box>
                            </Box>
                        ))
                    )}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* ===== FSEC Planning ===== */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                        Planifier les FSECs
                    </Typography>
                    {campaignFsecs.length > 0 && (
                        <Chip
                            label={`${scheduledCount} / ${campaignFsecs.length} planifiees`}
                            color={scheduledCount === campaignFsecs.length ? 'success' : 'primary'}
                        />
                    )}
                </Box>

                <Stack spacing={0.5}>
                    {campaignFsecs.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 1 }}>
                            Aucune FSEC dans cette campagne
                        </Typography>
                    ) : (
                        campaignFsecs.map((fsec) => {
                            const stepKey = `${campaignUuid}#${stepLabel}#${fsec.versionUuid}`;
                            const existingStep = planningData.fsecStepMap.get(stepKey);
                            return (
                                <FsecPlanningRow
                                    key={fsec.fsecUuid}
                                    fsec={fsec}
                                    existingStep={existingStep}
                                    campaignUuid={campaignUuid}
                                    column={column}
                                    assemblers={roleMembers}
                                    memberPeriodsMap={planningData.memberPeriodsMap}
                                    salleMachines={salleMachines}
                                    labEvents={labEvents}
                                    stepLabel={stepLabel}
                                    fonctionLabel={fonctionLabel}
                                    salleName={salleName}
                                />
                            );
                        })
                    )}
                </Stack>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2 }}>
                <Button variant="text" color="inherit" onClick={onClose}>
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    );
}
