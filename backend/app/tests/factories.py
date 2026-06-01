"""
Factory classes for test data generation.

Uses factory_boy for consistent, reproducible test data.
Each factory creates domain Beans with sensible defaults.
"""

import uuid
from datetime import date, datetime

import factory
from factory import Factory, LazyFunction, Sequence

# ============================================================================
# CAMPAIGN FACTORIES
# ============================================================================


class CampaignBeanFactory(Factory):
    """Factory for CampaignBean."""

    class Meta:
        model = "app.domain.campaign.models.campaign_bean.CampaignBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    type_id = 0
    status_id = 0
    installation_id = 0
    name = Sequence(lambda n: f"Campagne Test {n}")
    year = 2025
    semester = "S1"
    last_updated = None
    start_date = LazyFunction(lambda: date(2025, 1, 15))
    end_date = LazyFunction(lambda: date(2025, 6, 30))
    dtri_number = Sequence(lambda n: 10000 + n)
    description = "Campagne de test générée automatiquement"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override to import model dynamically."""
        from app.domain.campaign.models.campaign_bean import CampaignBean

        return CampaignBean(**kwargs)


class CampaignTeamsBeanFactory(Factory):
    """Factory for CampaignTeamsBean."""

    class Meta:
        model = "app.domain.campaign.models.campaign_teams_bean.CampaignTeamsBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    campaign_id = LazyFunction(lambda: str(uuid.uuid4()))
    role_id = 0
    trigram = Sequence(lambda n: f"TRG{n:03d}")
    first_name = Sequence(lambda n: f"Prénom{n}")
    last_name = Sequence(lambda n: f"Nom{n}")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.campaign.models.campaign_teams_bean import CampaignTeamsBean

        return CampaignTeamsBean(**kwargs)


class CampaignDocumentsBeanFactory(Factory):
    """Factory for CampaignDocumentsBean."""

    class Meta:
        model = (
            "app.domain.campaign.models.campaign_documents_bean.CampaignDocumentsBean"
        )

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    campaign_id = LazyFunction(lambda: str(uuid.uuid4()))
    type_id = 0
    subtype_id = None
    file_name = Sequence(lambda n: f"document_{n}.pdf")
    file_path = Sequence(lambda n: f"/documents/campaign/document_{n}.pdf")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.campaign.models.campaign_documents_bean import (
            CampaignDocumentsBean,
        )

        return CampaignDocumentsBean(**kwargs)


# ============================================================================
# FSEC FACTORIES
# ============================================================================


class FsecBeanFactory(Factory):
    """Factory for FsecBean."""

    class Meta:
        model = "app.domain.fsec.models.fsec_bean.FsecBean"

    version_uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_uuid = LazyFunction(lambda: str(uuid.uuid4()))
    campaign_id = LazyFunction(lambda: str(uuid.uuid4()))
    status_id = 0
    category_id = 0
    rack_id = 0
    name = Sequence(lambda n: f"FSEC Test {n}")
    comments = "FSEC de test"
    is_active = True
    delivery_date = LazyFunction(lambda: date(2025, 3, 1))
    shooting_date = None
    preshooting_pressure = None
    experience_srxx = None
    localisation = None
    depressurization_failed = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.fsec.models.fsec_bean import FsecBean

        return FsecBean(**kwargs)


class FsecTeamsBeanFactory(Factory):
    """Factory for FsecTeamsBean."""

    class Meta:
        model = "app.domain.fsec.models.fsec_teams_bean.FsecTeamsBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    role_id = 0
    trigram = Sequence(lambda n: f"FSE{n:03d}")
    first_name = Sequence(lambda n: f"Agent{n}")
    last_name = Sequence(lambda n: f"FSEC{n}")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.fsec.models.fsec_teams_bean import FsecTeamsBean

        return FsecTeamsBean(**kwargs)


class FsecDocumentsBeanFactory(Factory):
    """Factory for FsecDocumentsBean."""

    class Meta:
        model = "app.domain.fsec.models.fsec_documents_bean.FsecDocumentsBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    type_id = 0
    subtype_id = None
    file_name = Sequence(lambda n: f"fsec_doc_{n}.pdf")
    file_path = Sequence(lambda n: f"/documents/fsec/fsec_doc_{n}.pdf")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.fsec.models.fsec_documents_bean import FsecDocumentsBean

        return FsecDocumentsBean(**kwargs)


# ============================================================================
# FA FACTORIES
# ============================================================================


class FaBeanFactory(Factory):
    """Factory for FaBean."""

    class Meta:
        model = "app.domain.fa.models.fa_bean.FaBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    status_id = 0
    type_id = 0
    criticality_id = 0
    identifier = Sequence(lambda n: f"FA-2025-{n:04d}")
    fsec_step_id = None
    fsec_step_other = None
    discoverer = "Test Discoverer"
    event_date = LazyFunction(lambda: date(2025, 3, 1))
    observation = "Observation de test"
    location_equipment = "Équipement A"
    quick_analysis = "Analyse rapide de test"
    immediate_measures = None
    iec_validation_open = False
    iec_validation_open_date = None
    iec_validation_open_name = None
    cause = None
    experience_impact = None
    iec_validation_progress = False
    iec_validation_progress_name = None
    closure_validation = None
    closure_date = None
    closure_validator_name = None
    created_at = LazyFunction(datetime.now)
    last_updated = LazyFunction(datetime.now)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.fa.models.fa_bean import FaBean

        return FaBean(**kwargs)


# ============================================================================
# STEP FACTORIES
# ============================================================================


class AssemblyStepBeanFactory(Factory):
    """Factory for AssemblyStepBean."""

    class Meta:
        model = "app.domain.steps.models.assembly_step_bean.AssemblyStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    operator = "Assembleur Test"
    operator_user_uuid = None
    operator_user_uuids = factory.LazyFunction(list)
    start_date = LazyFunction(lambda: date(2025, 2, 1))
    end_date = LazyFunction(lambda: date(2025, 2, 15))
    comments = "Assemblage de test"
    machine_uuids = factory.LazyFunction(list)
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.assembly_step_bean import AssemblyStepBean

        return AssemblyStepBean(**kwargs)


class MetrologyStepBeanFactory(Factory):
    """Factory for MetrologyStepBean."""

    class Meta:
        model = "app.domain.steps.models.metrology_step_bean.MetrologyStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    metrologist_user_uuids = factory.LazyFunction(list)
    machine_uuids = factory.LazyFunction(list)
    date = LazyFunction(lambda: date(2025, 2, 20))
    comments = "Métrologie de test"
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.metrology_step_bean import MetrologyStepBean

        return MetrologyStepBean(**kwargs)


class SealingStepBeanFactory(Factory):
    """Factory for SealingStepBean."""

    class Meta:
        model = "app.domain.steps.models.sealing_step_bean.SealingStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    interface_io = "INTERFACE_01"
    comments = "Scellement de test"
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.sealing_step_bean import SealingStepBean

        return SealingStepBean(**kwargs)


class PicturesStepBeanFactory(Factory):
    """Factory for PicturesStepBean."""

    class Meta:
        model = "app.domain.steps.models.pictures_step_bean.PicturesStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    last_updated = LazyFunction(lambda: date(2025, 3, 1))
    comments = "Photos de test"
    created_at = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.pictures_step_bean import PicturesStepBean

        return PicturesStepBean(**kwargs)


class AirtightnessTestLpStepBeanFactory(Factory):
    """Factory for AirtightnessTestLpStepBean."""

    class Meta:
        model = "app.domain.steps.models.airtightness_test_lp_step_bean.AirtightnessTestLpStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    leak_rate_dtri = "0.001"
    gas_type = "Helium"
    experiment_pressure = 1.5
    airtightness_test_duration = 120.0
    operator = "Test Operator"
    date_of_fulfilment = LazyFunction(lambda: date(2025, 3, 5))
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.airtightness_test_lp_step_bean import (
            AirtightnessTestLpStepBean,
        )

        return AirtightnessTestLpStepBean(**kwargs)


class GasFillingBpStepBeanFactory(Factory):
    """Factory for GasFillingBpStepBean."""

    class Meta:
        model = "app.domain.steps.models.gas_filling_bp_step_bean.GasFillingBpStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    leak_rate_dtri = "0.002"
    gas_type = "Azote"
    experiment_pressure = 2.0
    leak_test_duration = 60.0
    operator = "Test Operator BP"
    date_of_fulfilment = LazyFunction(lambda: date(2025, 3, 10))
    gas_base = 1
    gas_container = 2
    observations = "Test observations BP"
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.gas_filling_bp_step_bean import (
            GasFillingBpStepBean,
        )

        return GasFillingBpStepBean(**kwargs)


class GasFillingHpStepBeanFactory(Factory):
    """Factory for GasFillingHpStepBean."""

    class Meta:
        model = "app.domain.steps.models.gas_filling_hp_step_bean.GasFillingHpStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    leak_rate_dtri = "0.003"
    gas_type = "Helium"
    experiment_pressure = 10.0
    leak_test_duration = 90.0
    operator = "Test Operator HP"
    date_of_fulfilment = LazyFunction(lambda: date(2025, 3, 15))
    gas_base = 1
    gas_container = 3
    observations = "Test observations HP"
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.gas_filling_hp_step_bean import (
            GasFillingHpStepBean,
        )

        return GasFillingHpStepBean(**kwargs)


class PermeationStepBeanFactory(Factory):
    """Factory for PermeationStepBean."""

    class Meta:
        model = "app.domain.steps.models.permeation_step_bean.PermeationStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    leak_rate_dtri = "0.0001"
    gas_type = "Helium"
    experiment_pressure = 5.0
    permeation_test_duration = 240.0
    operator = "Test Operator Permeation"
    date_of_fulfilment = LazyFunction(lambda: date(2025, 3, 20))
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.permeation_step_bean import PermeationStepBean

        return PermeationStepBean(**kwargs)


class DepressurizationStepBeanFactory(Factory):
    """Factory for DepressurizationStepBean."""

    class Meta:
        model = "app.domain.steps.models.depressurization_step_bean.DepressurizationStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    initial_pressure = 10.0
    final_pressure = 1.0
    depressurization_duration = 30.0
    operator = "Test Operator Depressurization"
    date_of_fulfilment = LazyFunction(lambda: date(2025, 3, 25))
    observations = "Test depressurization"
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.depressurization_step_bean import (
            DepressurizationStepBean,
        )

        return DepressurizationStepBean(**kwargs)


class RepressurizationStepBeanFactory(Factory):
    """Factory for RepressurizationStepBean."""

    class Meta:
        model = "app.domain.steps.models.repressurization_step_bean.RepressurizationStepBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    fsec_version_id = LazyFunction(lambda: str(uuid.uuid4()))
    initial_pressure = 1.0
    final_pressure = 10.0
    repressurization_duration = 45.0
    operator = "Test Operator Repressurization"
    date_of_fulfilment = LazyFunction(lambda: date(2025, 3, 30))
    observations = "Test repressurization"
    created_at = None
    last_updated = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.steps.models.repressurization_step_bean import (
            RepressurizationStepBean,
        )

        return RepressurizationStepBean(**kwargs)


# ============================================================================
# EMBASE FACTORIES
# ============================================================================


class EmbaseBeanFactory(Factory):
    """Factory for EmbaseBean."""

    class Meta:
        model = "app.domain.embase.models.embase_bean.EmbaseBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    identifier = Sequence(lambda n: f"G{n:02d}")
    type = "jet_de_gaz"
    nombre_voies = 1
    soufflet_v1 = ""
    capteur_v1 = ""
    offset_v1_mv = None
    mesurande_lie_v1_mv = None
    sensibilite_v1_mv = None
    signal_meteociel_v1_mv = None
    capteur_cible_pfeiffer_mbar = None
    etendue_v1_mbar = None
    test_etancheite_he = ""
    test_capteur_mrg = ""
    etalonnage_date = None
    observations_v1 = ""
    operationnelle_aimant = False
    operationnelle_broche = False
    localisation_actuelle = ""
    cote_ve = None
    decalage_angulaire = ""
    chargement_mcc = ""
    soufflet_v2 = ""
    capteur_v2 = ""
    offset_v2_mv = None
    mesurande_lie_v2_mv = None
    sensibilite_v2_mv = None
    signal_meteociel_v2_mv = None
    capteur_cible_pfeiffer_v2_mbar = None
    etendue_v2_mbar = None
    test_etancheite_he_v2 = ""
    test_capteur_mrg_v2 = ""
    observations_v2 = ""
    electrovanne = False
    fsec_history = ""

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.embase.models.embase_bean import EmbaseBean

        return EmbaseBean(**kwargs)


class EtalonnageBeanFactory(Factory):
    """Factory for EtalonnageBean."""

    class Meta:
        model = "app.domain.embase.models.etalonnage_bean.EtalonnageBean"

    uuid = LazyFunction(lambda: str(uuid.uuid4()))
    embase_uuid = LazyFunction(lambda: str(uuid.uuid4()))
    voie = 1
    offset_0_bar_mv = None
    mesurande_0_bar_lie = None
    signal_etendue_mv = None
    signal_pa_meteociel = None
    date = LazyFunction(lambda: date(2025, 3, 1))
    operateur = "Opérateur Test"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from app.domain.embase.models.etalonnage_bean import EtalonnageBean

        return EtalonnageBean(**kwargs)
