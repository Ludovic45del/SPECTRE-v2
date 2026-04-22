/**
 * AvailabilityDay — Day availability helpers and custom DatePicker day factory
 * for displaying assembler/machine availability in calendar pickers.
 */
import { useMemo } from 'react';
import { Box, Tooltip, type SxProps, type Theme } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { type Dayjs } from 'dayjs';
import { getPeriodeMeta, type Membre } from '../../lib/planning.constants';
import type { PlanningMemberPeriod } from '@entities/planning/core/model/planning.schema';
import type { LabEventsMap } from '../../lib/planning.hooks';

// ====================== Day availability helpers ======================

function dayOverlapsPeriod(day: Dayjs, period: { startDate: string | null; endDate: string | null }): boolean {
    if (!period.startDate || !period.endDate) return false;
    return !day.isBefore(period.startDate, 'day') && !day.isAfter(period.endDate, 'day');
}

export interface DayAvailability {
    assemblers: Array<{ name: string; available: boolean; reason?: string }>;
    machines: Array<{ name: string; available: boolean; reason?: string }>;
    availableAssemblers: number;
    totalAssemblers: number;
    availableMachines: number;
    totalMachines: number;
}

export function computeDayAvailability(
    day: Dayjs,
    assemblers: Membre[],
    memberPeriodsMap: Map<string, PlanningMemberPeriod[]>,
    salleMachines: Array<{ uuid: string; name: string }>,
    labEvents: LabEventsMap,
): DayAvailability {
    const assemblerResults = assemblers.map((m) => {
        const periods = memberPeriodsMap.get(m.nom) ?? [];
        const overlap = periods.find((p) => dayOverlapsPeriod(day, p));
        if (overlap) {
            const meta = getPeriodeMeta(overlap.periodType);
            return { name: m.nom, available: false, reason: meta?.label ?? overlap.periodType };
        }
        return { name: m.nom, available: true };
    });

    const machineResults = salleMachines.map((machine) => {
        const events = labEvents.get(machine.uuid) ?? [];
        const overlap = events.find((ev) => dayOverlapsPeriod(day, ev));
        if (overlap) {
            return { name: machine.name, available: false, reason: overlap.category };
        }
        return { name: machine.name, available: true };
    });

    return {
        assemblers: assemblerResults,
        machines: machineResults,
        availableAssemblers: assemblerResults.filter((a) => a.available).length,
        totalAssemblers: assemblerResults.length,
        availableMachines: machineResults.filter((m) => m.available).length,
        totalMachines: machineResults.length,
    };
}

export function formatAvailabilityTooltip(avail: DayAvailability, fonctionLabel: string, salleName: string): string {
    const lines: string[] = [];

    if (avail.totalAssemblers > 0) {
        lines.push(`${fonctionLabel} : ${avail.availableAssemblers}/${avail.totalAssemblers} dispo`);
        for (const a of avail.assemblers) {
            lines.push(a.available ? `  \u2713 ${a.name}` : `  \u2717 ${a.name} (${a.reason})`);
        }
    }

    if (avail.totalMachines > 0) {
        if (lines.length > 0) lines.push('');
        lines.push(`Machines ${salleName} : ${avail.availableMachines}/${avail.totalMachines} dispo`);
        for (const m of avail.machines) {
            lines.push(m.available ? `  \u2713 ${m.name}` : `  \u2717 ${m.name} (${m.reason})`);
        }
    }

    return lines.join('\n');
}

// ====================== Custom Day factory ======================

/**
 * Creates an AvailabilityDay component bound to the given availability data.
 * This factory approach avoids extending PickersDayProps (not supported in MUI v8).
 */
export function createAvailabilityDay(
    assemblers: Membre[],
    memberPeriodsMap: Map<string, PlanningMemberPeriod[]>,
    salleMachines: Array<{ uuid: string; name: string }>,
    labEventsData: LabEventsMap,
    fonctionLabel: string,
    salleName: string,
) {
    function AvailabilityDay(props: PickersDayProps) {
        const theme = useTheme();
        const day = dayjs(props.day);

        const avail = useMemo(
            () => computeDayAvailability(day, assemblers, memberPeriodsMap, salleMachines, labEventsData),
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [day.valueOf()],
        );

        const tooltip = useMemo(() => formatAvailabilityTooltip(avail, fonctionLabel, salleName), [avail]);
        const allAvailable =
            avail.availableAssemblers === avail.totalAssemblers && avail.availableMachines === avail.totalMachines;
        const noneAvailable =
            avail.availableAssemblers === 0 &&
            avail.availableMachines === 0 &&
            (avail.totalAssemblers > 0 || avail.totalMachines > 0);

        if (props.outsideCurrentMonth || (avail.totalAssemblers === 0 && avail.totalMachines === 0)) {
            return <PickersDay {...props} />;
        }

        return (
            <Tooltip
                title={<Box sx={{ whiteSpace: 'pre-line', fontSize: 11, lineHeight: 1.5 }}>{tooltip}</Box>}
                arrow
                placement="top"
                enterDelay={200}
                slotProps={{ tooltip: { sx: { maxWidth: 260 } } }}
            >
                <Box sx={{ position: 'relative' }}>
                    <PickersDay
                        {...props}
                        sx={{
                            ...('sx' in props ? (props.sx as SxProps<Theme>) : {}),
                            ...(allAvailable &&
                                !props.selected && {
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) },
                                }),
                            ...(noneAvailable &&
                                !props.selected && {
                                    bgcolor: alpha(theme.palette.error.main, 0.06),
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12) },
                                }),
                        }}
                    />
                    {/* Small dot indicator */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 2,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: allAvailable
                                ? theme.palette.success.main
                                : noneAvailable
                                  ? theme.palette.error.main
                                  : theme.palette.warning.main,
                            pointerEvents: 'none',
                        }}
                    />
                </Box>
            </Tooltip>
        );
    }
    return AvailabilityDay;
}
