/**
 * Campaign Team Form Hook
 * @module pages/campaign-details/overview/hooks/useCampaignTeamForm
 *
 * Extracts form state and handlers for team section.
 */

import { useState, useCallback } from 'react';
import { CampaignWithRelations } from '@entities/campaign';
import {
    useCampaignTeam,
    getMemberNameByRole,
    getMemberByRole,
    useAddTeamMember,
    useUpdateTeamMember,
    useDeleteTeamMember,
    CampaignTeamMember,
    CampaignTeamFormSchema,
} from '@entities/campaign/team';
import { CAMPAIGN_ROLE_ID } from '@entities/campaign/core/lib';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TeamFormData {
    moe: string;
    rce: string;
    iec: string;
}

export interface UseCampaignTeamFormReturn {
    // State
    form: TeamFormData;
    isEditing: boolean;
    isSaving: boolean;
    teamMembers: CampaignTeamMember[] | undefined;

    // Actions
    setField: <K extends keyof TeamFormData>(field: K, value: string) => void;
    startEditing: () => void;
    cancelEditing: () => void;
    save: () => Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useCampaignTeamForm(campaign: CampaignWithRelations): UseCampaignTeamFormReturn {
    const { showNotification } = useNotification();

    // Team hooks
    const { data: teamMembers } = useCampaignTeam(campaign.uuid);
    const addTeamMember = useAddTeamMember();
    const updateTeamMember = useUpdateTeamMember();
    const deleteTeamMember = useDeleteTeamMember();

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<TeamFormData>(() => ({
        moe: getMemberNameByRole(teamMembers, 'MOE'),
        rce: getMemberNameByRole(teamMembers, 'RCE'),
        iec: getMemberNameByRole(teamMembers, 'IEC'),
    }));

    const isSaving = addTeamMember.isPending || updateTeamMember.isPending || deleteTeamMember.isPending;

    // Set individual field
    const setField = useCallback(<K extends keyof TeamFormData>(field: K, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    // Start editing
    const startEditing = useCallback(() => {
        setForm({
            moe: getMemberNameByRole(teamMembers, 'MOE'),
            rce: getMemberNameByRole(teamMembers, 'RCE'),
            iec: getMemberNameByRole(teamMembers, 'IEC'),
        });
        setIsEditing(true);
    }, [teamMembers]);

    // Cancel editing
    const cancelEditing = useCallback(() => {
        setIsEditing(false);
    }, []);

    // Save
    const save = useCallback(async (): Promise<boolean> => {
        const validation = CampaignTeamFormSchema.safeParse(form);
        if (!validation.success) {
            showNotification(validation.error.issues[0].message, 'error');
            return false;
        }

        try {
            const teamUpdates = [
                { name: form.moe, roleId: CAMPAIGN_ROLE_ID.MOE, roleLabel: 'MOE' },
                { name: form.rce, roleId: CAMPAIGN_ROLE_ID.RCE, roleLabel: 'RCE' },
                { name: form.iec, roleId: CAMPAIGN_ROLE_ID.IEC, roleLabel: 'IEC' },
            ];

            for (const update of teamUpdates) {
                const existingMember = getMemberByRole(teamMembers, update.roleLabel);
                const newName = update.name?.trim() ?? '';

                if (existingMember && newName) {
                    // Update existing member if name changed
                    if (existingMember.name !== newName) {
                        await updateTeamMember.mutateAsync({
                            uuid: existingMember.uuid,
                            campaign_uuid: campaign.uuid,
                            role_id: update.roleId,
                            name: newName,
                        });
                    }
                } else if (existingMember && !newName) {
                    // Delete member if name cleared
                    await deleteTeamMember.mutateAsync({
                        uuid: existingMember.uuid,
                        campaign_uuid: campaign.uuid,
                    });
                } else if (!existingMember && newName) {
                    // Add new member
                    await addTeamMember.mutateAsync({
                        campaign_uuid: campaign.uuid,
                        role_id: update.roleId,
                        name: newName,
                    });
                }
            }

            showNotification('Équipe mise à jour', 'success');
            setIsEditing(false);
            return true;
        } catch (err: unknown) {
            showNotification(getErrorMessage(err, "Erreur lors de la mise à jour de l'équipe"), 'error');
            return false;
        }
    }, [campaign.uuid, form, teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, showNotification]);

    return {
        form,
        isEditing,
        isSaving,
        teamMembers,
        setField,
        startEditing,
        cancelEditing,
        save,
    };
}
