"""
Tests d'integration pour les controllers Planning.

Ces tests verifient les endpoints API REST avec des requetes HTTP reelles
pour toutes les entites du module planning.
"""

import json
import uuid

import pytest

from app.repository.campaign.models.campaign_entity import CampaignEntity
from app.repository.fsec.models.fsec_entity import FsecEntity
from app.repository.planning.models.lab_machine_entity import LabMachineEntity
from app.repository.planning.models.lab_salle_entity import LabSalleEntity

BASE_URL = "/api/v1/planning"


@pytest.fixture
def campaign(db):
    """Campagne de test pour les entites avec FK campaign."""
    return CampaignEntity.objects.create(
        type_id_id=0,
        status_id_id=0,
        installation_id_id=0,
        name=f"Campaign Planning Test {uuid.uuid4().hex[:8]}",
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
        name="FSEC Test Planning Controller",
    )


@pytest.fixture
def salle(db):
    """Salle de test pour les machines."""
    return LabSalleEntity.objects.create(name="A1")


@pytest.fixture
def machine(db, salle):
    """Machine de test pour les evenements."""
    return LabMachineEntity.objects.create(salle=salle, name="Machine 1")


# ============================================================================
# WEEK STATE CONTROLLER TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestWeekStateController:
    """Tests endpoints /api/v1/planning/week-states/"""

    url = f"{BASE_URL}/week-states/"

    def test_list_week_states_empty(self, api_client):
        """Test GET list retourne une liste vide."""
        response = api_client.get(f"{self.url}?year=2025")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_create_week_state(self, api_client):
        """Test POST creation d'un etat de semaine."""
        payload = {"year": 2025, "week_num": 10, "state": "vacances"}

        response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["year"] == 2025
        assert data["week_num"] == 10
        assert data["state"] == "vacances"
        assert "uuid" in data

    def test_create_week_state_then_list(self, api_client):
        """Test que le list retourne les donnees creees."""
        payload = {"year": 2025, "week_num": 10, "state": "vacances"}
        api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        response = api_client.get(f"{self.url}?year=2025")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["week_num"] == 10

    def test_create_week_state_invalid_week_num(self, api_client):
        """Test POST avec week_num invalide retourne 400."""
        payload = {"year": 2025, "week_num": 0, "state": "vacances"}

        response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_create_week_state_invalid_state(self, api_client):
        """Test POST avec state invalide retourne 400."""
        payload = {"year": 2025, "week_num": 10, "state": "invalide"}

        response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_delete_week_state(self, api_client):
        """Test DELETE suppression d'un etat."""
        payload = {"year": 2025, "week_num": 10, "state": "vacances"}
        create_response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )
        ws_uuid = create_response.json()["uuid"]

        response = api_client.delete(f"{self.url}{ws_uuid}/")

        assert response.status_code == 204

    def test_delete_week_state_not_found(self, api_client):
        """Test DELETE pour UUID inexistant retourne 404."""
        fake_uuid = str(uuid.uuid4())

        response = api_client.delete(f"{self.url}{fake_uuid}/")

        assert response.status_code == 404


# ============================================================================
# MEMBER PERIOD CONTROLLER TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestMemberPeriodController:
    """Tests endpoints /api/v1/planning/member-periods/"""

    url = f"{BASE_URL}/member-periods/"

    def _create_period(self, api_client):
        """Helper pour creer une periode et retourner la reponse JSON."""
        payload = {
            "member_name": "Jean Dupont",
            "member_role": "Assembleur",
            "year": 2025,
            "period_type": "congés",
            "start_date": "2025-07-01",
            "end_date": "2025-07-15",
        }
        response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )
        return response

    def test_list_member_periods_empty(self, api_client):
        """Test GET list retourne une liste vide."""
        response = api_client.get(f"{self.url}?year=2025")

        assert response.status_code == 200
        assert response.json() == []

    def test_create_member_period(self, api_client):
        """Test POST creation d'une periode."""
        response = self._create_period(api_client)

        assert response.status_code == 201
        data = response.json()
        assert data["member_name"] == "Jean Dupont"
        assert data["member_role"] == "Assembleur"
        assert data["period_type"] == "congés"
        assert "uuid" in data

    def test_create_member_period_then_list(self, api_client):
        """Test que le list retourne les donnees creees."""
        self._create_period(api_client)

        response = api_client.get(f"{self.url}?year=2025")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["member_name"] == "Jean Dupont"

    def test_update_member_period(self, api_client):
        """Test PATCH mise a jour d'une periode."""
        create_response = self._create_period(api_client)
        period_uuid = create_response.json()["uuid"]

        patch_payload = {
            "member_name": "Jean Dupont",
            "member_role": "Assembleur",
            "year": 2025,
            "period_type": "mission",
            "start_date": "2025-08-01",
            "end_date": "2025-08-10",
        }
        response = api_client.patch(
            f"{self.url}{period_uuid}/",
            data=json.dumps(patch_payload),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["period_type"] == "mission"

    def test_update_member_period_not_found(self, api_client):
        """Test PATCH pour UUID inexistant retourne 404."""
        fake_uuid = str(uuid.uuid4())
        patch_payload = {
            "member_name": "Jean Dupont",
            "member_role": "Assembleur",
            "year": 2025,
            "period_type": "mission",
            "start_date": "2025-08-01",
            "end_date": "2025-08-10",
        }

        response = api_client.patch(
            f"{self.url}{fake_uuid}/",
            data=json.dumps(patch_payload),
            content_type="application/json",
        )

        assert response.status_code == 404

    def test_delete_member_period(self, api_client):
        """Test DELETE suppression d'une periode."""
        create_response = self._create_period(api_client)
        period_uuid = create_response.json()["uuid"]

        response = api_client.delete(f"{self.url}{period_uuid}/")

        assert response.status_code == 204

    def test_delete_member_period_not_found(self, api_client):
        """Test DELETE pour UUID inexistant retourne 404."""
        fake_uuid = str(uuid.uuid4())

        response = api_client.delete(f"{self.url}{fake_uuid}/")

        assert response.status_code == 404


# ============================================================================
# LAB SALLE CONTROLLER TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestLabSalleController:
    """Tests endpoints /api/v1/planning/lab-salles/"""

    url = f"{BASE_URL}/lab-salles/"

    def test_list_salles_empty(self, api_client):
        """Test GET list retourne une liste vide."""
        response = api_client.get(self.url)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_salle(self, api_client):
        """Test POST creation d'une salle."""
        payload = {"name": "A1"}

        response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "A1"
        assert "uuid" in data

    def test_create_salle_then_list(self, api_client):
        """Test que le list retourne les salles creees."""
        payload = {"name": "B2"}
        api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        response = api_client.get(self.url)

        assert response.status_code == 200
        data = response.json()
        assert any(s["name"] == "B2" for s in data)

    def test_update_salle(self, api_client):
        """Test PATCH mise a jour d'une salle."""
        create_response = api_client.post(
            self.url,
            data=json.dumps({"name": "A1"}),
            content_type="application/json",
        )
        salle_uuid = create_response.json()["uuid"]

        patch_payload = {"name": "A1 Rename", "sort_order": 5}
        response = api_client.patch(
            f"{self.url}{salle_uuid}/",
            data=json.dumps(patch_payload),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "A1 Rename"
        assert data["sort_order"] == 5

    def test_update_salle_not_found(self, api_client):
        """Test PATCH pour UUID inexistant retourne 404."""
        fake_uuid = str(uuid.uuid4())

        response = api_client.patch(
            f"{self.url}{fake_uuid}/",
            data=json.dumps({"name": "X"}),
            content_type="application/json",
        )

        assert response.status_code == 404

    def test_delete_salle(self, api_client):
        """Test DELETE suppression d'une salle."""
        create_response = api_client.post(
            self.url,
            data=json.dumps({"name": "Z9"}),
            content_type="application/json",
        )
        salle_uuid = create_response.json()["uuid"]

        response = api_client.delete(f"{self.url}{salle_uuid}/")

        assert response.status_code == 204

    def test_delete_salle_not_found(self, api_client):
        """Test DELETE pour UUID inexistant retourne 404."""
        fake_uuid = str(uuid.uuid4())

        response = api_client.delete(f"{self.url}{fake_uuid}/")

        assert response.status_code == 404


# ============================================================================
# LAB EVENT CONTROLLER TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestLabEventController:
    """Tests endpoints /api/v1/planning/lab-events/"""

    url = f"{BASE_URL}/lab-events/"

    def _create_event(self, api_client, machine):
        """Helper pour creer un evenement et retourner la reponse."""
        payload = {
            "machine_uuid": str(machine.uuid),
            "category": "Maintenance",
            "description": "Nettoyage",
            "start_date": "2025-04-01",
            "end_date": "2025-04-03",
        }
        return api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_list_lab_events_empty(self, api_client):
        """Test GET list retourne une liste vide."""
        response = api_client.get(self.url)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_lab_event(self, api_client, machine):
        """Test POST creation d'un evenement."""
        response = self._create_event(api_client, machine)

        assert response.status_code == 201
        data = response.json()
        assert data["category"] == "Maintenance"
        assert data["description"] == "Nettoyage"
        assert "uuid" in data

    def test_create_lab_event_then_list(self, api_client, machine):
        """Test que le list retourne les evenements crees."""
        self._create_event(api_client, machine)

        response = api_client.get(self.url)

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(e["category"] == "Maintenance" for e in data)

    def test_create_lab_event_invalid_category(self, api_client, machine):
        """Test POST avec categorie invalide retourne 400."""
        payload = {
            "machine_uuid": str(machine.uuid),
            "category": "CategorieInvalide",
            "description": "Test",
            "start_date": "2025-04-01",
            "end_date": "2025-04-03",
        }

        response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_delete_lab_event(self, api_client, machine):
        """Test DELETE suppression d'un evenement."""
        create_response = self._create_event(api_client, machine)
        event_uuid = create_response.json()["uuid"]

        response = api_client.delete(f"{self.url}{event_uuid}/")

        assert response.status_code == 204

    def test_delete_lab_event_not_found(self, api_client):
        """Test DELETE pour UUID inexistant retourne 404."""
        fake_uuid = str(uuid.uuid4())

        response = api_client.delete(f"{self.url}{fake_uuid}/")

        assert response.status_code == 404


# ============================================================================
# CAMPAIGN STEP CONTROLLER TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestCampaignStepController:
    """Tests endpoints /api/v1/planning/campaign-steps/"""

    url = f"{BASE_URL}/campaign-steps/"

    def _make_payload(self, campaign, fsec):
        """Construit un payload de creation d'etape."""
        return {
            "campaign_uuid": str(campaign.uuid),
            "fsec_uuid": str(fsec.version_uuid),
            "step_label": "Assemblage",
            "year": 2025,
            "start_date": "2025-03-01",
            "end_date": "2025-03-15",
        }

    def test_list_campaign_steps_empty(self, api_client):
        """Test GET list retourne une liste vide."""
        response = api_client.get(f"{self.url}?year=2025")

        assert response.status_code == 200
        assert response.json() == []

    def test_create_campaign_step(self, api_client, campaign, fsec):
        """Test POST creation d'une etape programmee."""
        payload = self._make_payload(campaign, fsec)

        response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["step_label"] == "Assemblage"
        assert data["year"] == 2025
        assert "uuid" in data

    def test_create_campaign_step_then_list(self, api_client, campaign, fsec):
        """Test que le list retourne les etapes creees."""
        payload = self._make_payload(campaign, fsec)
        api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        response = api_client.get(f"{self.url}?year=2025")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["step_label"] == "Assemblage"

    def test_create_campaign_step_invalid_label(self, api_client, campaign, fsec):
        """Test POST avec step_label invalide retourne 400."""
        payload = {
            "campaign_uuid": str(campaign.uuid),
            "fsec_uuid": str(fsec.version_uuid),
            "step_label": "EtapeInvalide",
            "year": 2025,
            "start_date": "2025-03-01",
            "end_date": "2025-03-15",
        }

        response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_update_campaign_step(self, api_client, campaign, fsec):
        """Test PATCH mise a jour d'une etape."""
        payload = self._make_payload(campaign, fsec)
        create_response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )
        step_uuid = create_response.json()["uuid"]

        patch_payload = {
            "campaign_uuid": str(campaign.uuid),
            "fsec_uuid": payload["fsec_uuid"],
            "step_label": "Assemblage",
            "year": 2025,
            "start_date": "2025-03-05",
            "end_date": "2025-03-20",
        }
        response = api_client.patch(
            f"{self.url}{step_uuid}/",
            data=json.dumps(patch_payload),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["start_date"] == "2025-03-05"
        assert data["end_date"] == "2025-03-20"

    def test_update_campaign_step_not_found(self, api_client, campaign, fsec):
        """Test PATCH pour UUID inexistant retourne 404."""
        fake_uuid = str(uuid.uuid4())
        patch_payload = {
            "campaign_uuid": str(campaign.uuid),
            "fsec_uuid": str(fsec.version_uuid),
            "step_label": "Assemblage",
            "year": 2025,
            "start_date": "2025-03-01",
            "end_date": "2025-03-15",
        }

        response = api_client.patch(
            f"{self.url}{fake_uuid}/",
            data=json.dumps(patch_payload),
            content_type="application/json",
        )

        assert response.status_code == 404

    def test_delete_campaign_step(self, api_client, campaign, fsec):
        """Test DELETE suppression d'une etape."""
        payload = self._make_payload(campaign, fsec)
        create_response = api_client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )
        step_uuid = create_response.json()["uuid"]

        response = api_client.delete(f"{self.url}{step_uuid}/")

        assert response.status_code == 204

    def test_delete_campaign_step_not_found(self, api_client):
        """Test DELETE pour UUID inexistant retourne 404."""
        fake_uuid = str(uuid.uuid4())

        response = api_client.delete(f"{self.url}{fake_uuid}/")

        assert response.status_code == 404
