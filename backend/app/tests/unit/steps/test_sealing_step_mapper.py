"""
Tests unitaires pour le mapper SealingStep.

Vérifie les conversions Entity ↔ Bean ↔ API, en particulier les liens fichiers
(metro_file_link, visrad_link) ajoutés à la partie scellement.
"""

from datetime import date
from unittest.mock import MagicMock

import pytest

from app.domain.steps.models.sealing_step_bean import SealingStepBean
from app.mapper.steps.sealing_step_mapper import (
    sealing_step_mapper_api_to_bean,
    sealing_step_mapper_bean_to_api,
    sealing_step_mapper_bean_to_entity,
    sealing_step_mapper_entity_to_bean,
)

METRO_LINK = "\\\\serveur\\metro\\fsec-001.txt"
VISRAD_LINK = "https://intranet/visrad/fsec-001"


@pytest.fixture
def sample_sealing_bean():
    """Bean SealingStep de test avec liens fichiers."""
    return SealingStepBean(
        uuid="sealing-uuid-1",
        metrology_step_id="metro-uuid-1",
        date=date(2025, 3, 1),
        metrologist_name="Dupont",
        interface_io="IO-001",
        comments="Scellement validé",
        metro_file_link=METRO_LINK,
        visrad_link=VISRAD_LINK,
    )


@pytest.fixture
def mock_sealing_entity():
    """Mock SealingStepEntity exposant les liens fichiers."""
    mock = MagicMock()
    mock.uuid = "sealing-uuid-1"
    mock.metrology_step_id_id = "metro-uuid-1"
    mock.date = date(2025, 3, 1)
    mock.metrologist_name = "Dupont"
    mock.metrologist_user_id = None
    mock.rack_id_id = None
    mock.interface_io = "IO-001"
    mock.comments = "Scellement validé"
    mock.metro_file_link = METRO_LINK
    mock.visrad_link = VISRAD_LINK
    return mock


class TestSealingStepMapperEntityToBean:
    @pytest.mark.unit
    def test_entity_to_bean_reads_file_links(self, mock_sealing_entity):
        result = sealing_step_mapper_entity_to_bean(mock_sealing_entity)

        assert isinstance(result, SealingStepBean)
        assert result.metro_file_link == METRO_LINK
        assert result.visrad_link == VISRAD_LINK
        assert result.interface_io == "IO-001"

    @pytest.mark.unit
    def test_entity_to_bean_links_default_none(self):
        mock = MagicMock()
        mock.uuid = "u"
        mock.metrology_step_id_id = "m"
        mock.date = None
        mock.metrologist_name = None
        mock.metrologist_user_id = None
        mock.rack_id_id = None
        mock.interface_io = None
        mock.comments = None
        mock.metro_file_link = None
        mock.visrad_link = None

        result = sealing_step_mapper_entity_to_bean(mock)

        assert result.metro_file_link is None
        assert result.visrad_link is None


class TestSealingStepMapperBeanToEntity:
    @pytest.mark.unit
    def test_bean_to_entity_writes_file_links(self, sample_sealing_bean):
        result = sealing_step_mapper_bean_to_entity(sample_sealing_bean)

        assert result.metro_file_link == METRO_LINK
        assert result.visrad_link == VISRAD_LINK


class TestSealingStepMapperApiToBean:
    @pytest.mark.unit
    def test_api_to_bean_reads_file_links(self):
        api_data = {
            "uuid": "u",
            "metrology_step_id": "m",
            "metro_file_link": METRO_LINK,
            "visrad_link": VISRAD_LINK,
        }

        result = sealing_step_mapper_api_to_bean(api_data)

        assert result.metro_file_link == METRO_LINK
        assert result.visrad_link == VISRAD_LINK

    @pytest.mark.unit
    def test_api_to_bean_missing_links_default_none(self):
        result = sealing_step_mapper_api_to_bean({"metrology_step_id": "m"})

        assert result.metro_file_link is None
        assert result.visrad_link is None


class TestSealingStepMapperBeanToApi:
    @pytest.mark.unit
    def test_bean_to_api_exposes_file_links(self, sample_sealing_bean):
        result = sealing_step_mapper_bean_to_api(sample_sealing_bean)

        assert result["metro_file_link"] == METRO_LINK
        assert result["visrad_link"] == VISRAD_LINK


class TestSealingStepMapperRoundtrip:
    @pytest.mark.unit
    def test_bean_to_api_to_bean_preserves_links(self, sample_sealing_bean):
        api_data = sealing_step_mapper_bean_to_api(sample_sealing_bean)
        restored = sealing_step_mapper_api_to_bean(api_data)

        assert restored.metro_file_link == sample_sealing_bean.metro_file_link
        assert restored.visrad_link == sample_sealing_bean.visrad_link
