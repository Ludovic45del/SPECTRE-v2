"""Tests unitaires du service element_lifecycle Stock (cf. CDC §4.1, §4.2)."""

import uuid

import pytest

from app.domain.exceptions import ConflictException, NotFoundException
from app.domain.stock.models.fsec_assembly_item_bean import FsecAssemblyItemBean
from app.domain.stock.models.stock_constants import (
    ELEMENT_STATUS_AFFECTEE,
    ELEMENT_STATUS_DISPO,
    ELEMENT_STATUS_RESERVEE,
    ELEMENT_STATUS_TIREE,
    ERROR_CODE_ELEMENT_ALREADY_USED,
    FSEC_STATUS_ID_EN_COURS_ASSEMBLAGE,
    FSEC_STATUS_ID_TIREE,
)
from app.domain.stock.services.element_lifecycle_service import (
    release_element,
    reserve_element,
    sync_element_statuses_for_fsec,
)


class TestReserveElement:
    @pytest.mark.unit
    def test_reserve_dispo_element(
        self,
        sample_element_bean,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
    ):
        sample_element_bean.status = ELEMENT_STATUS_DISPO
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_element_bean
        mock_fsec_assembly_repository.find_active_assignment_for_element.return_value = (
            None
        )
        reserve_element(
            mock_stock_catalog_repository,
            mock_fsec_assembly_repository,
            sample_element_bean.uuid,
            stock_fsec_uuid,
        )
        mock_stock_catalog_repository.update_status_for_uuids.assert_called_once_with(
            [sample_element_bean.uuid], ELEMENT_STATUS_RESERVEE
        )

    @pytest.mark.unit
    def test_reserve_no_op_for_consumable(
        self,
        sample_consumable_bean,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
    ):
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_consumable_bean
        reserve_element(
            mock_stock_catalog_repository,
            mock_fsec_assembly_repository,
            sample_consumable_bean.uuid,
            stock_fsec_uuid,
        )
        mock_stock_catalog_repository.update_status_for_uuids.assert_not_called()

    @pytest.mark.unit
    def test_reserve_already_used_on_other_fsec_conflict(
        self,
        sample_element_bean,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
    ):
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_element_bean
        # Une autre FSEC utilise déjà cet élément
        other_fsec = "99999999-9999-4999-8999-999999999999"
        mock_fsec_assembly_repository.find_active_assignment_for_element.return_value = FsecAssemblyItemBean(
            uuid=str(uuid.uuid4()),
            fsec_uuid=other_fsec,
            catalog_item_uuid=sample_element_bean.uuid,
        )
        with pytest.raises(ConflictException) as exc:
            reserve_element(
                mock_stock_catalog_repository,
                mock_fsec_assembly_repository,
                sample_element_bean.uuid,
                stock_fsec_uuid,
            )
        assert exc.value.field == ERROR_CODE_ELEMENT_ALREADY_USED

    @pytest.mark.unit
    def test_reserve_idempotent_same_fsec(
        self,
        sample_element_bean,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
    ):
        # Élément déjà réservé sur la MÊME fsec → no-op
        sample_element_bean.status = ELEMENT_STATUS_RESERVEE
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_element_bean
        mock_fsec_assembly_repository.find_active_assignment_for_element.return_value = FsecAssemblyItemBean(
            uuid=str(uuid.uuid4()),
            fsec_uuid=stock_fsec_uuid,
            catalog_item_uuid=sample_element_bean.uuid,
        )
        reserve_element(
            mock_stock_catalog_repository,
            mock_fsec_assembly_repository,
            sample_element_bean.uuid,
            stock_fsec_uuid,
        )
        mock_stock_catalog_repository.update_status_for_uuids.assert_not_called()

    @pytest.mark.unit
    def test_reserve_unknown_item_raises(
        self,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
    ):
        mock_stock_catalog_repository.get_by_uuid.return_value = None
        with pytest.raises(NotFoundException):
            reserve_element(
                mock_stock_catalog_repository,
                mock_fsec_assembly_repository,
                "missing",
                stock_fsec_uuid,
            )


class TestReleaseElement:
    @pytest.mark.unit
    def test_release_reservee_to_dispo(
        self, sample_element_bean, mock_stock_catalog_repository
    ):
        sample_element_bean.status = ELEMENT_STATUS_RESERVEE
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_element_bean
        release_element(mock_stock_catalog_repository, sample_element_bean.uuid)
        mock_stock_catalog_repository.update_status_for_uuids.assert_called_once_with(
            [sample_element_bean.uuid], ELEMENT_STATUS_DISPO
        )

    @pytest.mark.unit
    def test_release_tiree_is_no_op(
        self, sample_element_bean, mock_stock_catalog_repository
    ):
        sample_element_bean.status = ELEMENT_STATUS_TIREE
        mock_stock_catalog_repository.get_by_uuid.return_value = sample_element_bean
        release_element(mock_stock_catalog_repository, sample_element_bean.uuid)
        mock_stock_catalog_repository.update_status_for_uuids.assert_not_called()


class TestSyncElementStatusesForFsec:
    @pytest.mark.unit
    def test_sync_to_affectee_when_assemblage(
        self,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
        stock_element_uuid,
    ):
        mock_fsec_assembly_repository.list_catalog_uuids_by_fsec.return_value = [
            stock_element_uuid
        ]
        mock_stock_catalog_repository.update_status_for_uuids.return_value = 1
        updated = sync_element_statuses_for_fsec(
            mock_stock_catalog_repository,
            mock_fsec_assembly_repository,
            stock_fsec_uuid,
            FSEC_STATUS_ID_EN_COURS_ASSEMBLAGE,
        )
        assert updated == 1
        mock_stock_catalog_repository.update_status_for_uuids.assert_called_once_with(
            [stock_element_uuid], ELEMENT_STATUS_AFFECTEE
        )

    @pytest.mark.unit
    def test_sync_to_tiree_when_tiree(
        self,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
        stock_element_uuid,
    ):
        mock_fsec_assembly_repository.list_catalog_uuids_by_fsec.return_value = [
            stock_element_uuid
        ]
        mock_stock_catalog_repository.update_status_for_uuids.return_value = 1
        sync_element_statuses_for_fsec(
            mock_stock_catalog_repository,
            mock_fsec_assembly_repository,
            stock_fsec_uuid,
            FSEC_STATUS_ID_TIREE,
        )
        mock_stock_catalog_repository.update_status_for_uuids.assert_called_once_with(
            [stock_element_uuid], ELEMENT_STATUS_TIREE
        )

    @pytest.mark.unit
    def test_sync_no_op_for_other_status(
        self,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
    ):
        # status_id=3 (En attente de scellement) → pas de couplage
        updated = sync_element_statuses_for_fsec(
            mock_stock_catalog_repository,
            mock_fsec_assembly_repository,
            stock_fsec_uuid,
            3,
        )
        assert updated == 0
        mock_stock_catalog_repository.update_status_for_uuids.assert_not_called()

    @pytest.mark.unit
    def test_sync_no_op_when_no_elements(
        self,
        mock_stock_catalog_repository,
        mock_fsec_assembly_repository,
        stock_fsec_uuid,
    ):
        mock_fsec_assembly_repository.list_catalog_uuids_by_fsec.return_value = []
        updated = sync_element_statuses_for_fsec(
            mock_stock_catalog_repository,
            mock_fsec_assembly_repository,
            stock_fsec_uuid,
            FSEC_STATUS_ID_TIREE,
        )
        assert updated == 0
        mock_stock_catalog_repository.update_status_for_uuids.assert_not_called()
