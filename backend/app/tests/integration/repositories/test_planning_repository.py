"""
Tests d'integration pour le repository Planning.

Ces tests utilisent la base de donnees Django pour verifier
les operations CRUD reelles sur toutes les entites planning.
"""

import uuid
from datetime import date

import pytest

from app.domain.planning.models.lab_event_bean import LabEventBean
from app.domain.planning.models.lab_machine_bean import LabMachineBean
from app.domain.planning.models.lab_salle_bean import LabSalleBean
from app.domain.planning.models.planning_campaign_step_bean import (
    PlanningCampaignStepBean,
)
from app.domain.planning.models.planning_cell_annotation_bean import (
    PlanningCellAnnotationBean,
)
from app.domain.planning.models.planning_fsec_cell_link_bean import (
    PlanningFsecCellLinkBean,
)
from app.domain.planning.models.planning_member_period_bean import (
    PlanningMemberPeriodBean,
)
from app.domain.planning.models.planning_week_state_bean import PlanningWeekStateBean
from app.repository.campaign.models.campaign_entity import CampaignEntity
from app.repository.fsec.models.fsec_entity import FsecEntity
from app.repository.planning.models.lab_salle_entity import LabSalleEntity
from app.repository.planning.repositories.planning_repository import PlanningRepository


@pytest.fixture
def planning_repository():
    """Instance du repository Planning."""
    return PlanningRepository()


@pytest.fixture
def campaign(db):
    """Campagne de test pour les entites avec FK campaign."""
    return CampaignEntity.objects.create(
        type_id_id=0,
        status_id_id=0,
        installation_id_id=0,
        name="Test Campaign Planning",
        year=2025,
        semester="S1",
    )


@pytest.fixture
def fsec(db, campaign):
    """FSEC de test pour les liens planning."""
    return FsecEntity.objects.create(
        campaign_id=campaign,
        status_id_id=0,
        category_id_id=0,
        name="FSEC Test Planning",
    )


@pytest.fixture
def salle(db):
    """Salle de test pour les machines."""
    return LabSalleEntity.objects.create(name="A1")


# ============================================================================
# WEEK STATE TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestPlanningRepositoryWeekState:
    """Tests CRUD pour les etats de semaine."""

    def test_upsert_week_state_create(self, planning_repository):
        """Test creation via upsert d'un nouvel etat de semaine."""
        bean = PlanningWeekStateBean(year=2025, week_num=10, state="vacances")

        result = planning_repository.upsert_week_state(bean)

        assert result.uuid is not None
        assert result.year == 2025
        assert result.week_num == 10
        assert result.state == "vacances"

    def test_upsert_week_state_update(self, planning_repository):
        """Test mise a jour via upsert d'un etat existant."""
        bean = PlanningWeekStateBean(year=2025, week_num=10, state="vacances")
        created = planning_repository.upsert_week_state(bean)

        # Upsert avec meme year/week_num mais etat different
        bean_update = PlanningWeekStateBean(year=2025, week_num=10, state="fermeture")
        updated = planning_repository.upsert_week_state(bean_update)

        assert updated.uuid == created.uuid
        assert updated.state == "fermeture"

    def test_get_week_states_by_year(self, planning_repository):
        """Test recuperation des etats par annee."""
        planning_repository.upsert_week_state(
            PlanningWeekStateBean(year=2025, week_num=10, state="vacances")
        )
        planning_repository.upsert_week_state(
            PlanningWeekStateBean(year=2025, week_num=20, state="fermeture")
        )
        planning_repository.upsert_week_state(
            PlanningWeekStateBean(year=2026, week_num=5, state="vacances")
        )

        results = planning_repository.get_week_states_by_year(2025)

        assert len(results) == 2
        weeks = {r.week_num for r in results}
        assert weeks == {10, 20}

    def test_delete_week_state(self, planning_repository):
        """Test suppression d'un etat de semaine."""
        bean = PlanningWeekStateBean(year=2025, week_num=10, state="vacances")
        created = planning_repository.upsert_week_state(bean)

        result = planning_repository.delete_week_state(created.uuid)

        assert result is True
        assert planning_repository.get_week_states_by_year(2025) == []

    def test_delete_week_state_not_found(self, planning_repository):
        """Test suppression d'un etat inexistant."""
        fake_uuid = uuid.uuid4()

        result = planning_repository.delete_week_state(fake_uuid)

        assert result is False


# ============================================================================
# MEMBER PERIOD TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestPlanningRepositoryMemberPeriod:
    """Tests CRUD pour les periodes de membres."""

    def test_create_member_period(self, planning_repository):
        """Test creation d'une periode."""
        bean = PlanningMemberPeriodBean(
            member_name="Jean Dupont",
            member_role="Assembleur",
            year=2025,
            period_type="congés",
            start_date=date(2025, 7, 1),
            end_date=date(2025, 7, 15),
        )

        result = planning_repository.create_member_period(bean)

        assert result.uuid is not None
        assert result.member_name == "Jean Dupont"
        assert result.member_role == "Assembleur"
        assert result.period_type == "congés"
        assert result.start_date == date(2025, 7, 1)
        assert result.end_date == date(2025, 7, 15)

    def test_get_member_periods_by_year(self, planning_repository):
        """Test recuperation des periodes par annee."""
        planning_repository.create_member_period(
            PlanningMemberPeriodBean(
                member_name="Jean Dupont",
                member_role="Assembleur",
                year=2025,
                period_type="congés",
                start_date=date(2025, 7, 1),
                end_date=date(2025, 7, 15),
            )
        )
        planning_repository.create_member_period(
            PlanningMemberPeriodBean(
                member_name="Marie Martin",
                member_role="Assembleur",
                year=2026,
                period_type="mission",
                start_date=date(2026, 3, 1),
                end_date=date(2026, 3, 10),
            )
        )

        results = planning_repository.get_member_periods_by_year(2025)

        assert len(results) == 1
        assert results[0].member_name == "Jean Dupont"

    def test_update_member_period(self, planning_repository):
        """Test mise a jour d'une periode."""
        bean = PlanningMemberPeriodBean(
            member_name="Jean Dupont",
            member_role="Assembleur",
            year=2025,
            period_type="congés",
            start_date=date(2025, 7, 1),
            end_date=date(2025, 7, 15),
        )
        created = planning_repository.create_member_period(bean)

        updated_bean = PlanningMemberPeriodBean(
            member_name="Jean Dupont",
            member_role="Assembleur",
            year=2025,
            period_type="mission",
            commentaire="Deplacement",
            start_date=date(2025, 8, 1),
            end_date=date(2025, 8, 10),
        )
        result = planning_repository.update_member_period(created.uuid, updated_bean)

        assert result is not None
        assert result.period_type == "mission"
        assert result.commentaire == "Deplacement"
        assert result.start_date == date(2025, 8, 1)

    def test_update_member_period_not_found(self, planning_repository):
        """Test mise a jour d'une periode inexistante."""
        fake_uuid = uuid.uuid4()
        bean = PlanningMemberPeriodBean(
            member_name="Jean Dupont",
            member_role="Assembleur",
            year=2025,
            period_type="congés",
            start_date=date(2025, 7, 1),
            end_date=date(2025, 7, 15),
        )

        result = planning_repository.update_member_period(fake_uuid, bean)

        assert result is None

    def test_delete_member_period(self, planning_repository):
        """Test suppression d'une periode."""
        bean = PlanningMemberPeriodBean(
            member_name="Jean Dupont",
            member_role="Assembleur",
            year=2025,
            period_type="congés",
            start_date=date(2025, 7, 1),
            end_date=date(2025, 7, 15),
        )
        created = planning_repository.create_member_period(bean)

        result = planning_repository.delete_member_period(created.uuid)

        assert result is True
        assert planning_repository.get_member_periods_by_year(2025) == []


# ============================================================================
# CELL ANNOTATION TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestPlanningRepositoryCellAnnotation:
    """Tests CRUD pour les annotations de cellules."""

    def test_upsert_cell_annotation_create(self, planning_repository, campaign):
        """Test creation via upsert d'une annotation."""
        bean = PlanningCellAnnotationBean(
            campaign_uuid=campaign.uuid,
            step_label="Assemblage",
            year=2025,
            week_num=10,
            text="Note de test",
        )

        result = planning_repository.upsert_cell_annotation(bean)

        assert result.uuid is not None
        assert result.campaign_uuid == campaign.uuid
        assert result.step_label == "Assemblage"
        assert result.text == "Note de test"

    def test_get_cell_annotations_by_year(self, planning_repository, campaign):
        """Test recuperation des annotations par annee."""
        planning_repository.upsert_cell_annotation(
            PlanningCellAnnotationBean(
                campaign_uuid=campaign.uuid,
                step_label="Assemblage",
                year=2025,
                week_num=10,
                text="Note 1",
            )
        )
        planning_repository.upsert_cell_annotation(
            PlanningCellAnnotationBean(
                campaign_uuid=campaign.uuid,
                step_label="Métrologie",
                year=2025,
                week_num=12,
                text="Note 2",
            )
        )

        results = planning_repository.get_cell_annotations_by_year(2025)

        assert len(results) == 2

    def test_delete_cell_annotation(self, planning_repository, campaign):
        """Test suppression d'une annotation."""
        bean = PlanningCellAnnotationBean(
            campaign_uuid=campaign.uuid,
            step_label="Assemblage",
            year=2025,
            week_num=10,
            text="Note a supprimer",
        )
        created = planning_repository.upsert_cell_annotation(bean)

        result = planning_repository.delete_cell_annotation(created.uuid)

        assert result is True
        assert planning_repository.get_cell_annotations_by_year(2025) == []


# ============================================================================
# FSEC CELL LINK TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestPlanningRepositoryFsecCellLink:
    """Tests CRUD pour les liens FSEC -> cellule planning."""

    def test_create_fsec_cell_link(self, planning_repository, campaign, fsec):
        """Test creation d'un lien FSEC."""
        bean = PlanningFsecCellLinkBean(
            campaign_uuid=campaign.uuid,
            step_label="Assemblage",
            year=2025,
            week_num=10,
            fsec_uuid=fsec.version_uuid,
        )

        result = planning_repository.create_fsec_cell_link(bean)

        assert result.uuid is not None
        assert result.campaign_uuid == campaign.uuid
        assert result.fsec_uuid == fsec.version_uuid

    def test_get_fsec_cell_links_by_year(self, planning_repository, campaign, fsec):
        """Test recuperation des liens par annee."""
        planning_repository.create_fsec_cell_link(
            PlanningFsecCellLinkBean(
                campaign_uuid=campaign.uuid,
                step_label="Assemblage",
                year=2025,
                week_num=10,
                fsec_uuid=fsec.version_uuid,
            )
        )
        planning_repository.create_fsec_cell_link(
            PlanningFsecCellLinkBean(
                campaign_uuid=campaign.uuid,
                step_label="Métrologie",
                year=2025,
                week_num=12,
                fsec_uuid=fsec.version_uuid,
            )
        )

        results = planning_repository.get_fsec_cell_links_by_year(2025)

        assert len(results) == 2

    def test_delete_fsec_cell_link(self, planning_repository, campaign, fsec):
        """Test suppression d'un lien FSEC."""
        bean = PlanningFsecCellLinkBean(
            campaign_uuid=campaign.uuid,
            step_label="Assemblage",
            year=2025,
            week_num=10,
            fsec_uuid=fsec.version_uuid,
        )
        created = planning_repository.create_fsec_cell_link(bean)

        result = planning_repository.delete_fsec_cell_link(created.uuid)

        assert result is True
        assert planning_repository.get_fsec_cell_links_by_year(2025) == []


# ============================================================================
# CAMPAIGN STEP TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestPlanningRepositoryCampaignStep:
    """Tests CRUD pour les etapes programmees des campagnes."""

    def test_create_campaign_step(self, planning_repository, campaign, fsec):
        """Test creation d'une etape programmee."""
        bean = PlanningCampaignStepBean(
            campaign_uuid=campaign.uuid,
            fsec_uuid=fsec.version_uuid,
            step_label="Assemblage",
            year=2025,
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 15),
        )

        result = planning_repository.create_campaign_step(bean)

        assert result.uuid is not None
        assert result.campaign_uuid == campaign.uuid
        assert result.fsec_uuid == fsec.version_uuid
        assert result.step_label == "Assemblage"
        assert result.start_date == date(2025, 3, 1)
        assert result.end_date == date(2025, 3, 15)

    def test_get_campaign_steps_by_year(self, planning_repository, campaign, fsec):
        """Test recuperation des etapes par annee."""
        planning_repository.create_campaign_step(
            PlanningCampaignStepBean(
                campaign_uuid=campaign.uuid,
                fsec_uuid=fsec.version_uuid,
                step_label="Assemblage",
                year=2025,
                start_date=date(2025, 3, 1),
                end_date=date(2025, 3, 15),
            )
        )
        planning_repository.create_campaign_step(
            PlanningCampaignStepBean(
                campaign_uuid=campaign.uuid,
                fsec_uuid=fsec.version_uuid,
                step_label="Métrologie",
                year=2025,
                start_date=date(2025, 4, 1),
                end_date=date(2025, 4, 15),
            )
        )

        results = planning_repository.get_campaign_steps_by_year(2025)

        assert len(results) == 2

    def test_update_campaign_step(self, planning_repository, campaign, fsec):
        """Test mise a jour d'une etape programmee."""
        bean = PlanningCampaignStepBean(
            campaign_uuid=campaign.uuid,
            fsec_uuid=fsec.version_uuid,
            step_label="Assemblage",
            year=2025,
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 15),
        )
        created = planning_repository.create_campaign_step(bean)

        updated_bean = PlanningCampaignStepBean(
            campaign_uuid=campaign.uuid,
            fsec_uuid=fsec.version_uuid,
            step_label="Assemblage",
            year=2025,
            start_date=date(2025, 3, 5),
            end_date=date(2025, 3, 20),
        )
        result = planning_repository.update_campaign_step(created.uuid, updated_bean)

        assert result is not None
        assert result.start_date == date(2025, 3, 5)
        assert result.end_date == date(2025, 3, 20)

    def test_delete_campaign_step(self, planning_repository, campaign, fsec):
        """Test suppression d'une etape programmee."""
        bean = PlanningCampaignStepBean(
            campaign_uuid=campaign.uuid,
            fsec_uuid=fsec.version_uuid,
            step_label="Assemblage",
            year=2025,
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 15),
        )
        created = planning_repository.create_campaign_step(bean)

        result = planning_repository.delete_campaign_step(created.uuid)

        assert result is True
        assert planning_repository.get_campaign_steps_by_year(2025) == []


# ============================================================================
# LAB SALLE TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestPlanningRepositoryLabSalle:
    """Tests CRUD pour les salles du laboratoire."""

    def test_create_salle(self, planning_repository):
        """Test creation d'une salle."""
        bean = LabSalleBean(name="B2", sort_order=1)

        result = planning_repository.create_salle(bean)

        assert result.uuid is not None
        assert result.name == "B2"
        assert result.sort_order == 1

    def test_get_all_salles(self, planning_repository):
        """Test recuperation de toutes les salles avec machines imbriquees."""
        salle_bean = LabSalleBean(name="C3")
        created_salle = planning_repository.create_salle(salle_bean)

        machine_bean = LabMachineBean(
            salle_uuid=created_salle.uuid, name="Machine Test"
        )
        planning_repository.create_machine(machine_bean)

        results = planning_repository.get_all_salles()

        assert len(results) >= 1
        target_salle = next(s for s in results if s.uuid == created_salle.uuid)
        assert len(target_salle.machines) == 1
        assert target_salle.machines[0].name == "Machine Test"

    def test_update_salle(self, planning_repository):
        """Test mise a jour d'une salle."""
        bean = LabSalleBean(name="D4")
        created = planning_repository.create_salle(bean)

        updated_bean = LabSalleBean(name="D4 Rename", sort_order=5)
        result = planning_repository.update_salle(created.uuid, updated_bean)

        assert result is not None
        assert result.name == "D4 Rename"
        assert result.sort_order == 5

    def test_delete_salle(self, planning_repository):
        """Test suppression d'une salle."""
        bean = LabSalleBean(name="E5")
        created = planning_repository.create_salle(bean)

        result = planning_repository.delete_salle(created.uuid)

        assert result is True


# ============================================================================
# LAB MACHINE TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestPlanningRepositoryLabMachine:
    """Tests CRUD pour les machines du laboratoire."""

    def test_create_machine(self, planning_repository, salle):
        """Test creation d'une machine."""
        bean = LabMachineBean(salle_uuid=salle.uuid, name="Machine 1")

        result = planning_repository.create_machine(bean)

        assert result.uuid is not None
        assert result.salle_uuid == salle.uuid
        assert result.name == "Machine 1"

    def test_update_machine(self, planning_repository, salle):
        """Test mise a jour d'une machine."""
        bean = LabMachineBean(salle_uuid=salle.uuid, name="Machine 1")
        created = planning_repository.create_machine(bean)

        updated_bean = LabMachineBean(
            salle_uuid=salle.uuid,
            name="Machine 1 Rename",
            sort_order=3,
        )
        result = planning_repository.update_machine(created.uuid, updated_bean)

        assert result is not None
        assert result.name == "Machine 1 Rename"
        assert result.sort_order == 3

    def test_delete_machine(self, planning_repository, salle):
        """Test suppression d'une machine."""
        bean = LabMachineBean(salle_uuid=salle.uuid, name="Machine 1")
        created = planning_repository.create_machine(bean)

        result = planning_repository.delete_machine(created.uuid)

        assert result is True


# ============================================================================
# LAB EVENT TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestPlanningRepositoryLabEvent:
    """Tests CRUD pour les evenements du laboratoire."""

    @pytest.fixture
    def machine(self, planning_repository, salle):
        """Machine de test pour les evenements."""
        bean = LabMachineBean(salle_uuid=salle.uuid, name="Machine Evt")
        return planning_repository.create_machine(bean)

    def test_create_lab_event(self, planning_repository, machine):
        """Test creation d'un evenement."""
        bean = LabEventBean(
            machine_uuid=machine.uuid,
            category="Maintenance",
            description="Nettoyage",
            start_date=date(2025, 4, 1),
            end_date=date(2025, 4, 3),
        )

        result = planning_repository.create_lab_event(bean)

        assert result.uuid is not None
        assert result.machine_uuid == machine.uuid
        assert result.category == "Maintenance"
        assert result.description == "Nettoyage"
        assert result.start_date == date(2025, 4, 1)
        assert result.end_date == date(2025, 4, 3)

    def test_get_all_lab_events(self, planning_repository, machine):
        """Test recuperation de tous les evenements."""
        planning_repository.create_lab_event(
            LabEventBean(
                machine_uuid=machine.uuid,
                category="Maintenance",
                description="Evt 1",
                start_date=date(2025, 4, 1),
                end_date=date(2025, 4, 3),
            )
        )
        planning_repository.create_lab_event(
            LabEventBean(
                machine_uuid=machine.uuid,
                category="Panne",
                description="Evt 2",
                start_date=date(2025, 5, 1),
                end_date=date(2025, 5, 2),
            )
        )

        results = planning_repository.get_all_lab_events()

        assert len(results) >= 2

    def test_update_lab_event(self, planning_repository, machine):
        """Test mise a jour d'un evenement."""
        bean = LabEventBean(
            machine_uuid=machine.uuid,
            category="Maintenance",
            description="Initial",
            start_date=date(2025, 4, 1),
            end_date=date(2025, 4, 3),
        )
        created = planning_repository.create_lab_event(bean)

        updated_bean = LabEventBean(
            machine_uuid=machine.uuid,
            category="Panne",
            description="Modifie",
            start_date=date(2025, 4, 2),
            end_date=date(2025, 4, 5),
        )
        result = planning_repository.update_lab_event(created.uuid, updated_bean)

        assert result is not None
        assert result.category == "Panne"
        assert result.description == "Modifie"
        assert result.start_date == date(2025, 4, 2)

    def test_delete_lab_event(self, planning_repository, machine):
        """Test suppression d'un evenement."""
        bean = LabEventBean(
            machine_uuid=machine.uuid,
            category="Maintenance",
            description="A supprimer",
            start_date=date(2025, 4, 1),
            end_date=date(2025, 4, 3),
        )
        created = planning_repository.create_lab_event(bean)

        result = planning_repository.delete_lab_event(created.uuid)

        assert result is True
