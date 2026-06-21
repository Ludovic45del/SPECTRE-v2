/**
 * ElementFormShell — useForm + boutons + soumission pour le kind=element.
 */

import { useCallback } from 'react';
import { Button, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CATEGORY,
    ElementBatchFormSchema,
    elementFormToApi,
    INSTALLATION,
    ITEM_KIND,
    STRUCTURATION_TYPE,
    structurationBatchFormToApi,
    useCreateCatalogItem,
    useCreateStructurationBatch,
    useNextStructurationNumber,
    type ElementFormValues,
} from '@entities/stock-item';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib/error-utils';
import { ElementForm } from './ElementForm';

interface ElementFormShellProps {
    onBack: () => void;
    onCancel: () => void;
    onSuccess: () => void;
}

export function ElementFormShell({ onBack, onCancel, onSuccess }: ElementFormShellProps) {
    const createMutation = useCreateCatalogItem();
    const batchMutation = useCreateStructurationBatch();
    const { showNotification } = useNotification();

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ElementFormValues>({
        mode: 'onBlur',
        // Mode paquet : à la création, structuration ⇒ libellé + quantité requis.
        resolver: zodResolver(ElementBatchFormSchema),
        defaultValues: {
            kind: ITEM_KIND.ELEMENT,
            name: '',
            batchQuantity: 1,
            reference: '',
            fsecName: null,
            category: CATEGORY.PIECES_ELEMENTAIRES,
            structurationType: null,
            installation: INSTALLATION.LMJ,
            caracteristique: '',
            typeDeColle: '',
            materiauxMat: '',
            fournisseur: '',
            boite: '',
            emplacement: '',
            remarques: '',
        },
    });

    const selectedCategory = watch('category');
    const selectedStructurationType = watch('structurationType');
    const showStructurationType = selectedCategory === CATEGORY.STRUCTURATION;
    const showMateriaux =
        showStructurationType && selectedStructurationType === STRUCTURATION_TYPE.SPECIALE;

    // Aperçu du prochain numéro de série (chargé uniquement en rubrique structuration).
    const { data: nextNumber } = useNextStructurationNumber(showStructurationType);

    const onSubmit = useCallback(
        async (values: ElementFormValues) => {
            try {
                if (values.category === CATEGORY.STRUCTURATION) {
                    const created = await batchMutation.mutateAsync(structurationBatchFormToApi(values));
                    const count = created.length;
                    const first = created[0]?.name;
                    const last = created[count - 1]?.name;
                    showNotification(
                        count === 1
                            ? `Structuration n° ${first} ajoutée`
                            : `${count} structurations ajoutées (n° ${first} → n° ${last})`,
                        'success',
                    );
                } else {
                    const created = await createMutation.mutateAsync(elementFormToApi(values));
                    showNotification(`Élément "${created.name}" ajouté au catalogue`, 'success');
                }
                onSuccess();
            } catch (err) {
                showNotification(getErrorMessage(err, "Erreur lors de l'ajout"), 'error');
            }
        },
        [batchMutation, createMutation, onSuccess, showNotification],
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <ElementForm
                control={control}
                errors={errors}
                showStructurationType={showStructurationType}
                showMateriaux={showMateriaux}
                batchMode
                nextNumber={nextNumber ?? null}
            />
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}
            >
                <Button onClick={onBack} startIcon={<ChevronLeftIcon />} color="inherit" disabled={isSubmitting}>
                    Retour
                </Button>
                <Stack direction="row" spacing={1.5}>
                    <Button onClick={onCancel} color="inherit" disabled={isSubmitting}>
                        Annuler
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? 'Ajout en cours…' : 'Ajouter au catalogue'}
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
}
