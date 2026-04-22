/**
 * Admin Users Page - Helper functions
 * @module pages/admin/users/helpers
 */

import { ROLE_LABELS, type User } from '@entities/user';

import type { SortColumn } from './AdminUsersPage.constants';

export type SortDirection = 'asc' | 'desc';

export const filterUsers = (users: User[], search: string, showInactive: boolean): User[] => {
    return users.filter((u) => {
        if (!showInactive && !u.isActive) return false;
        if (search) {
            const lower = search.toLowerCase();
            if (
                !u.username.toLowerCase().includes(lower) &&
                !(u.lastName?.toLowerCase().includes(lower) ?? false) &&
                !(u.firstName?.toLowerCase().includes(lower) ?? false)
            )
                return false;
        }
        return true;
    });
};

export const sortUsers = (users: User[], column: SortColumn, direction: SortDirection): User[] => {
    const sorted = [...users];
    const m = direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
        let cmp = 0;
        switch (column) {
            case 'username':
                cmp = a.username.localeCompare(b.username, 'fr', { sensitivity: 'base' });
                break;
            case 'lastName':
                cmp = (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr', { sensitivity: 'base' });
                break;
            case 'firstName':
                cmp = (a.firstName ?? '').localeCompare(b.firstName ?? '', 'fr', { sensitivity: 'base' });
                break;
            case 'role':
                cmp = (ROLE_LABELS[a.role] ?? a.role).localeCompare(ROLE_LABELS[b.role] ?? b.role, 'fr');
                break;
            case 'laboratoire':
                cmp = (a.laboratoire ?? '').localeCompare(b.laboratoire ?? '', 'fr', { sensitivity: 'base' });
                break;
            case 'service':
                cmp = (a.service ?? '').localeCompare(b.service ?? '', 'fr', { sensitivity: 'base' });
                break;
            case 'numero':
                cmp = (a.numero ?? '').localeCompare(b.numero ?? '', 'fr', { sensitivity: 'base' });
                break;
            case 'bureau':
                cmp = (a.bureau ?? '').localeCompare(b.bureau ?? '', 'fr', { sensitivity: 'base' });
                break;
            case 'permissionGroup':
                cmp = (a.permissionGroup ?? '').localeCompare(b.permissionGroup ?? '', 'fr');
                break;
            case 'isActive':
                cmp = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
                break;
        }
        return cmp * m;
    });

    return sorted;
};
