"""
Tests d'intégration pour le repository FA.

Ces tests utilisent la base de données Django pour vérifier
les opérations CRUD réelles sur les FA.
"""

import uuid
from datetime import date

import pytest

from app.domain.campaign.models.campaign_bean import CampaignBean
from app.domain.fa.models.fa_bean import FaBean
from app.domain.fsec.models.fsec_bean import FsecBean
from app.repository.campaign.repositories.campaign_repository import CampaignRepository
from app.repository.fa.repositories.fa_repository import FaRepository
from app.repository.fsec.repositories.fsec_repository import FsecRepository


@pytest.fixture
def fa_repository():
    """Instance du repository FA."""
    return FaRepository()


@pytest.fixture
def test_fsec_version_id():
    """Crée l'arbre Campaign -> FSEC pour avoir un FSEC version id valide."""
    # 1. Créer une campagne
    campaign_repo = CampaignRepository()
    campaign_bean = CampaignBean(
        type_id=0,
        status_id=0,
        installation_id=0,
        name=f"Campagne Test FA {uuid.uuid4().hex[:8]}",
        year=2025,
        semester="S1",
    )
    campaign = campaign_repo.create(campaign_bean)

    # 2. Créer une FSEC
    fsec_repo = FsecRepository()
    fsec_bean = FsecBean(
        campaign_id=campaign.uuid,
        fsec_uuid=str(uuid.uuid4()),
        status_id=0,
        category_id=0,
        rack_id=0,
        name=f"FSEC Test FA {uuid.uuid4().hex[:8]}",
        is_active=True,
    )
    fsec = fsec_repo.create(fsec_bean)

    return fsec.version_uuid


@pytest.fixture
def sample_fa_data(test_fsec_version_id):
    """Données de FA pour les tests."""
    return {
        "fsec_version_id": test_fsec_version_id,
        "status_id": 0,  # Open
        "type_id": 1,
        "criticality_id": 2,
        "identifier": f"FA_2025_Test_{uuid.uuid4().hex[:8]}",
        "fsec_step_id": 3,
        "discoverer": "Intégration Test",
        "event_date": date.today(),
        "observation": "Test d'intégration CRUD",
        "quick_analysis": "Tout semble correct",
    }


@pytest.mark.integration
@pytest.mark.django_db
class TestFaRepositoryCreate:
    """Tests création de FA."""

    def test_create_fa_success(self, fa_repository, sample_fa_data):
        """Test création réussie d'une FA."""
        bean = FaBean(**sample_fa_data)
        result = fa_repository.create(bean)

        assert result.uuid is not None
        assert result.identifier == sample_fa_data["identifier"]
        assert result.status_id == 0

    def test_create_fa_generates_uuid_and_timestamps(
        self, fa_repository, sample_fa_data
    ):
        """Test que l'UUID et les dates sont générés automatiquement."""
        bean = FaBean(**sample_fa_data)
        result = fa_repository.create(bean)

        assert result.uuid is not None
        assert len(result.uuid) == 36
        assert result.created_at is not None
        assert result.last_updated is not None


@pytest.mark.integration
@pytest.mark.django_db
class TestFaRepositoryRead:
    """Tests lecture de FA."""

    def test_get_by_uuid_success(self, fa_repository, sample_fa_data):
        """Test récupération par UUID."""
        bean = FaBean(**sample_fa_data)
        created = fa_repository.create(bean)

        result = fa_repository.get_by_uuid(created.uuid)

        assert result is not None
        assert result.uuid == created.uuid
        assert result.identifier == created.identifier

    def test_get_by_uuid_not_found(self, fa_repository):
        """Test récupération UUID inexistant retourne None."""
        fake_uuid = str(uuid.uuid4())
        result = fa_repository.get_by_uuid(fake_uuid)
        assert result is None

    def test_get_all_paginated(self, fa_repository, sample_fa_data):
        """Test récupération paginée."""
        # Créer 3 FA
        for i in range(3):
            campaign = CampaignRepository().create(
                CampaignBean(
                    type_id=0,
                    status_id=0,
                    installation_id=0,
                    name=f"C {i} {uuid.uuid4().hex[:8]}",
                    year=2025,
                    semester="S1",
                )
            )
            fsec = FsecRepository().create(
                FsecBean(
                    campaign_id=campaign.uuid,
                    fsec_uuid=str(uuid.uuid4()),
                    status_id=0,
                    category_id=0,
                    rack_id=0,
                    name=f"F {i} {uuid.uuid4().hex[:8]}",
                    is_active=True,
                )
            )

            data = sample_fa_data.copy()
            data["fsec_version_id"] = fsec.version_uuid
            data["identifier"] = f"FA_2025_All_{i}_{uuid.uuid4().hex[:8]}"
            fa_repository.create(FaBean(**data))

        result = fa_repository.get_all(limit=2, offset=0)
        assert len(result) == 2

        count = fa_repository.count_all()
        assert count >= 3


@pytest.mark.integration
@pytest.mark.django_db
class TestFaRepositoryUpdate:
    """Tests mise à jour de FA."""

    def test_update_fa_success(self, fa_repository, sample_fa_data):
        """Test mise à jour réussie."""
        bean = FaBean(**sample_fa_data)
        created = fa_repository.create(bean)

        created.observation = "Observation Modifiée"
        created.cause = "Cause Identifiée"

        result = fa_repository.update(created)

        assert result.observation == "Observation Modifiée"
        assert result.cause == "Cause Identifiée"

    def test_update_preserves_uuid_and_fsec(self, fa_repository, sample_fa_data):
        """Test update ne casse pas les FK clés."""
        bean = FaBean(**sample_fa_data)
        created = fa_repository.create(bean)

        created.discoverer = "Nouveau Discoverer"
        result = fa_repository.update(created)

        assert result.uuid == created.uuid
        assert result.fsec_version_id == created.fsec_version_id


@pytest.mark.integration
@pytest.mark.django_db
class TestFaRepositoryDelete:
    """Tests suppression de FA."""

    def test_delete_fa_success(self, fa_repository, sample_fa_data):
        """Test suppression réussie."""
        bean = FaBean(**sample_fa_data)
        created = fa_repository.create(bean)

        result = fa_repository.delete(created.uuid)

        assert result is True
        assert fa_repository.get_by_uuid(created.uuid) is None

    def test_delete_fa_not_found(self, fa_repository):
        """Test suppression d'un UUID inexistant retourne False."""
        fake_uuid = str(uuid.uuid4())
        result = fa_repository.delete(fake_uuid)
        assert result is False
