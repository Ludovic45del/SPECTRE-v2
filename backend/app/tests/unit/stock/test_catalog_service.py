"""Tests unitaires du service catalog Stock.

Couverture des règles CDC §3.1 et §10.1.
"""

import pytest

from app.domain.exceptions import (
    ConflictException,
    NotFoundException,
    ValidationException,
)
from app.domain.stock.models.stock_catalog_bean import StockCatalogItemBean
from app.domain.stock.models.stock_constants import (
    CATEGORY_COLLES,
    CATEGORY_PIECES_ELEMENTAIRES,
    ELEMENT_STATUS_DISPO,
    ERROR_CODE_CATALOG_ITEM_IN_USE,
    ERROR_CODE_INVALID_KIND_CATEGORY,
    INSTALLATION_LMJ,
    ITEM_KIND_CONSUMABLE,
    ITEM_KIND_ELEMENT,
)
from app.domain.stock.services.catalog_service import (
    create_item,
    get_item,
    list_items,
    patch_item,
    soft_delete_item,
    update_item,
)


class TestCreateItem:
    @pytest.mark.unit
    def test_create_element_success(
        self, sample_element_bean, mock_stock_catalog_repository
    ):
        mock_stock_catalog_repository.create.return_value = sample_element_bean
        result = create_item(mock_stock_catalog_repository, sample_element_bean)
        assert result.uuid == sample_element_bean.uuid
        mock_stock_catalog_repository.create.assert_called_once()

    @pytest.mark.unit
    def test_create_consumable_success(
        self, sample_consumable_bean, mock_stock_catalog_repository
    ):
        mock_stock_catalog_repository.create.return_value = sample_consumable_bean
        result = create_item(mock_stock_catalog_repository, sample_consumable_bean)
        assert result.uuid == sample_consumable_bean.uuid

    @pytest.mark.unit
    def test_create_rejects_invalid_kind(self, mock_stock_catalog_repository):
        bean = StockCatalogItemBean(kind="bogus", category=CATEGORY_COLLES, name="X")
        with pytest.raises(ValidationException) as exc:
            create_item(mock_stock_catalog_repository, bean)
        assert exc.value.field == "kind"

    @pytest.mark.unit
    def test_create_rejects_kind_category_mismatch(self, mock_stock_catalog_repository):
        # consumable + rubrique element → doit lever INVALID_KIND_CATEGORY
        bean = StockCatalogItemBean(
            kind=ITEM_KIND_CONSUMABLE,
            category=CATEGORY_PIECES_ELEMENTAIRES,
            name="Bad",
            unite="tubes",
            quantite=1,
        )
        with pytest.raises(ValidationException) as exc:
            create_item(mock_stock_catalog_repository, bean)
        assert exc.value.field == ERROR_CODE_INVALID_KIND_CATEGORY

    @pytest.mark.unit
    def test_create_element_requires_installation(self, mock_stock_catalog_repository):
        bean = StockCatalogItemBean(
            kind=ITEM_KIND_ELEMENT,
            category=CATEGORY_PIECES_ELEMENTAIRES,
            name="Cible sans install",
            installation=None,
        )
        with pytest.raises(ValidationException) as exc:
            create_item(mock_stock_catalog_repository, bean)
        assert exc.value.field == "installation"

    @pytest.mark.unit
    def test_create_element_rejects_consumable_fields(
        self, mock_stock_catalog_repository
    ):
        bean = StockCatalogItemBean(
            kind=ITEM_KIND_ELEMENT,
            category=CATEGORY_PIECES_ELEMENTAIRES,
            name="Cible",
            installation=INSTALLATION_LMJ,
            unite="tubes",  # interdit pour element
        )
        with pytest.raises(ValidationException) as exc:
            create_item(mock_stock_catalog_repository, bean)
        assert exc.value.field == "unite"

    @pytest.mark.unit
    def test_create_consumable_requires_unite(self, mock_stock_catalog_repository):
        bean = StockCatalogItemBean(
            kind=ITEM_KIND_CONSUMABLE,
            category=CATEGORY_COLLES,
            name="Colle sans unité",
            unite=None,
            quantite=10,
        )
        with pytest.raises(ValidationException) as exc:
            create_item(mock_stock_catalog_repository, bean)
        assert exc.value.field == "unite"

    @pytest.mark.unit
    def test_create_consumable_requires_quantite(self, mock_stock_catalog_repository):
        bean = StockCatalogItemBean(
            kind=ITEM_KIND_CONSUMABLE,
            category=CATEGORY_COLLES,
            name="Colle sans qté",
            unite="tubes",
            quantite=None,
        )
        with pytest.raises(ValidationException) as exc:
            create_item(mock_stock_catalog_repository, bean)
        assert exc.value.field == "quantite"

    @pytest.mark.unit
    def test_create_consumable_rejects_negative_qty(
        self, mock_stock_catalog_repository
    ):
        bean = StockCatalogItemBean(
            kind=ITEM_KIND_CONSUMABLE,
            category=CATEGORY_COLLES,
            name="Colle",
            unite="tubes",
            quantite=-1,
        )
        with pytest.raises(ValidationException) as exc:
            create_item(mock_stock_catalog_repository, bean)
        assert exc.value.field == "quantite"

    @pytest.mark.unit
    def test_create_consumable_rejects_element_only_fields(
        self, mock_stock_catalog_repository
    ):
        bean = StockCatalogItemBean(
            kind=ITEM_KIND_CONSUMABLE,
            category=CATEGORY_COLLES,
            name="Colle",
            unite="tubes",
            quantite=1,
            installation=INSTALLATION_LMJ,  # interdit pour consumable
        )
        with pytest.raises(ValidationException) as exc:
            create_item(mock_stock_catalog_repository, bean)
        assert exc.value.field == "installation"

    @pytest.mark.unit
    def test_create_rejects_duplicate(
        self, sample_element_bean, mock_stock_catalog_repository
    ):
        mock_stock_catalog_repository.exists_by_kind_name_reference.return_value = True
        with pytest.raises(ConflictException):
            create_item(mock_stock_catalog_repository, sample_element_bean)
        mock_stock_catalog_repository.create.assert_not_called()

    @pytest.mark.unit
    def test_create_element_defaults_status_to_dispo(
        self, mock_stock_catalog_repository
    ):
        # status omis → service force `dispo`
        bean = StockCatalogItemBean(
            kind=ITEM_KIND_ELEMENT,
            category=CATEGORY_PIECES_ELEMENTAIRES,
            name="Cible default",
            installation=INSTALLATION_LMJ,
            status=None,
        )
        mock_stock_catalog_repository.create.return_value = bean
        create_item(mock_stock_catalog_repository, bean)
        # Le bean est mutuellement modifié par _validate_kind_specific_fields.
        assert bean.status == ELEMENT_STATUS_DISPO


class TestGetItem:
    @pytest.mark.unit
    def test_get_item_found(self, sample_element_bean, mock_stock_catalog_repository):
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_element_bean
        result = get_item(mock_stock_catalog_repository, sample_element_bean.uuid)
        assert result.uuid == sample_element_bean.uuid

    @pytest.mark.unit
    def test_get_item_not_found_raises(self, mock_stock_catalog_repository):
        mock_stock_catalog_repository.get_by_uuid.return_value = None
        with pytest.raises(NotFoundException):
            get_item(mock_stock_catalog_repository, "missing-uuid")


class TestListItems:
    @pytest.mark.unit
    def test_list_items_passes_filters(self, mock_stock_catalog_repository):
        mock_stock_catalog_repository.list_by_filters.return_value = []
        list_items(
            mock_stock_catalog_repository,
            kind=ITEM_KIND_CONSUMABLE,
            category=CATEGORY_COLLES,
            limit=10,
            offset=0,
        )
        mock_stock_catalog_repository.list_by_filters.assert_called_once_with(
            kind=ITEM_KIND_CONSUMABLE,
            category=CATEGORY_COLLES,
            status=None,
            installation=None,
            is_active=True,
            search=None,
            limit=10,
            offset=0,
        )


class TestUpdateItem:
    @pytest.mark.unit
    def test_update_preserves_kind(
        self, sample_element_bean, mock_stock_catalog_repository
    ):
        # Tentative de modifier kind via PUT — doit être ignoré.
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_element_bean
        mock_stock_catalog_repository.update.return_value = sample_element_bean

        modified = StockCatalogItemBean(
            uuid=sample_element_bean.uuid,
            kind=ITEM_KIND_CONSUMABLE,  # tentative de changement
            category=CATEGORY_PIECES_ELEMENTAIRES,
            name="Renamed",
            installation=INSTALLATION_LMJ,
        )
        update_item(mock_stock_catalog_repository, modified)
        # Le service force kind à la valeur en base avant validation
        assert modified.kind == ITEM_KIND_ELEMENT


class TestPatchItem:
    @pytest.mark.unit
    def test_patch_ignores_unknown_fields(
        self, sample_consumable_bean, mock_stock_catalog_repository
    ):
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_consumable_bean
        mock_stock_catalog_repository.update.return_value = sample_consumable_bean

        patch_item(
            mock_stock_catalog_repository,
            sample_consumable_bean.uuid,
            {"unknown_field": "ignored", "remarques": "Note"},
        )
        # Pas de crash = OK ; le repository est appelé avec le bean fusionné.
        mock_stock_catalog_repository.update.assert_called_once()

    @pytest.mark.unit
    def test_patch_kind_field_silently_ignored(
        self, sample_consumable_bean, mock_stock_catalog_repository
    ):
        # `kind` n'est pas dans ALLOWED_PATCH_FIELDS → ignoré silencieusement.
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_consumable_bean
        mock_stock_catalog_repository.update.return_value = sample_consumable_bean

        patch_item(
            mock_stock_catalog_repository,
            sample_consumable_bean.uuid,
            {"kind": ITEM_KIND_ELEMENT},
        )
        # Le bean fusionné conserve son kind d'origine.
        assert sample_consumable_bean.kind == ITEM_KIND_CONSUMABLE


class TestSoftDelete:
    @pytest.mark.unit
    def test_soft_delete_success(
        self, sample_consumable_bean, mock_stock_catalog_repository
    ):
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_consumable_bean
        mock_stock_catalog_repository.is_referenced_by_assembly.return_value = False
        mock_stock_catalog_repository.soft_delete.return_value = True

        assert soft_delete_item(
            mock_stock_catalog_repository, sample_consumable_bean.uuid
        )

    @pytest.mark.unit
    def test_soft_delete_rejected_if_referenced(
        self, sample_consumable_bean, mock_stock_catalog_repository
    ):
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_consumable_bean
        mock_stock_catalog_repository.is_referenced_by_assembly.return_value = True

        with pytest.raises(ValidationException) as exc:
            soft_delete_item(mock_stock_catalog_repository, sample_consumable_bean.uuid)
        assert exc.value.field == ERROR_CODE_CATALOG_ITEM_IN_USE

    @pytest.mark.unit
    def test_soft_delete_not_found(self, mock_stock_catalog_repository):
        mock_stock_catalog_repository.get_by_uuid.return_value = None
        with pytest.raises(NotFoundException):
            soft_delete_item(mock_stock_catalog_repository, "missing-uuid")
