/**
 * Hook encapsulating all mutation logic (create/delete) for the Gas Steps Tab.
 * @module pages/fsec-details/tabs/hooks
 */

import { useCallback, useMemo } from 'react';
import {
    useCreateAirtightnessStep,
    useCreateGasFillingBpStep,
    useCreateGasFillingHpStep,
    useDeleteAirtightnessStep,
    useDeleteGasFillingBpStep,
    type AirtightnessStep,
    type GasFillingBpStep,
    type CommonGasData,
} from '@entities/fsec/steps';
import { useNotification } from '@shared/ui';

export function useGasStepsMutations(fsecVersionId: string, computedCommonData: CommonGasData) {
    const createAirtightnessMutation = useCreateAirtightnessStep();
    const createGasFillingBpMutation = useCreateGasFillingBpStep();
    const createGasFillingHpMutation = useCreateGasFillingHpStep();
    const deleteAirtightnessMutation = useDeleteAirtightnessStep();
    const deleteGasFillingBpMutation = useDeleteGasFillingBpStep();
    const { showNotification } = useNotification();

    const isCreatingRubrique = createAirtightnessMutation.isPending || createGasFillingBpMutation.isPending;
    const isDeletingRubrique = deleteAirtightnessMutation.isPending || deleteGasFillingBpMutation.isPending;
    const isCreatingHpRubrique = createGasFillingHpMutation.isPending;

    const handleDeleteRubrique = useCallback(
        async (airtightnessStep?: AirtightnessStep, fillingStep?: GasFillingBpStep) => {
            try {
                if (airtightnessStep) {
                    await deleteAirtightnessMutation.mutateAsync({
                        uuid: airtightnessStep.uuid,
                        fsecVersionId,
                    });
                }
                if (fillingStep) {
                    await deleteGasFillingBpMutation.mutateAsync({
                        uuid: fillingStep.uuid,
                        fsecVersionId,
                    });
                }
                showNotification('Rubrique Gaz BP supprimée', 'success');
            } catch {
                showNotification('Erreur lors de la suppression', 'error');
            }
        },
        [deleteAirtightnessMutation, deleteGasFillingBpMutation, fsecVersionId, showNotification],
    );

    const handleAddHpRubriqueDirectly = useCallback(async () => {
        if (isCreatingHpRubrique) return;
        try {
            await createGasFillingHpMutation.mutateAsync({ fsecVersionId });
            showNotification('Rubrique Gaz HP ajoutée', 'success');
        } catch {
            showNotification('Erreur lors de la création', 'error');
        }
    }, [isCreatingHpRubrique, createGasFillingHpMutation, fsecVersionId, showNotification]);

    const handleAddRubriqueDirectly = useCallback(async () => {
        if (isCreatingRubrique) return;

        try {
            await Promise.all([
                createAirtightnessMutation.mutateAsync({
                    fsecVersionId,
                    gasType: computedCommonData.gasType,
                    leakRateDtri: computedCommonData.leakRateDtri,
                    airtightnessTestDuration: computedCommonData.testDuration,
                    experimentPressure: computedCommonData.experimentPressure,
                }),
                createGasFillingBpMutation.mutateAsync({
                    fsecVersionId,
                    gasType: computedCommonData.gasType,
                    leakRateDtri: computedCommonData.leakRateDtri,
                    leakTestDuration: computedCommonData.testDuration,
                    experimentPressure: computedCommonData.experimentPressure,
                }),
            ]);
            showNotification('Rubrique Gaz BP ajoutée', 'success');
        } catch {
            showNotification('Erreur lors de la création', 'error');
        }
    }, [
        isCreatingRubrique,
        createAirtightnessMutation,
        createGasFillingBpMutation,
        fsecVersionId,
        showNotification,
        computedCommonData,
    ]);

    return useMemo(
        () => ({
            isCreatingRubrique,
            isDeletingRubrique,
            isCreatingHpRubrique,
            handleDeleteRubrique,
            handleAddHpRubriqueDirectly,
            handleAddRubriqueDirectly,
        }),
        [
            isCreatingRubrique,
            isDeletingRubrique,
            isCreatingHpRubrique,
            handleDeleteRubrique,
            handleAddHpRubriqueDirectly,
            handleAddRubriqueDirectly,
        ],
    );
}
