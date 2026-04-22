/**
 * All modal dialogs used in the Gas Steps Tab.
 * @module pages/fsec-details/tabs/components
 *
 * Extracted from GasStepsTab to keep file size under 250 lines (R-STYLE-03).
 */

import {
    type AirtightnessStep,
    type GasFillingBpStep,
    type GasFillingHpStep,
    type PermeationStep,
    type DepressurizationStep,
    type RepressurizationStep,
    type CommonGasData,
} from '@entities/fsec/steps';
import { AirtightnessStepModal } from '@features/fsec/edit-airtightness';
import { GasFillingBpStepModal } from '@features/fsec/edit-gas-filling-bp';
import { GasFillingHpStepModal } from '@features/fsec/edit-gas-filling-hp';
import { PermeationStepModal } from '@features/fsec/edit-permeation';
import { DepressurizationStepModal } from '@features/fsec/edit-depressurization';
import { RepressurizationStepModal } from '@features/fsec/edit-repressurization';
import { CommonGasDataModal } from '@features/fsec/edit-common-gas-data';
import { type ModalType } from '../hooks/useGasStepsModals';

interface GasStepsModalsProps {
    openModal: ModalType;
    onClose: () => void;
    fsecVersionId: string;
    computedCommonData: CommonGasData;
    selectedAirtightness?: AirtightnessStep;
    selectedGasFillingBp?: GasFillingBpStep;
    selectedGasFillingHp?: GasFillingHpStep;
    selectedPermeation?: PermeationStep;
    selectedDepressurization?: DepressurizationStep;
    selectedRepressurization?: RepressurizationStep;
    airtightnessSteps?: AirtightnessStep[];
    gasFillingBpSteps?: GasFillingBpStep[];
}

export function GasStepsModals({
    openModal,
    onClose,
    fsecVersionId,
    computedCommonData,
    selectedAirtightness,
    selectedGasFillingBp,
    selectedGasFillingHp,
    selectedPermeation,
    selectedDepressurization,
    selectedRepressurization,
    airtightnessSteps,
    gasFillingBpSteps,
}: GasStepsModalsProps) {
    return (
        <>
            {openModal === 'airtightness' && (
                <AirtightnessStepModal
                    open={true}
                    onClose={onClose}
                    fsecVersionId={fsecVersionId}
                    step={selectedAirtightness}
                    commonData={{
                        gasType: computedCommonData.gasType,
                        leakRateDtri: computedCommonData.leakRateDtri,
                        experimentPressure: computedCommonData.experimentPressure,
                        airtightnessTestDuration: computedCommonData.testDuration,
                    }}
                />
            )}
            {openModal === 'gasFillingBp' && (
                <GasFillingBpStepModal
                    open={true}
                    onClose={onClose}
                    fsecVersionId={fsecVersionId}
                    step={selectedGasFillingBp}
                    commonData={{
                        gasType: computedCommonData.gasType,
                        leakRateDtri: computedCommonData.leakRateDtri,
                        experimentPressure: computedCommonData.experimentPressure,
                        leakTestDuration: computedCommonData.testDuration,
                    }}
                />
            )}
            {openModal === 'gasFillingHp' && (
                <GasFillingHpStepModal
                    open={true}
                    onClose={onClose}
                    fsecVersionId={fsecVersionId}
                    step={selectedGasFillingHp}
                />
            )}
            {openModal === 'permeation' && (
                <PermeationStepModal
                    open={true}
                    onClose={onClose}
                    fsecVersionId={fsecVersionId}
                    step={selectedPermeation}
                />
            )}
            {openModal === 'depressurization' && (
                <DepressurizationStepModal
                    open={true}
                    onClose={onClose}
                    fsecVersionId={fsecVersionId}
                    step={selectedDepressurization}
                />
            )}
            {openModal === 'repressurization' && (
                <RepressurizationStepModal
                    open={true}
                    onClose={onClose}
                    fsecVersionId={fsecVersionId}
                    step={selectedRepressurization}
                />
            )}
            {openModal === 'commonData' && (
                <CommonGasDataModal
                    open={true}
                    onClose={onClose}
                    fsecVersionId={fsecVersionId}
                    commonData={computedCommonData}
                    airtightnessSteps={airtightnessSteps}
                    gasFillingBpSteps={gasFillingBpSteps}
                />
            )}
        </>
    );
}
