/**
 * Voie V2 tab for embase creation form
 * @module features/embase/create-embase/ui/tabs
 *
 * Fields: Soufflet V2, Capteur V2, numeric measurements, electrovanne, observations
 */

import { memo } from 'react';
import { TextField, Stack, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { Controller, type Control } from 'react-hook-form';
import { type EmbaseCreate } from '@entities/embase';
import { NumericControllerField } from './NumericControllerField';

interface VoieV2FormTabProps {
    control: Control<EmbaseCreate>;
}

const ElectrovanneField = memo(function ElectrovanneField({ control }: { control: Control<EmbaseCreate> }) {
    return (
        <Controller
            name="electrovanne"
            control={control}
            render={({ field: { value, onChange } }) => (
                <FormControl fullWidth>
                    <InputLabel>Electrovanne</InputLabel>
                    <Select
                        value={value ? 'Oui' : 'Non'}
                        label="Electrovanne"
                        onChange={(e) => onChange(e.target.value === 'Oui')}
                        renderValue={(val) => (
                            <Chip
                                label={val}
                                color={val === 'Oui' ? 'success' : 'error'}
                                size="small"
                                sx={{ fontWeight: 600 }}
                            />
                        )}
                    >
                        <MenuItem value="Oui">
                            <Chip label="Oui" color="success" size="small" sx={{ fontWeight: 600 }} />
                        </MenuItem>
                        <MenuItem value="Non">
                            <Chip label="Non" color="error" size="small" sx={{ fontWeight: 600 }} />
                        </MenuItem>
                    </Select>
                </FormControl>
            )}
        />
    );
});

export const VoieV2FormTab = memo(function VoieV2FormTab({ control }: VoieV2FormTabProps) {
    return (
        <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
                <Controller
                    name="souffletV2"
                    control={control}
                    render={({ field }) => <TextField {...field} label="Soufflet V2" fullWidth />}
                />
                <Controller
                    name="capteurV2"
                    control={control}
                    render={({ field }) => <TextField {...field} label="N° Capteur V2" fullWidth />}
                />
                <NumericControllerField name="etendueV2Mbar" control={control} label="Étendue (mbar)" />
            </Stack>
            <Stack direction="row" spacing={2}>
                <NumericControllerField name="offsetV2Mv" control={control} label="Offset (b) à 0 barA (mV)" />
                <NumericControllerField name="sensibiliteV2Mv" control={control} label="Sensibilité (a) (mV)" />
                <ElectrovanneField control={control} />
            </Stack>
            <Controller
                name="observationsV2"
                control={control}
                render={({ field }) => <TextField {...field} label="Observations V2" multiline rows={3} fullWidth />}
            />
        </Stack>
    );
});
