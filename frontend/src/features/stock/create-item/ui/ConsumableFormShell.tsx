/**
 * ConsumableFormShell — useForm + boutons + soumission pour le kind=consumable.
 */

import { useCallback } from 'react';
import { Button, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CATEGORY,
    consumableFormToApi,
    ConsumableFormSchema,
    ITEM_KIND,
    useCreateCatalogItem,
    type ConsumableFormValues,
} from '@entities/stock-item';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib/error-utils';
import { ConsumableForm } from './ConsumableForm';

interface ConsumableFormShellProps {
    onBack: () => void;
    onCancel: () => void;
    onSuccess: () => void;
}

export function ConsumableFormShell({ onBack, onCancel, onSuccess }: ConsumableFormShellProps) {
    const createMutation = useCreateCatalogItem();
    const { showNotification } = useNotification();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ConsumableFormValues>({
        mode: 'onBlur',
        resolver: zodResolver(ConsumableFormSchema),
        defaultValues: {
            kind: ITEM_KIND.CONSUMABLE,
            name: '',
            reference: '',
            category: CATEGORY.COLLES,
            caracteristique: '',
            typeDeColle: '',
            quantite: 0,
            unite: '',
            seuilAlerte: null,
            typeDAchat: '',
            fournisseur: '',
            datePeremption: null,
            boite: '',
            emplacement: '',
            remarques: '',
        },
    });

    const onSubmit = useCallback(
        async (values: ConsumableFormValues) => {
            try {
                const created = await createMutation.mutateAsync(consumableFormToApi(values));
                showNotification(`Consommable "${created.name}" ajouté au catalogue`, 'success');
                onSuccess();
            } catch (err) {
                showNotification(getErrorMessage(err, "Erreur lors de l'ajout"), 'error');
            }
        },
        [createMutation, onSuccess, showNotification],
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <ConsumableForm control={control} errors={errors} />
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
