/**
 * useCampaignTeamForm Hook Tests
 * @module pages/campaign-details/overview/hooks
 *
 * Tests for team form state and CRUD operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useCampaignTeamForm } from './useCampaignTeamForm';
import { CampaignWithRelations } from '@entities/campaign';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockShowNotification = vi.fn();
const mockAddMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

const mockTeamMembers = [
    { uuid: 'member-1', name: 'John Doe', roleId: 1 },
    { uuid: 'member-2', name: 'Jane Smith', roleId: 2 },
];

vi.mock('@shared/ui', () => ({
    useNotification: () => ({ showNotification: mockShowNotification }),
}));

vi.mock('@entities/campaign/team', () => ({
    useCampaignTeam: () => ({ data: mockTeamMembers }),
    useAddTeamMember: () => ({ mutateAsync: mockAddMutateAsync, isPending: false }),
    useUpdateTeamMember: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
    useDeleteTeamMember: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
    CampaignTeamFormSchema: z.object({
        moe: z.string().max(200),
        rce: z.string().max(200),
        iec: z.string().max(200),
    }),
    getMemberNameByRole: (members: typeof mockTeamMembers | undefined, role: string) => {
        if (!members) return '';
        const roleMap: Record<string, number> = { MOE: 1, RCE: 2, IEC: 3 };
        const member = members.find((m) => m.roleId === roleMap[role]);
        return member?.name ?? '';
    },
    getMemberByRole: (members: typeof mockTeamMembers | undefined, role: string) => {
        if (!members) return undefined;
        const roleMap: Record<string, number> = { MOE: 1, RCE: 2, IEC: 3 };
        return members.find((m) => m.roleId === roleMap[role]);
    },
}));

vi.mock('@entities/campaign/core/lib', () => ({
    CAMPAIGN_ROLE_ID: { MOE: 1, RCE: 2, IEC: 3 },
    CAMPAIGN_ROLES: [
        { id: 1, label: 'MOE' },
        { id: 2, label: 'RCE' },
        { id: 3, label: 'IEC' },
    ],
}));

// ─────────────────────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────────────────────

const mockCampaign: CampaignWithRelations = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Campagne Test',
    year: 2024,
    semester: 'S1',
    dtriNumber: 42,
    description: 'Description test',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    lastUpdated: new Date(),
    type: { id: 1, label: 'Type A', color: '#FF0000' },
    status: { id: 2, label: 'En cours', color: '#00FF00' },
    installation: { id: 3, label: 'Installation X', color: '#0000FF' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('useCampaignTeamForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddMutateAsync.mockResolvedValue({});
        mockUpdateMutateAsync.mockResolvedValue({});
        mockDeleteMutateAsync.mockResolvedValue({});
    });

    describe('Initialization', () => {
        it('should initialize form with team member data', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            expect(result.current.form).toEqual({
                moe: 'John Doe',
                rce: 'Jane Smith',
                iec: '',
            });
        });

        it('should start in non-editing mode', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            expect(result.current.isEditing).toBe(false);
            expect(result.current.isSaving).toBe(false);
        });

        it('should provide team members data', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            expect(result.current.teamMembers).toEqual(mockTeamMembers);
        });
    });

    describe('Editing Mode', () => {
        it('should enter editing mode when startEditing is called', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.startEditing();
            });

            expect(result.current.isEditing).toBe(true);
        });

        it('should exit editing mode when cancelEditing is called', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.startEditing();
            });
            act(() => {
                result.current.cancelEditing();
            });

            expect(result.current.isEditing).toBe(false);
        });

        it('should reset form when startEditing is called', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.setField('moe', 'Changed Name');
            });

            act(() => {
                result.current.startEditing();
            });

            expect(result.current.form.moe).toBe('John Doe');
        });
    });

    describe('Field Updates', () => {
        it('should update moe field', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.setField('moe', 'New MOE');
            });

            expect(result.current.form.moe).toBe('New MOE');
        });

        it('should update rce field', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.setField('rce', 'New RCE');
            });

            expect(result.current.form.rce).toBe('New RCE');
        });

        it('should update iec field', () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.setField('iec', 'New IEC');
            });

            expect(result.current.form.iec).toBe('New IEC');
        });
    });

    describe('Save Operation', () => {
        it('should save successfully', async () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.startEditing();
            });

            let saveResult: boolean;
            await act(async () => {
                saveResult = await result.current.save();
            });

            expect(saveResult!).toBe(true);
            expect(mockShowNotification).toHaveBeenCalledWith('Équipe mise à jour', 'success');
            expect(result.current.isEditing).toBe(false);
        });

        it('should update existing member when name changed', async () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.startEditing();
                result.current.setField('moe', 'Updated MOE Name');
            });

            await act(async () => {
                await result.current.save();
            });

            expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    uuid: 'member-1',
                    campaign_uuid: mockCampaign.uuid,
                    name: 'Updated MOE Name',
                }),
            );
        });

        it('should delete member when name cleared', async () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.startEditing();
                result.current.setField('moe', '');
            });

            await act(async () => {
                await result.current.save();
            });

            expect(mockDeleteMutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    uuid: 'member-1',
                    campaign_uuid: mockCampaign.uuid,
                }),
            );
        });

        it('should add new member when name provided for empty role', async () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.startEditing();
                result.current.setField('iec', 'New IEC Member');
            });

            await act(async () => {
                await result.current.save();
            });

            expect(mockAddMutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    campaign_uuid: mockCampaign.uuid,
                    role_id: 3,
                    name: 'New IEC Member',
                }),
            );
        });

        it('should handle save error', async () => {
            mockUpdateMutateAsync.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.startEditing();
                result.current.setField('moe', 'Changed Name');
            });

            let saveResult: boolean;
            await act(async () => {
                saveResult = await result.current.save();
            });

            expect(saveResult!).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith('Network error', 'error');
        });

        it('should not call any mutation if names unchanged', async () => {
            const { result } = renderHook(() => useCampaignTeamForm(mockCampaign));

            act(() => {
                result.current.startEditing();
            });

            await act(async () => {
                await result.current.save();
            });

            // No changes, so no mutations should be called
            expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
            expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
            // Add might be called for IEC which is empty
            expect(mockAddMutateAsync).not.toHaveBeenCalled();
        });
    });
});
