/**
 * Campaign & FSEC Cascading Selector
 * @module features/fa/create-fa
 *
 * Autocomplete pair for selecting a Campaign then a FSEC (filtered by campaign).
 * Used in the CreateFaModal form.
 */

import { memo } from 'react';
import { Autocomplete, Stack, TextField, Typography } from '@mui/material';
import { Control, Controller, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { CampaignWithRelations } from '@entities/campaign';
import type { Fsec } from '@entities/fsec';
import { DataChip } from '@widgets/data-chip';

import type { CreateFaForm } from '../model';

// ============================================================================
// Types
// ============================================================================

interface CampaignFsecSelectorProps {
    control: Control<CreateFaForm>;
    errors: FieldErrors<CreateFaForm>;
    setValue: UseFormSetValue<CreateFaForm>;
    campaigns: CampaignWithRelations[] | undefined;
    availableFsecs: Fsec[];
    selectedCampaignId: string;
}

// ============================================================================
// Helpers
// ============================================================================

const formatCampaignLabel = (campaign: CampaignWithRelations) => {
    return `${campaign.year}-${campaign.installation?.label ?? 'N/A'}_${campaign.name}`;
};

const formatFsecLabel = (fsec: Fsec) => {
    return fsec.name;
};

// ============================================================================
// Component
// ============================================================================

export const CampaignFsecSelector = memo(function CampaignFsecSelector({
    control,
    errors,
    setValue,
    campaigns,
    availableFsecs,
    selectedCampaignId,
}: CampaignFsecSelectorProps) {
    return (
        <>
            {/* Campaign Selector (cascading) */}
            <Controller
                name="campaignId"
                control={control}
                render={({ field }) => (
                    <Autocomplete
                        options={campaigns ?? []}
                        value={campaigns?.find((c) => c.uuid === field.value) ?? null}
                        onChange={(_, value) => {
                            field.onChange(value?.uuid ?? '');
                            // Reset FSEC when campaign changes
                            setValue('fsecVersionId', '');
                        }}
                        getOptionLabel={formatCampaignLabel}
                        isOptionEqualToValue={(option, value) => option.uuid === value?.uuid}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Campagne"
                                required
                                error={Boolean(errors.campaignId)}
                                helperText={errors.campaignId?.message}
                            />
                        )}
                        renderOption={(props, option) => (
                            <li {...props} key={option.uuid}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <DataChip
                                        label={option.installation?.label ?? 'N/A'}
                                        color={option.installation?.color ?? '#666'}
                                    />
                                    <Typography>{formatCampaignLabel(option)}</Typography>
                                </Stack>
                            </li>
                        )}
                    />
                )}
            />

            {/* FSEC Selector (filtered by campaign) */}
            <Controller
                name="fsecVersionId"
                control={control}
                render={({ field }) => (
                    <Autocomplete
                        options={availableFsecs}
                        value={availableFsecs.find((f) => f.versionUuid === field.value) ?? null}
                        onChange={(_, value) => field.onChange(value?.versionUuid ?? '')}
                        getOptionLabel={formatFsecLabel}
                        isOptionEqualToValue={(option, value) => option.versionUuid === value?.versionUuid}
                        disabled={!selectedCampaignId}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="FSEC"
                                required
                                error={Boolean(errors.fsecVersionId)}
                                helperText={
                                    errors.fsecVersionId?.message ??
                                    (!selectedCampaignId ? "Sélectionnez d'abord une campagne" : undefined)
                                }
                            />
                        )}
                    />
                )}
            />
        </>
    );
});
