/**
 * Phase Ouvert Edit Mode Sub-Component
 * @module pages/fa-details/sections
 *
 * Form for editing Phase 1 (Ouvert) fields
 */

import { memo } from 'react';
import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import { FSEC_STEP_LIST, FSEC_STEP_ID } from '@entities/fa';
import { FormActions } from '@pages/campaign-details/overview/components/FormActions';

// ============================================================================
// Types
// ============================================================================

export interface PhaseOuvertForm {
    fsecStepId: number | null;
    fsecStepOther: string;
    eventDate: Dayjs | null;
    discoverer: string;
    observation: string;
    locationEquipment: string;
    quickAnalysis: string;
    immediateMeasures: string;
}

interface EditModeProps {
    form: PhaseOuvertForm;
    setForm: React.Dispatch<React.SetStateAction<PhaseOuvertForm>>;
    onCancel: () => void;
    onSave: () => void;
    isPending: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const PhaseOuvertEditMode = memo(function PhaseOuvertEditMode({
    form,
    setForm,
    onCancel,
    onSave,
    isPending,
}: EditModeProps) {
    return (
        <Box
            component="form"
            role="form"
            aria-label="Formulaire d'édition Phase 1"
            onSubmit={(e) => {
                e.preventDefault();
                onSave();
            }}
        >
            <Grid container spacing={2}>
                <Grid item xs={12} sm={form.fsecStepId === FSEC_STEP_ID.AUTRE ? 4 : 6}>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="fsec-step-label">Étape FSEC</InputLabel>
                        <Select
                            labelId="fsec-step-label"
                            value={form.fsecStepId ?? ''}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    fsecStepId: e.target.value === '' ? null : Number(e.target.value),
                                    fsecStepOther: e.target.value !== '7' ? '' : prev.fsecStepOther,
                                }))
                            }
                            label="Étape FSEC"
                            inputProps={{ 'aria-describedby': 'fsec-step-help' }}
                        >
                            <MenuItem value="">-</MenuItem>
                            {FSEC_STEP_LIST.map((step) => (
                                <MenuItem key={step.id} value={step.id}>
                                    {step.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {form.fsecStepId === FSEC_STEP_ID.AUTRE && (
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Préciser"
                            value={form.fsecStepOther}
                            onChange={(e) => setForm((prev) => ({ ...prev, fsecStepOther: e.target.value }))}
                            size="small"
                            fullWidth
                            placeholder="Précisez l'étape..."
                            inputProps={{ 'aria-label': "Préciser l'étape FSEC personnalisée" }}
                        />
                    </Grid>
                )}
                <Grid item xs={12} sm={form.fsecStepId === FSEC_STEP_ID.AUTRE ? 4 : 6}>
                    <DatePicker
                        label="Date de l'évènement"
                        value={form.eventDate}
                        onChange={(date) => setForm((prev) => ({ ...prev, eventDate: date }))}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                                inputProps: { 'aria-label': "Date de l'évènement" },
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Découvreur"
                        value={form.discoverer}
                        onChange={(e) => setForm((prev) => ({ ...prev, discoverer: e.target.value }))}
                        size="small"
                        fullWidth
                        required
                        inputProps={{ 'aria-required': 'true' }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Lieu / Équipement"
                        value={form.locationEquipment}
                        onChange={(e) => setForm((prev) => ({ ...prev, locationEquipment: e.target.value }))}
                        size="small"
                        fullWidth
                        inputProps={{ 'aria-label': 'Lieu ou équipement concerné' }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Constat"
                        value={form.observation}
                        onChange={(e) => setForm((prev) => ({ ...prev, observation: e.target.value }))}
                        multiline
                        rows={2}
                        size="small"
                        fullWidth
                        required
                        inputProps={{ 'aria-required': 'true', 'aria-label': 'Description du constat observé' }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Analyse rapide"
                        value={form.quickAnalysis}
                        onChange={(e) => setForm((prev) => ({ ...prev, quickAnalysis: e.target.value }))}
                        multiline
                        rows={2}
                        size="small"
                        fullWidth
                        required
                        inputProps={{ 'aria-required': 'true', 'aria-label': "Analyse rapide de l'évènement" }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Mesures immédiates"
                        value={form.immediateMeasures}
                        onChange={(e) => setForm((prev) => ({ ...prev, immediateMeasures: e.target.value }))}
                        multiline
                        rows={2}
                        size="small"
                        fullWidth
                        inputProps={{ 'aria-label': 'Mesures immédiates prises' }}
                    />
                </Grid>
            </Grid>
            <FormActions onCancel={onCancel} isSaving={isPending} />
        </Box>
    );
});
