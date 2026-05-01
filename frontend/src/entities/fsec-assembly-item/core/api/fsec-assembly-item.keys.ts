/**
 * FsecAssemblyItem — TanStack Query Key Factory.
 */

export const fsecAssemblyKeys = {
    all: ['fsec-assembly-items'] as const,
    listByFsec: (fsecUuid: string) =>
        [...fsecAssemblyKeys.all, 'fsec', fsecUuid] as const,
    availableForFsec: (fsecUuid: string) =>
        ['stock-catalog', 'available-for-fsec', fsecUuid] as const,
};
