export { materialKeys } from './api/material.keys';
export { useMachineRooms } from './api/rooms.queries';
export {
    useMachines,
    useMachine,
    useCreateMachine,
    useUpdateMachine,
    useDeleteMachine,
} from './api/machines.queries';
export {
    useMaintenances,
    useCreateMaintenance,
    useUpdateMaintenance,
    useDeleteMaintenance,
} from './api/maintenances.queries';
export {
    MACHINE_STATUS,
    MACHINE_STATUS_LABELS,
    MACHINE_STATUS_COLORS,
    MAINTENANCE_TYPE,
    MAINTENANCE_TYPE_LABELS,
    MAINTENANCE_WARNING_DAYS,
} from './model';
export type {
    MachineRoom,
    MachineLink,
    Machine,
    MachineMaintenance,
    MachineInput,
    MachineLinkInput,
    MachineMaintenanceInput,
    MachineStatus,
    MaintenanceType,
} from './model';
