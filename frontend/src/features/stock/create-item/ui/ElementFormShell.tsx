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
    elementFormToApi,
    ElementFormSchema,
    INSTALLATION,
    ITEM_KIND,
    useCreateCatalogItem,
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
    const { showNotification } = useNotification();

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ElementFormValues>({
        mode: 'onBlur',
        resolver: zodResolver(ElementFormSchema),
        defaultValues: {
            kind: ITEM_KIND.ELEMENT,
            name: '',
            reference: '',
            category: CATEGORY.PIECES_ELEMENTAIRES,
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
    const showMateriaux = selectedCategory === CATEGORY.STRUCTURATION_SPECIALE;

    const onSubmit = useCallback(
        async (values: ElementFormValues) => {
            try {
                const created = await createMutation.mutateAsync(elementFormToApi(values));
                showNotification(`Élément "${created.name}" ajouté au catalogue`, 'success');
                onSuccess();
            } catch (err) {
                showNotification(getErrorMessage(err, "Erreur lors de l'ajout"), 'error');
            }
        },
        [createMutation, onSuccess, showNotification],
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <ElementForm control={control} errors={errors} showMateriaux={showMateriaux} />
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
