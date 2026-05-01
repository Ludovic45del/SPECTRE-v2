/**
 * Étape 2 — formulaire kind=element (cf. CDC §8.1 Modal kind=element).
 */

import { useMemo } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import {
    Autocomplete,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    CATEGORIES_BY_KIND,
    CATEGORY,
    CATEGORY_LABELS,
    INSTALLATION_LABELS,
    INSTALLATION_VALUES,
    ITEM_KIND,
    type ElementFormValues,
} from '@entities/stock-item';
import { useFsecs } from '@entities/fsec';

/**
 * ID du statut FSEC "Tirée" (cf. backend `FSEC_STATUS_ID_TIREE`).
 * Les éléments sérialisés ne peuvent être nommés qu'avec une FSEC non tirée.
 */
const FSEC_STATUS_ID_TIREE = 7;

interface ElementFormProps {
    control: Control<ElementFormValues>;
    errors: FieldErrors<ElementFormValues>;
    /** Si la rubrique sélectionnée est `structuration_speciale`, on affiche le champ "Matériaux". */
    showMateriaux: boolean;
}

export function ElementForm({ control, errors, showMateriaux }: ElementFormProps) {
    const elementCategories = CATEGORIES_BY_KIND[ITEM_KIND.ELEMENT];

    const { data: fsecs, isLoading: fsecsLoading } = useFsecs();
    const fsecOptions = useMemo(() => {
        if (!fsecs) return [];
        return fsecs
            .filter((f) => f.statusId !== FSEC_STATUS_ID_TIREE)
            .map((f) => f.name)
            .sort((a, b) => a.localeCompare(b));
    }, [fsecs]);

    return (
        <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            options={fsecOptions}
                            value={field.value ?? null}
                            onChange={(_, value) => field.onChange(value ?? '')}
                            onBlur={field.onBlur}
                            loading={fsecsLoading}
                            fullWidth
                            size="small"
                            isOptionEqualToValue={(opt, val) => opt === val}
                            // Un nom hérité d'un ancien élément peut ne plus matcher une FSEC active :
                            // freeSolo=false impose le choix dans la liste à la création/édition.
                            freeSolo={false}
                            noOptionsText="Aucune FSEC disponible (toutes tirées ou aucune créée)"
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Nom (FSEC)"
                                    required
                                    error={!!errors.name}
                                    helperText={errors.name?.message ?? 'Sélectionnez une FSEC non tirée'}
                                />
                            )}
                        />
                    )}
                />
                <Controller
                    name="reference"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            value={field.value ?? ''}
                            label="Référence"
                            fullWidth
                            size="small"
                            placeholder="Identifiant unique de l'instance"
                            error={!!errors.reference}
                            helperText={errors.reference?.message ?? "Identifiant unique de l'instance"}
                        />
                    )}
                />
            </Stack>

            <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <FormControl size="small" fullWidth required error={!!errors.category}>
                        <InputLabel id="element-category-label">Rubrique</InputLabel>
                        <Select {...field} value={field.value ?? ''} labelId="element-category-label" label="Rubrique">
                            {elementCategories.map((cat) => (
                                <MenuItem key={cat} value={cat}>
                                    {CATEGORY_LABELS[cat]}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>{errors.category?.message ?? "Catégorie métier de l'élément"}</FormHelperText>
                    </FormControl>
                )}
            />

            <Controller
                name="installation"
                control={control}
                render={({ field }) => (
                    <FormControl error={!!errors.installation} required>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                            Installation *
                        </Typography>
                        <RadioGroup row {...field} value={field.value ?? ''}>
                            {INSTALLATION_VALUES.map((i) => (
                                <FormControlLabel
                                    key={i}
                                    value={i}
                                    control={<Radio size="small" />}
                                    label={INSTALLATION_LABELS[i]}
                                />
                            ))}
                        </RadioGroup>
                        {errors.installation && <FormHelperText>{errors.installation.message}</FormHelperText>}
                    </FormControl>
                )}
            />

            <Controller
                name="caracteristique"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        value={field.value ?? ''}
                        label="Caractéristique"
                        fullWidth
                        size="small"
                        placeholder="ex. Épaisseur 50µm, Al pur 99.999%"
                        error={!!errors.caracteristique}
                        helperText={errors.caracteristique?.message}
                    />
                )}
            />

            <Controller
                name="typeDeColle"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        value={field.value ?? ''}
                        label="Type de colle"
                        fullWidth
                        size="small"
                        placeholder="ex. UV, 3090"
                        error={!!errors.typeDeColle}
                        helperText={errors.typeDeColle?.message}
                    />
                )}
            />

            {showMateriaux && (
                <Controller
                    name="materiauxMat"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            value={field.value ?? ''}
                            label="Matériaux"
                            fullWidth
                            size="small"
                            placeholder="ex. Cu/Au"
                            error={!!errors.materiauxMat}
                            helperText={
                                errors.materiauxMat?.message ??
                                `Spécifique à la rubrique ${CATEGORY_LABELS[CATEGORY.STRUCTURATION_SPECIALE]}`
                            }
                        />
                    )}
                />
            )}

            <Controller
                name="fournisseur"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        value={field.value ?? ''}
                        label="Fournisseur"
                        fullWidth
                        size="small"
                        error={!!errors.fournisseur}
                        helperText={errors.fournisseur?.message}
                    />
                )}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                    name="boite"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            value={field.value ?? ''}
                            label="Boîte"
                            fullWidth
                            size="small"
                            placeholder="ex. A12"
                            error={!!errors.boite}
                            helperText={errors.boite?.message}
                        />
                    )}
                />
                <Controller
                    name="emplacement"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            value={field.value ?? ''}
                            label="Emplacement"
                            fullWidth
                            size="small"
                            placeholder="ex. Étagère 3"
                            error={!!errors.emplacement}
                            helperText={errors.emplacement?.message}
                        />
                    )}
                />
            </Stack>

            <Controller
                name="remarques"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        value={field.value ?? ''}
                        label="Observations"
                        fullWidth
                        multiline
                        minRows={3}
                        size="small"
                        placeholder="Notes internes, particularités..."
                        error={!!errors.remarques}
                        helperText={errors.remarques?.message}
                    />
                )}
            />
        </Stack>
    );
}
