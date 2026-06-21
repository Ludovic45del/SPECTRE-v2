"""Tests d'intégration API pour le Catalog Stock Controller.

Mocks la couche service ; vérifie que le controller construit la bonne réponse
HTTP (status, payload).
"""

import json
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from django.test import RequestFactory

from app.api.stock.catalog_controller import StockCatalogController
from app.domain.exceptions import NotFoundException
from app.domain.stock.models.stock_catalog_bean import StockCatalogItemBean
from app.domain.stock.models.stock_constants import (
    CATEGORY_COLLES,
    CATEGORY_PIECES_ELEMENTAIRES,
    CATEGORY_STRUCTURATION,
    ELEMENT_STATUS_DISPO,
    INSTALLATION_LMJ,
    ITEM_KIND_CONSUMABLE,
    ITEM_KIND_ELEMENT,
    STRUCTURATION_TYPE_STANDARD,
)


@pytest.fixture
def request_factory():
    return RequestFactory()


@pytest.fixture
def sample_element_api_bean():
    return StockCatalogItemBean(
        uuid="11111111-1111-4111-8111-111111111111",
        kind=ITEM_KIND_ELEMENT,
        category=CATEGORY_PIECES_ELEMENTAIRES,
        name="Cible D2",
        reference="CIB-D2-2026-042",
        installation=INSTALLATION_LMJ,
        status=ELEMENT_STATUS_DISPO,
        is_active=True,
    )


@pytest.fixture
def sample_consumable_api_bean():
    return StockCatalogItemBean(
        uuid="22222222-2222-4222-8222-222222222222",
        kind=ITEM_KIND_CONSUMABLE,
        category=CATEGORY_COLLES,
        name="Colle Araldite 2011",
        reference="COL-ARA-2011",
        unite="tubes",
        quantite=24,
        seuil_alerte=5,
        date_peremption=date(2027, 6, 30),
        is_active=True,
    )


def _make_get(factory, url):
    request = factory.get(url)
    request.query_params = {}
    return request


def _make_post(factory, url, data):
    request = factory.post(url, data=json.dumps(data), content_type="application/json")
    request.data = data
    return request


# ============================================================================
# LIST
# ============================================================================


class TestStockCatalogControllerList:
    @pytest.mark.integration
    @patch("app.api.stock.catalog_controller.list_items")
    @patch("app.api.stock.catalog_controller.count_items")
    def test_list_empty(self, mock_count, mock_list, request_factory):
        mock_list.return_value = []
        mock_count.return_value = 0
        controller = StockCatalogController()
        response = controller.list(_make_get(request_factory, "/api/v1/stock/catalog/"))
        assert response.status_code == 200
        assert json.loads(response.content) == []

    @pytest.mark.integration
    @patch("app.api.stock.catalog_controller.list_items")
    @patch("app.api.stock.catalog_controller.count_items")
    def test_list_returns_items(
        self,
        mock_count,
        mock_list,
        request_factory,
        sample_element_api_bean,
    ):
        mock_list.return_value = [sample_element_api_bean]
        mock_count.return_value = 1
        controller = StockCatalogController()
        response = controller.list(_make_get(request_factory, "/api/v1/stock/catalog/"))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]["uuid"] == sample_element_api_bean.uuid


# ============================================================================
# RETRIEVE
# ============================================================================


class TestStockCatalogControllerRetrieve:
    @pytest.mark.integration
    @patch("app.api.stock.catalog_controller.get_item")
    def test_retrieve_found(
        self, mock_get, request_factory, sample_consumable_api_bean
    ):
        mock_get.return_value = sample_consumable_api_bean
        controller = StockCatalogController()
        response = controller.retrieve(
            _make_get(
                request_factory,
                f"/api/v1/stock/catalog/{sample_consumable_api_bean.uuid}/",
            ),
            uuid=sample_consumable_api_bean.uuid,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data["uuid"] == sample_consumable_api_bean.uuid
        assert data["category"] == CATEGORY_COLLES

    @pytest.mark.integration
    @patch("app.api.stock.catalog_controller.get_item")
    def test_retrieve_not_found_raises(self, mock_get, request_factory):
        mock_get.side_effect = NotFoundException("StockCatalogItem", "missing")
        controller = StockCatalogController()
        with pytest.raises(NotFoundException):
            controller.retrieve(
                _make_get(request_factory, "/api/v1/stock/catalog/missing/"),
                uuid="missing",
            )


# ============================================================================
# CREATE
# ============================================================================


class TestStockCatalogControllerCreate:
    @pytest.mark.integration
    @patch("app.api.stock.catalog_controller.create_item")
    def test_create_consumable_success(
        self, mock_create, request_factory, sample_consumable_api_bean
    ):
        mock_create.return_value = sample_consumable_api_bean
        controller = StockCatalogController()
        request = _make_post(
            request_factory,
            "/api/v1/stock/catalog/",
            {
                "kind": ITEM_KIND_CONSUMABLE,
                "category": CATEGORY_COLLES,
                "name": "Colle Araldite 2011",
                "reference": "COL-ARA-2011",
                "unite": "tubes",
                "quantite": 24,
                "seuil_alerte": 5,
            },
        )
        response = controller.create(request)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data["category"] == CATEGORY_COLLES

    @pytest.mark.integration
    def test_create_invalid_kind_returns_400(self, request_factory):
        controller = StockCatalogController()
        request = _make_post(
            request_factory,
            "/api/v1/stock/catalog/",
            {
                "kind": "bogus",
                "category": CATEGORY_COLLES,
                "name": "X",
            },
        )
        from app.domain.exceptions import InvalidDataException

        with pytest.raises(InvalidDataException):
            controller.create(request)


# ============================================================================
# BATCH STRUCTURATION
# ============================================================================


class TestStockCatalogControllerBatchStructuration:
    @staticmethod
    def _structuration_bean(uuid, name):
        return StockCatalogItemBean(
            uuid=uuid,
            kind=ITEM_KIND_ELEMENT,
            category=CATEGORY_STRUCTURATION,
            structuration_type=STRUCTURATION_TYPE_STANDARD,
            name=name,
            installation=INSTALLATION_LMJ,
            status=ELEMENT_STATUS_DISPO,
            is_active=True,
        )

    @pytest.mark.integration
    def test_next_number_endpoint(self, request_factory):
        controller = StockCatalogController()
        controller.repository = MagicMock()
        controller.repository.next_structuration_number.return_value = 12
        response = controller.next_structuration_number(
            _make_get(
                request_factory, "/api/v1/stock/catalog/next-structuration-number/"
            )
        )
        assert response.status_code == 200
        assert json.loads(response.content) == {"next": 12}

    @pytest.mark.integration
    @patch("app.api.stock.catalog_controller.create_structuration_batch")
    def test_batch_success_returns_201_list(self, mock_batch, request_factory):
        mock_batch.return_value = [
            self._structuration_bean("a" * 8 + "-1111-4111-8111-111111111111", "11"),
            self._structuration_bean("b" * 8 + "-1111-4111-8111-111111111111", "12"),
        ]
        controller = StockCatalogController()
        request = _make_post(
            request_factory,
            "/api/v1/stock/catalog/batch-structuration/",
            {
                "structuration_type": STRUCTURATION_TYPE_STANDARD,
                "installation": INSTALLATION_LMJ,
                "quantity": 2,
            },
        )
        response = controller.batch_structuration(request)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert [item["name"] for item in data] == ["11", "12"]

    @pytest.mark.integration
    def test_batch_invalid_quantity_returns_400(self, request_factory):
        from app.domain.exceptions import InvalidDataException

        controller = StockCatalogController()
        request = _make_post(
            request_factory,
            "/api/v1/stock/catalog/batch-structuration/",
            {
                "structuration_type": STRUCTURATION_TYPE_STANDARD,
                "installation": INSTALLATION_LMJ,
                "quantity": 0,
            },
        )
        with pytest.raises(InvalidDataException):
            controller.batch_structuration(request)
