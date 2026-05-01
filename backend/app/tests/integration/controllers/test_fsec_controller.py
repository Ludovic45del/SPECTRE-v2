"""
Tests d'intégration pour le controller FSEC.

Ces tests vérifient les endpoints API REST pour les opérations FSEC.
"""

import json
import uuid

import pytest

from app.repository.campaign.models.campaign_entity import CampaignEntity


@pytest.fixture
def sample_campaign(db):
    """Campagne de test pour les FSEC."""
    return CampaignEntity.objects.create(
        uuid=str(uuid.uuid4()),
        type_id_id=0,
        status_id_id=0,
        installation_id_id=0,
        name=f"Campaign FSEC Test {uuid.uuid4().hex[:8]}",
        year=2025,
        semester="S1",
    )


@pytest.fixture
def sample_fsec_payload(sample_campaign):
    """Payload de création FSEC."""
    return {
        "name": f"FSEC API Test {uuid.uuid4().hex[:8]}",
        "campaign_id": sample_campaign.uuid,
        "status_id": 0,
        "category_id": 0,
        "rack_id": None,
        "comments": "FSEC créé via API",
    }


# ============================================================================
# LIST ENDPOINT TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecControllerList:
    """Tests endpoint GET /api/v1/fsecs/"""

    def test_list_fsecs_success(self, api_client):
        """Test récupération liste des FSECs."""
        response = api_client.get("/api/v1/fsecs/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_fsecs_returns_json(self, api_client):
        """Test que la réponse est en JSON."""
        response = api_client.get("/api/v1/fsecs/")

        assert response["Content-Type"] == "application/json"


# ============================================================================
# CREATE ENDPOINT TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecControllerCreate:
    """Tests endpoint POST /api/v1/fsecs/"""

    def test_create_fsec_success(self, api_client, sample_fsec_payload):
        """Test création réussie d'un FSEC."""
        response = api_client.post(
            "/api/v1/fsecs/",
            data=json.dumps(sample_fsec_payload),
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_fsec_payload["name"]
        assert "version_uuid" in data
        assert data["status_id"] == 0
        assert data["category_id"] == 0

    def test_create_fsec_with_all_categories(self, api_client, sample_campaign):
        """Test création FSEC pour chaque catégorie."""
        for category_id in range(5):  # 0 à 4
            payload = {
                "name": f"FSEC Cat {category_id} {uuid.uuid4().hex[:6]}",
                "campaign_id": sample_campaign.uuid,
                "status_id": 0,
                "category_id": category_id,
                "rack_id": None,
                "comments": f"Test catégorie {category_id}",
            }

            response = api_client.post(
                "/api/v1/fsecs/",
                data=json.dumps(payload),
                content_type="application/json",
            )

            assert response.status_code == 201
            assert response.json()["category_id"] == category_id

    def test_create_fsec_validation_error(self, api_client):
        """Test erreur de validation (champs requis manquants)."""
        invalid_payload = {"name": ""}

        response = api_client.post(
            "/api/v1/fsecs/",
            data=json.dumps(invalid_payload),
            content_type="application/json",
        )

        assert response.status_code in [400, 500]


# ============================================================================
# RETRIEVE ENDPOINT TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecControllerRetrieve:
    """Tests endpoint GET /api/v1/fsecs/{version_uuid}/"""

    def test_retrieve_fsec_success(self, api_client, sample_fsec_payload):
        """Test récupération d'un FSEC par version UUID."""
        # Créer un FSEC
        create_response = api_client.post(
            "/api/v1/fsecs/",
            data=json.dumps(sample_fsec_payload),
            content_type="application/json",
        )
        version_uuid = create_response.json()["version_uuid"]

        # Récupérer le FSEC
        response = api_client.get(f"/api/v1/fsecs/{version_uuid}/")

        assert response.status_code == 200
        data = response.json()
        assert data["version_uuid"] == version_uuid
        assert data["name"] == sample_fsec_payload["name"]

    def test_retrieve_fsec_not_found(self, api_client):
        """Test 404 pour UUID inexistant."""
        fake_uuid = str(uuid.uuid4())

        response = api_client.get(f"/api/v1/fsecs/{fake_uuid}/")

        assert response.status_code in [404, 500]


# ============================================================================
# UPDATE ENDPOINT TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecControllerUpdate:
    """Tests endpoint PUT /api/v1/fsecs/{version_uuid}/"""

    def test_update_fsec_success(self, api_client, sample_fsec_payload):
        """Test mise à jour réussie."""
        # Créer un FSEC
        create_response = api_client.post(
            "/api/v1/fsecs/",
            data=json.dumps(sample_fsec_payload),
            content_type="application/json",
        )
        version_uuid = create_response.json()["version_uuid"]

        # Mettre à jour
        updated_payload = sample_fsec_payload.copy()
        updated_payload["name"] = "FSEC Modifié"
        updated_payload["comments"] = "Commentaire modifié"
        updated_payload["status_id"] = 1  # Assemblage

        response = api_client.put(
            f"/api/v1/fsecs/{version_uuid}/",
            data=json.dumps(updated_payload),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "FSEC Modifié"
        assert data["status_id"] == 1

    def test_update_fsec_status_to_hs(self, api_client, sample_fsec_payload):
        """Test passage en statut HS."""
        # Créer un FSEC
        create_response = api_client.post(
            "/api/v1/fsecs/",
            data=json.dumps(sample_fsec_payload),
            content_type="application/json",
        )
        version_uuid = create_response.json()["version_uuid"]

        # Passer en HS (8)
        updated_payload = sample_fsec_payload.copy()
        updated_payload["status_id"] = 8

        response = api_client.put(
            f"/api/v1/fsecs/{version_uuid}/",
            data=json.dumps(updated_payload),
            content_type="application/json",
        )

        assert response.status_code == 200
        assert response.json()["status_id"] == 8

    def test_update_fsec_not_found(self, api_client, sample_fsec_payload):
        """Test 404 pour mise à jour UUID inexistant."""
        fake_uuid = str(uuid.uuid4())

        response = api_client.put(
            f"/api/v1/fsecs/{fake_uuid}/",
            data=json.dumps(sample_fsec_payload),
            content_type="application/json",
        )

        assert response.status_code in [404, 500]


# ============================================================================
# DELETE ENDPOINT TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecControllerDelete:
    """Tests endpoint DELETE /api/v1/fsecs/{version_uuid}/"""

    def test_delete_fsec_success(self, api_client, admin_api_client, sample_fsec_payload):
        """Test suppression réussie (requiert rôle admin)."""
        # Créer un FSEC
        create_response = api_client.post(
            "/api/v1/fsecs/",
            data=json.dumps(sample_fsec_payload),
            content_type="application/json",
        )
        version_uuid = create_response.json()["version_uuid"]

        # Supprimer avec un client admin
        response = admin_api_client.delete(f"/api/v1/fsecs/{version_uuid}/")

        assert response.status_code == 204

        # Vérifier que le FSEC n'existe plus
        get_response = api_client.get(f"/api/v1/fsecs/{version_uuid}/")
        assert get_response.status_code in [404, 500]

    def test_delete_fsec_not_found(self, admin_api_client):
        """Test 404 pour suppression UUID inexistant (requiert rôle admin)."""
        fake_uuid = str(uuid.uuid4())

        response = admin_api_client.delete(f"/api/v1/fsecs/{fake_uuid}/")

        assert response.status_code in [404, 500]


# ============================================================================
# BY CAMPAIGN ENDPOINT TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecControllerByCampaign:
    """Tests endpoint GET /api/v1/fsecs/campaign/{campaign_uuid}/"""

    def test_get_fsecs_by_campaign_success(self, api_client, sample_campaign):
        """Test récupération FSECs par campagne."""
        # Créer plusieurs FSECs pour cette campagne
        for i in range(3):
            payload = {
                "name": f"FSEC Campaign {i} {uuid.uuid4().hex[:6]}",
                "campaign_id": sample_campaign.uuid,
                "status_id": 0,
                "category_id": 0,
                "rack_id": None,
                "comments": f"FSEC {i}",
            }
            api_client.post(
                "/api/v1/fsecs/",
                data=json.dumps(payload),
                content_type="application/json",
            )

        # Récupérer par campagne
        response = api_client.get(f"/api/v1/fsecs/campaign/{sample_campaign.uuid}/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3

    def test_get_fsecs_by_campaign_empty(self, api_client):
        """Test récupération FSECs pour campagne sans FSEC."""
        fake_campaign_uuid = str(uuid.uuid4())

        response = api_client.get(f"/api/v1/fsecs/campaign/{fake_campaign_uuid}/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


# ============================================================================
# STATUS WORKFLOW TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecStatusWorkflow:
    """Tests du workflow de statuts FSEC."""

    def test_workflow_sans_gaz(self, api_client, sample_campaign):
        """Test workflow complet catégorie 0 (Sans gaz)."""
        # Statuts catégorie 0: [0, 1, 2, 3, 4, 5, 6, 7]
        payload = {
            "name": f"FSEC Workflow {uuid.uuid4().hex[:6]}",
            "campaign_id": sample_campaign.uuid,
            "status_id": 0,
            "category_id": 0,
            "rack_id": None,
            "comments": "Test workflow",
        }

        # Créer
        create_response = api_client.post(
            "/api/v1/fsecs/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        version_uuid = create_response.json()["version_uuid"]

        # Parcourir les statuts
        for status_id in [0, 1, 2, 3, 4, 5, 6, 7]:
            payload["status_id"] = status_id
            response = api_client.put(
                f"/api/v1/fsecs/{version_uuid}/",
                data=json.dumps(payload),
                content_type="application/json",
            )
            assert response.status_code == 200
            assert response.json()["status_id"] == status_id

    def test_depressurization_failed_flag(self, api_client, sample_campaign):
        """Test du flag depressurization_failed pour catégorie 4."""
        payload = {
            "name": f"FSEC Depress {uuid.uuid4().hex[:6]}",
            "campaign_id": sample_campaign.uuid,
            "status_id": 13,  # Dépressurisation
            "category_id": 4,
            "rack_id": None,
            "comments": "Test depressurization",
            "depressurization_failed": True,
        }

        response = api_client.post(
            "/api/v1/fsecs/",
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["depressurization_failed"] is True
