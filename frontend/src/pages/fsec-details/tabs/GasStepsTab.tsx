/**
 * FSEC Gas Steps Tab
 * @module pages/fsec-details/tabs
 *
 * Displays gas-related steps based on FSEC category using ONE unified workflow card per category.
 * Each category has a single collapsible card with all relevant steps:
 * - Category 0 (Sans Gaz): Empty state
 * - Category 1 (Gaz BP): CategoryBpWorkflowCard with Test BP → Remplissage BP
 * - Category 2 (Gaz HP): CategoryHpWorkflowCard (non-collapsible, simple)
 * - Category 3 (Gaz BP + HP): CategoryBpHpWorkflowCard with Test BP → Remplissage BP → Remplissage HP
 * - Category 4 (Perméation + BP): CategoryPermeationBpWorkflowCard with Test BP → Perméation → Dépressurisation → Remplissage BP → Repressurisation
 *
 * Common data is integrated inside each card at the top (not a separate card).
 */

import { useMemo } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import AddIcon from '@mui/icons-material/Add';
import { useAllGasStepsByFsec, type CommonGasData } from '@entities/fsec/steps';
import { CategoryBpWorkflowCard } from './components/CategoryBpWorkflowCard';
import { CategoryHpWorkflowCard } from './components/CategoryHpWorkflowCard';
import { CategoryBpHpWorkflowCard } from './components/CategoryBpHpWorkflowCard';
import { CategoryPermeationBpWorkflowCard } from './components/CategoryPermeationBpWorkflowCard';
import { EmptyBpState } from './components/gas-workflow-components';
import { GasStepsModals } from './components/GasStepsModals';
import { useGasStepsModals } from './hooks/useGasStepsModals';
import { useGasStepsMutations } from './hooks/useGasStepsMutations';

interface GasStepsTabProps {
    fsecVersionId: string;
    categoryId: number | null;
    depressurizationFailed: boolean | null;
    onDepressurizationValidationChange: (failed: boolean) => void;
}

export function GasStepsTab({
    fsecVersionId,
    categoryId,
    depressurizationFailed,
    onDepressurizationValidationChange,
}: GasStepsTabProps) {
    // Fetch all gas steps in a single request (6→1 HTTP calls)
    const { data: allGasSteps } = useAllGasStepsByFsec(fsecVersionId);
    const airtightnessSteps = allGasSteps?.airtightnessTestLp;
    const gasFillingBpSteps = allGasSteps?.gasFillingBp;
    const gasFillingHpSteps = allGasSteps?.gasFillingHp;
    const permeationSteps = allGasSteps?.permeation;
    const depressurizationSteps = allGasSteps?.depressurization;
    const repressurizationSteps = allGasSteps?.repressurization;

    // Computed common data
    const firstAirtightness = airtightnessSteps?.[0];
    const firstFilling = gasFillingBpSteps?.[0];

    const computedCommonData: CommonGasData = useMemo(
        () => ({
            gasType: firstAirtightness?.gasType ?? firstFilling?.gasType ?? null,
            leakRateDtri: firstAirtightness?.leakRateDtri ?? firstFilling?.leakRateDtri ?? null,
            testDuration: firstAirtightness?.airtightnessTestDuration ?? firstFilling?.leakTestDuration ?? null,
            experimentPressure: firstAirtightness?.experimentPressure ?? firstFilling?.experimentPressure ?? null,
        }),
        [firstAirtightness, firstFilling],
    );

    // Modal state & handlers (extracted hook)
    const modals = useGasStepsModals();

    // Mutation handlers (extracted hook)
    const mutations = useGasStepsMutations(fsecVersionId, computedCommonData);

    const hasGasSteps = categoryId !== null && categoryId !== 0;

    // Modals block (extracted component)
    const modalsBlock = (
        <GasStepsModals
            openModal={modals.openModal}
            onClose={modals.handleCloseModal}
            fsecVersionId={fsecVersionId}
            computedCommonData={computedCommonData}
            selectedAirtightness={modals.selectedAirtightness}
            selectedGasFillingBp={modals.selectedGasFillingBp}
            selectedGasFillingHp={modals.selectedGasFillingHp}
            selectedPermeation={modals.selectedPermeation}
            selectedDepressurization={modals.selectedDepressurization}
            selectedRepressurization={modals.selectedRepressurization}
            airtightnessSteps={airtightnessSteps}
            gasFillingBpSteps={gasFillingBpSteps}
        />
    );

    // No gas steps
    if (!hasGasSteps) {
        return (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 1 }}>
                <ScienceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    FSEC sans gaz
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Aucune intervention requise pour les gaz
                </Typography>
            </Paper>
        );
    }

    // Category 1: Gaz BP
    if (categoryId === 1) {
        const numBpRubriques = Math.max(airtightnessSteps?.length || 0, gasFillingBpSteps?.length || 0);

        return (
            <>
                <Stack spacing={3}>
                    {numBpRubriques === 0 ? (
                        <EmptyBpState
                            onAdd={mutations.handleAddRubriqueDirectly}
                            isCreating={mutations.isCreatingRubrique}
                        />
                    ) : (
                        <>
                            {Array.from({ length: numBpRubriques }, (_, index) => (
                                <CategoryBpWorkflowCard
                                    key={`bp-rubrique-${index}`}
                                    index={index}
                                    numRubriques={numBpRubriques}
                                    airtightnessStep={airtightnessSteps?.[index]}
                                    fillingStep={gasFillingBpSteps?.[index]}
                                    commonData={computedCommonData}
                                    onEditCommonData={modals.handleOpenCommonDataModal}
                                    onEditAirtightness={modals.handleOpenAirtightnessModal}
                                    onEditFilling={modals.handleOpenGasFillingBpModal}
                                    onDelete={
                                        numBpRubriques > 1
                                            ? () =>
                                                  mutations.handleDeleteRubrique(
                                                      airtightnessSteps?.[index],
                                                      gasFillingBpSteps?.[index],
                                                  )
                                            : undefined
                                    }
                                    isDeleting={mutations.isDeletingRubrique}
                                />
                            ))}
                            <Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={mutations.handleAddRubriqueDirectly}
                                    disabled={mutations.isCreatingRubrique}
                                >
                                    {mutations.isCreatingRubrique
                                        ? 'Création...'
                                        : `Ajouter une rubrique BP (n°${numBpRubriques + 1})`}
                                </Button>
                            </Box>
                        </>
                    )}
                </Stack>
                {modalsBlock}
            </>
        );
    }

    // Category 2: Gaz HP
    if (categoryId === 2) {
        return (
            <>
                <CategoryHpWorkflowCard
                    steps={gasFillingHpSteps}
                    onEdit={modals.handleOpenGasFillingHpModal}
                    onAdd={mutations.handleAddHpRubriqueDirectly}
                    isCreating={mutations.isCreatingHpRubrique}
                />
                {modalsBlock}
            </>
        );
    }

    // Category 3: Gaz BP + HP
    if (categoryId === 3) {
        return (
            <>
                <CategoryBpHpWorkflowCard
                    airtightnessSteps={airtightnessSteps}
                    gasFillingBpSteps={gasFillingBpSteps}
                    gasFillingHpSteps={gasFillingHpSteps}
                    commonData={computedCommonData}
                    onEditCommonData={modals.handleOpenCommonDataModal}
                    onEditAirtightness={modals.handleOpenAirtightnessModal}
                    onEditFillingBp={modals.handleOpenGasFillingBpModal}
                    onEditFillingHp={modals.handleOpenGasFillingHpModal}
                    onDeleteRubrique={mutations.handleDeleteRubrique}
                    onAddRubrique={mutations.handleAddRubriqueDirectly}
                    onAddHpRubrique={mutations.handleAddHpRubriqueDirectly}
                    isCreating={mutations.isCreatingRubrique}
                    isCreatingHp={mutations.isCreatingHpRubrique}
                    isDeleting={mutations.isDeletingRubrique}
                />
                {modalsBlock}
            </>
        );
    }

    // Category 4: Perméation + BP
    if (categoryId === 4) {
        return (
            <>
                <CategoryPermeationBpWorkflowCard
                    airtightnessSteps={airtightnessSteps}
                    gasFillingBpSteps={gasFillingBpSteps}
                    permeationStep={permeationSteps?.[0]}
                    depressurizationStep={depressurizationSteps?.[0]}
                    repressurizationStep={repressurizationSteps?.[0]}
                    depressurizationFailed={depressurizationFailed}
                    commonData={computedCommonData}
                    onEditCommonData={modals.handleOpenCommonDataModal}
                    onEditAirtightness={modals.handleOpenAirtightnessModal}
                    onEditFilling={modals.handleOpenGasFillingBpModal}
                    onEditPermeation={modals.handleOpenPermeationModal}
                    onEditDepressurization={modals.handleOpenDepressurizationModal}
                    onEditRepressurization={modals.handleOpenRepressurizationModal}
                    onValidationChange={onDepressurizationValidationChange}
                    onDeleteRubrique={mutations.handleDeleteRubrique}
                    onAddRubrique={mutations.handleAddRubriqueDirectly}
                    isCreating={mutations.isCreatingRubrique}
                    isDeleting={mutations.isDeletingRubrique}
                />
                {modalsBlock}
            </>
        );
    }

    // Fallback (should not happen)
    return (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
                Catégorie FSEC non supportée
            </Typography>
        </Paper>
    );
}
