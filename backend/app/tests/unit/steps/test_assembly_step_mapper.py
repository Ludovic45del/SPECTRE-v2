"""
Tests unitaires pour le mapper AssemblyStep.

Vérifie les conversions Entity ↔ Bean ↔ API.
"""

from datetime import date
from unittest.mock import MagicMock

import pytest

from app.domain.steps.models.assembly_step_bean import AssemblyStepBean
from app.mapper.steps.assembly_step_mapper import (
    assembly_step_mapper_api_to_bean,
    assembly_step_mapper_bean_to_api,
    assembly_step_mapper_bean_to_entity,
    assembly_step_mapper_entity_to_bean,
)

# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def sample_assembly_bean():
    """Bean AssemblyStep de test."""
    return AssemblyStepBean(
        uuid="step-uuid-123",
        fsec_version_id="fsec-v-uuid-456",
        operator="Assembleur Dupont",
        operator_user_uuid=None,
        start_date=date(2025, 2, 1),
        end_date=date(2025, 2, 15),
        comments="Assemblage terminé avec succès",
        assembly_bench_ids=[1, 2, 3],
    )


@pytest.fixture
def mock_assembly_entity():
    """Mock AssemblyStepEntity."""
    mock = MagicMock()
    mock.uuid = "step-uuid-123"
    mock.fsec_version_id_id = "fsec-v-uuid-456"
    mock.operator = "Assembleur Dupont"
    mock.operator_user_id = None
    mock.operator_user = None
    mock.start_date = date(2025, 2, 1)
    mock.end_date = date(2025, 2, 15)
    mock.comments = "Assemblage terminé avec succès"
    # Mock M2M relation
    bench1 = MagicMock()
    bench1.id = 1
    bench2 = MagicMock()
    bench2.id = 2
    mock.assembly_bench.all.return_value = [bench1, bench2]
    return mock


# ============================================================================
# ENTITY TO BEAN TESTS
# ============================================================================


class TestAssemblyStepMapperEntityToBean:
    """Tests conversion Entity → Bean."""

    @pytest.mark.unit
    def test_entity_to_bean_all_fields(self, mock_assembly_entity):
        """Test conversion complète Entity → Bean."""
        result = assembly_step_mapper_entity_to_bean(mock_assembly_entity)

        assert isinstance(result, AssemblyStepBean)
        assert result.uuid == str(mock_assembly_entity.uuid)
        assert result.fsec_version_id == str(mock_assembly_entity.fsec_version_id_id)
        assert result.operator == "Assembleur Dupont"
        assert result.start_date == date(2025, 2, 1)
        assert result.end_date == date(2025, 2, 15)
        assert result.comments == "Assemblage terminé avec succès"

    @pytest.mark.unit
    def test_entity_to_bean_m2m_relation(self, mock_assembly_entity):
        """Test conversion des relations M2M (assembly_bench)."""
        result = assembly_step_mapper_entity_to_bean(mock_assembly_entity)

        assert result.assembly_bench_ids == [1, 2]
        mock_assembly_entity.assembly_bench.all.assert_called_once()

    @pytest.mark.unit
    def test_entity_to_bean_nullable_fields(self):
        """Test conversion avec champs nullables."""
        mock = MagicMock()
        mock.uuid = "uuid"
        mock.fsec_version_id_id = "fsec-uuid"
        mock.operator = None
        mock.operator_user_id = None
        mock.operator_user = None
        mock.start_date = None
        mock.end_date = None
        mock.comments = None
        mock.assembly_bench.all.return_value = []

        result = assembly_step_mapper_entity_to_bean(mock)

        assert result.operator is None
        assert result.operator_user_uuid is None
        assert result.start_date is None
        assert result.end_date is None
        assert result.comments is None
        assert result.assembly_bench_ids == []

    @pytest.mark.unit
    def test_entity_to_bean_empty_fsec_version_id(self):
        """Test conversion avec fsec_version_id vide."""
        mock = MagicMock()
        mock.uuid = "uuid"
        mock.fsec_version_id_id = None
        mock.operator = "Assembleur"
        mock.operator_user_id = None
        mock.operator_user = None
        mock.start_date = None
        mock.end_date = None
        mock.comments = None
        mock.assembly_bench.all.return_value = []

        result = assembly_step_mapper_entity_to_bean(mock)

        assert result.fsec_version_id == ""


# ============================================================================
# BEAN TO ENTITY TESTS
# ============================================================================


class TestAssemblyStepMapperBeanToEntity:
    """Tests conversion Bean → Entity."""

    @pytest.mark.unit
    def test_bean_to_entity_all_fields(self, sample_assembly_bean):
        """Test conversion complète Bean → Entity."""
        result = assembly_step_mapper_bean_to_entity(sample_assembly_bean)

        assert result.uuid == sample_assembly_bean.uuid
        assert result.fsec_version_id_id == sample_assembly_bean.fsec_version_id
        assert result.operator == "Assembleur Dupont"
        assert result.start_date == date(2025, 2, 1)
        assert result.end_date == date(2025, 2, 15)
        assert result.comments == "Assemblage terminé avec succès"

    @pytest.mark.unit
    def test_bean_to_entity_without_uuid(self):
        """Test conversion sans UUID (création)."""
        bean = AssemblyStepBean(
            uuid="",
            fsec_version_id="fsec-uuid",
            operator="Assembleur Martin",
            operator_user_uuid=None,
            start_date=date(2025, 3, 1),
            end_date=None,
            comments="Nouveau step",
            assembly_bench_ids=[],
        )

        result = assembly_step_mapper_bean_to_entity(bean)

        assert result.fsec_version_id_id == "fsec-uuid"
        assert result.operator == "Assembleur Martin"

    @pytest.mark.unit
    def test_bean_to_entity_does_not_map_m2m(self, sample_assembly_bean):
        """Test que la relation M2M n'est pas mappée directement."""
        result = assembly_step_mapper_bean_to_entity(sample_assembly_bean)

        # Les M2M sont gérées séparément dans le repository
        # Le mapper ne doit pas tenter de les mapper
        assert not hasattr(result, "assembly_bench_ids")


# ============================================================================
# API TO BEAN TESTS
# ============================================================================


class TestAssemblyStepMapperApiToBean:
    """Tests conversion API → Bean."""

    @pytest.mark.unit
    def test_api_to_bean_all_fields(self):
        """Test conversion complète API dict → Bean."""
        api_data = {
            "uuid": "api-uuid",
            "fsec_version_id": "fsec-api-uuid",
            "operator": "Assembleur API",
            "operator_user_uuid": None,
            "start_date": "2025-04-01",
            "end_date": "2025-04-15",
            "comments": "Commentaire API",
            "assembly_bench_ids": [1, 2, 3, 4],
        }

        result = assembly_step_mapper_api_to_bean(api_data)

        assert isinstance(result, AssemblyStepBean)
        assert result.uuid == "api-uuid"
        assert result.fsec_version_id == "fsec-api-uuid"
        assert result.operator == "Assembleur API"
        assert result.comments == "Commentaire API"
        assert result.assembly_bench_ids == [1, 2, 3, 4]

    @pytest.mark.unit
    def test_api_to_bean_missing_optional_fields(self):
        """Test conversion avec champs optionnels manquants."""
        api_data = {
            "uuid": "uuid",
            "fsec_version_id": "fsec-uuid",
        }

        result = assembly_step_mapper_api_to_bean(api_data)

        assert result.uuid == "uuid"
        assert result.operator is None
        assert result.operator_user_uuid is None
        assert result.start_date is None
        assert result.end_date is None
        assert result.comments is None
        assert result.assembly_bench_ids == []

    @pytest.mark.unit
    def test_api_to_bean_empty_data(self):
        """Test conversion avec données vides."""
        api_data = {}

        result = assembly_step_mapper_api_to_bean(api_data)

        assert result.uuid == ""
        assert result.fsec_version_id == ""
        assert result.assembly_bench_ids == []

    @pytest.mark.unit
    def test_api_to_bean_date_as_string(self):
        """Test parsing des dates depuis strings ISO."""
        api_data = {
            "uuid": "uuid",
            "fsec_version_id": "fsec",
            "start_date": "2025-05-10",
            "end_date": "2025-05-20",
        }

        result = assembly_step_mapper_api_to_bean(api_data)

        # Les dates restent en format string car le mapper ne les parse pas
        assert result.start_date == "2025-05-10"
        assert result.end_date == "2025-05-20"


# ============================================================================
# BEAN TO API TESTS
# ============================================================================


class TestAssemblyStepMapperBeanToApi:
    """Tests conversion Bean → API."""

    @pytest.mark.unit
    def test_bean_to_api_all_fields(self, sample_assembly_bean):
        """Test conversion complète Bean → API dict."""
        result = assembly_step_mapper_bean_to_api(sample_assembly_bean)

        assert isinstance(result, dict)
        assert result["uuid"] == sample_assembly_bean.uuid
        assert result["fsec_version_id"] == sample_assembly_bean.fsec_version_id
        assert result["operator"] == "Assembleur Dupont"
        assert result["comments"] == "Assemblage terminé avec succès"
        assert result["assembly_bench_ids"] == [1, 2, 3]

    @pytest.mark.unit
    def test_bean_to_api_date_format(self, sample_assembly_bean):
        """Test formatage des dates en ISO."""
        result = assembly_step_mapper_bean_to_api(sample_assembly_bean)

        assert result["start_date"] == "2025-02-01"
        assert result["end_date"] == "2025-02-15"

    @pytest.mark.unit
    def test_bean_to_api_null_dates(self):
        """Test conversion avec dates nulles."""
        bean = AssemblyStepBean(
            uuid="uuid",
            fsec_version_id="fsec",
            operator="Assembleur",
            operator_user_uuid=None,
            start_date=None,
            end_date=None,
            comments=None,
            assembly_bench_ids=[],
        )

        result = assembly_step_mapper_bean_to_api(bean)

        assert result["start_date"] is None
        assert result["end_date"] is None

    @pytest.mark.unit
    def test_bean_to_api_date_already_string(self):
        """Test que les dates déjà en string sont préservées."""
        bean = AssemblyStepBean(
            uuid="uuid",
            fsec_version_id="fsec",
            operator="Assembleur",
            operator_user_uuid=None,
            start_date="2025-06-01",  # Déjà string
            end_date="2025-06-15",
            comments=None,
            assembly_bench_ids=[],
        )

        result = assembly_step_mapper_bean_to_api(bean)

        assert result["start_date"] == "2025-06-01"
        assert result["end_date"] == "2025-06-15"


# ============================================================================
# ROUNDTRIP TESTS
# ============================================================================


class TestAssemblyStepMapperRoundtrip:
    """Tests aller-retour."""

    @pytest.mark.unit
    def test_bean_to_api_to_bean_roundtrip(self, sample_assembly_bean):
        """Test Bean → API → Bean préserve les données."""
        api_data = assembly_step_mapper_bean_to_api(sample_assembly_bean)
        restored = assembly_step_mapper_api_to_bean(api_data)

        assert restored.uuid == sample_assembly_bean.uuid
        assert restored.fsec_version_id == sample_assembly_bean.fsec_version_id
        assert restored.operator == sample_assembly_bean.operator
        assert restored.operator_user_uuid == sample_assembly_bean.operator_user_uuid
        assert restored.comments == sample_assembly_bean.comments
        assert restored.assembly_bench_ids == sample_assembly_bean.assembly_bench_ids
