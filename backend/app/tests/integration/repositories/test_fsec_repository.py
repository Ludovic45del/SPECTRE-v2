"""
Tests d'intégration pour le repository FSEC.

Ces tests utilisent la base de données Django pour vérifier
les opérations CRUD et le versioning.
"""

import uuid
from datetime import date

import pytest

from app.domain.fsec.models.fsec_bean import FsecBean
from app.repository.fsec.repositories.fsec_repository import FsecRepository


@pytest.fixture
def fsec_repository():
    """Instance du repository FSEC."""
    return FsecRepository()


@pytest.fixture
def sample_campaign(db):
    """Campagne réelle en base pour satisfaire la FK."""
    from app.repository.campaign.models.campaign_entity import CampaignEntity

    return CampaignEntity.objects.create(
        uuid=str(uuid.uuid4()),
        type_id_id=0,
        status_id_id=0,
        installation_id_id=0,
        name=f"Campaign Repo Test {uuid.uuid4().hex[:8]}",
        year=2025,
        semester="S1",
    )


@pytest.fixture
def sample_fsec_data(sample_campaign):
    """Données FSEC pour tests."""
    return {
        "campaign_id": sample_campaign.uuid,
        "status_id": 0,
        "category_id": 0,
        "rack_id": 0,
        "name": f"FSEC Test {uuid.uuid4().hex[:8]}",
        "comments": "FSEC de test intégration",
        "is_active": True,
        "delivery_date": date(2025, 3, 1),
        "shooting_date": None,
        "preshooting_pressure": None,
        "experience_srxx": None,
        "localisation": None,
        "depressurization_failed": None,
    }


# ============================================================================
# CREATE TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecRepositoryCreate:
    """Tests création FSEC."""

    def test_create_fsec_success(self, fsec_repository, sample_fsec_data):
        """Test création réussie d'un FSEC."""
        bean = FsecBean(**sample_fsec_data)

        result = fsec_repository.create(bean)

        assert result.version_uuid is not None
        assert result.fsec_uuid is not None
        assert result.name == sample_fsec_data["name"]
        assert result.is_active is True

    def test_create_fsec_generates_uuids(self, fsec_repository, sample_fsec_data):
        """Test que les UUIDs sont générés automatiquement."""
        bean = FsecBean(**sample_fsec_data)

        result = fsec_repository.create(bean)

        assert len(result.version_uuid) == 36
        assert len(result.fsec_uuid) == 36

    def test_create_fsec_without_campaign(self, fsec_repository):
        """Test création FSEC sans campagne."""
        bean = FsecBean(
            campaign_id=None,
            status_id=0,
            category_id=0,
            rack_id=0,
            name=f"FSEC Standalone {uuid.uuid4().hex[:8]}",
            is_active=True,
        )

        result = fsec_repository.create(bean)

        assert result.version_uuid is not None
        assert result.campaign_id is None


# ============================================================================
# READ TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecRepositoryRead:
    """Tests lecture FSEC."""

    def test_get_by_version_uuid_success(self, fsec_repository, sample_fsec_data):
        """Test récupération par version_uuid."""
        bean = FsecBean(**sample_fsec_data)
        created = fsec_repository.create(bean)

        result = fsec_repository.get_by_version_uuid(created.version_uuid)

        assert result is not None
        assert result.version_uuid == created.version_uuid

    def test_get_by_version_uuid_not_found(self, fsec_repository):
        """Test récupération UUID inexistant."""
        result = fsec_repository.get_by_version_uuid(str(uuid.uuid4()))

        assert result is None

    def test_get_all_returns_list(self, fsec_repository, sample_fsec_data):
        """Test récupération de tous les FSECs."""
        for i in range(3):
            data = sample_fsec_data.copy()
            data["name"] = f"FSEC All Test {i} {uuid.uuid4().hex[:8]}"
            fsec_repository.create(FsecBean(**data))

        result = fsec_repository.get_all()

        assert isinstance(result, list)
        assert len(result) >= 3

    def test_get_all_active(self, fsec_repository, sample_fsec_data):
        """Test récupération FSECs actifs uniquement."""
        # Créer un FSEC actif
        data = sample_fsec_data.copy()
        data["name"] = f"FSEC Active {uuid.uuid4().hex[:8]}"
        data["is_active"] = True
        fsec_repository.create(FsecBean(**data))

        result = fsec_repository.get_all_active()

        assert isinstance(result, list)
        assert all(fsec.is_active for fsec in result)

    def test_get_by_campaign_id(self, fsec_repository, sample_fsec_data):
        """Test récupération par campaign_id."""
        campaign_id = sample_fsec_data["campaign_id"]

        # Créer plusieurs FSECs pour la même campagne
        for i in range(2):
            data = sample_fsec_data.copy()
            data["name"] = f"FSEC Campaign {i} {uuid.uuid4().hex[:8]}"
            fsec_repository.create(FsecBean(**data))

        result = fsec_repository.get_by_campaign_id(campaign_id)

        assert len(result) >= 2
        assert all(fsec.campaign_id == campaign_id for fsec in result)


# ============================================================================
# VERSIONING TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecRepositoryVersioning:
    """Tests système de versioning."""

    def test_get_by_fsec_uuid(self, fsec_repository, sample_fsec_data):
        """Test récupération par fsec_uuid (toutes versions)."""
        bean = FsecBean(**sample_fsec_data)
        created = fsec_repository.create(bean)

        result = fsec_repository.get_by_fsec_uuid(created.fsec_uuid)

        assert len(result) >= 1
        assert all(fsec.fsec_uuid == created.fsec_uuid for fsec in result)

    def test_get_active_by_fsec_uuid(self, fsec_repository, sample_fsec_data):
        """Test récupération version active."""
        bean = FsecBean(**sample_fsec_data)
        created = fsec_repository.create(bean)

        result = fsec_repository.get_active_by_fsec_uuid(created.fsec_uuid)

        assert result is not None
        assert result.is_active is True
        assert result.fsec_uuid == created.fsec_uuid

    def test_deactivate_all_versions(self, fsec_repository, sample_fsec_data):
        """Test désactivation de toutes les versions."""
        bean = FsecBean(**sample_fsec_data)
        created = fsec_repository.create(bean)
        fsec_uuid = created.fsec_uuid

        fsec_repository.deactivate_all_versions(fsec_uuid)

        # Vérifier qu'aucune version n'est active
        active = fsec_repository.get_active_by_fsec_uuid(fsec_uuid)
        assert active is None


# ============================================================================
# UPDATE TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecRepositoryUpdate:
    """Tests mise à jour FSEC."""

    def test_update_fsec_success(self, fsec_repository, sample_fsec_data):
        """Test mise à jour réussie."""
        bean = FsecBean(**sample_fsec_data)
        created = fsec_repository.create(bean)

        created.name = "FSEC Modifié"
        created.comments = "Commentaire modifié"

        result = fsec_repository.update(created)

        assert result.name == "FSEC Modifié"
        assert result.comments == "Commentaire modifié"

    def test_update_preserves_uuids(self, fsec_repository, sample_fsec_data):
        """Test que les UUIDs sont préservés."""
        bean = FsecBean(**sample_fsec_data)
        created = fsec_repository.create(bean)
        original_version_uuid = created.version_uuid
        original_fsec_uuid = created.fsec_uuid

        created.name = "Nom modifié"
        result = fsec_repository.update(created)

        assert result.version_uuid == original_version_uuid
        assert result.fsec_uuid == original_fsec_uuid


# ============================================================================
# DELETE TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecRepositoryDelete:
    """Tests suppression FSEC."""

    def test_delete_fsec_success(self, fsec_repository, sample_fsec_data):
        """Test suppression réussie."""
        bean = FsecBean(**sample_fsec_data)
        created = fsec_repository.create(bean)

        result = fsec_repository.delete(created.version_uuid)

        assert result is True
        assert fsec_repository.get_by_version_uuid(created.version_uuid) is None

    def test_delete_fsec_not_found(self, fsec_repository):
        """Test suppression UUID inexistant."""
        result = fsec_repository.delete(str(uuid.uuid4()))

        assert result is False


# ============================================================================
# DUPLICATE CHECK TESTS
# ============================================================================


@pytest.mark.integration
@pytest.mark.django_db
class TestFsecRepositoryDuplicateCheck:
    """Tests vérification de doublons."""

    def test_exists_by_campaign_and_name_true(self, fsec_repository, sample_fsec_data):
        """Test détection de doublon existant."""
        bean = FsecBean(**sample_fsec_data)
        fsec_repository.create(bean)

        result = fsec_repository.exists_by_campaign_and_name(
            sample_fsec_data["campaign_id"],
            sample_fsec_data["name"],
        )

        assert result is True

    def test_exists_by_campaign_and_name_false(self, fsec_repository):
        """Test pas de doublon."""
        result = fsec_repository.exists_by_campaign_and_name(
            str(uuid.uuid4()),
            "FSEC Inexistant",
        )

        assert result is False
