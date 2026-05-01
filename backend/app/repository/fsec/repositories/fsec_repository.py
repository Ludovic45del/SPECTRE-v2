"""Repository FSEC - Implémentation IFsecRepository."""

from typing import List, Optional

from django.db import transaction

from app.domain.fsec.interface.fsec_repository import IFsecRepository
from app.domain.fsec.models.fsec_bean import FsecBean
from app.mapper.fsec.fsec_mapper import fsec_mapper_bean_to_entity, fsec_mapper_entity_to_bean
from app.repository.fsec.models.fsec_entity import FsecEntity


class FsecRepository(IFsecRepository):
    """Implémentation du repository FSEC."""

    SELECT_RELATED = ("campaign_id", "status_id", "category_id", "rack_id")

    def _base_queryset(self):
        """Queryset de base avec select_related sur les FK."""
        return FsecEntity.objects.select_related(*self.SELECT_RELATED)

    @transaction.atomic
    def create(self, bean: FsecBean) -> FsecBean:
        """Crée un nouveau FSEC."""
        entity = fsec_mapper_bean_to_entity(bean)
        entity.save()
        return fsec_mapper_entity_to_bean(entity)

    def get_by_version_uuid(self, version_uuid: str) -> Optional[FsecBean]:
        """Récupère un FSEC par son version_uuid (PK)."""
        try:
            entity = self._base_queryset().get(version_uuid=version_uuid)
            return fsec_mapper_entity_to_bean(entity)
        except FsecEntity.DoesNotExist:
            return None

    def get_by_fsec_uuid(self, fsec_uuid: str) -> List[FsecBean]:
        """Récupère toutes les versions d'un FSEC par son fsec_uuid."""
        entities = self._base_queryset().filter(fsec_uuid=fsec_uuid)
        return [fsec_mapper_entity_to_bean(entity) for entity in entities]

    def get_active_by_fsec_uuid(self, fsec_uuid: str) -> Optional[FsecBean]:
        """Récupère la version active d'un FSEC."""
        try:
            entity = self._base_queryset().get(fsec_uuid=fsec_uuid, is_active=True)
            return fsec_mapper_entity_to_bean(entity)
        except FsecEntity.DoesNotExist:
            return None

    def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[FsecBean]:
        """Récupère tous les FSECs."""
        query = self._base_queryset().all()
        if limit is not None:
            entities = query[offset : offset + limit]
        else:
            entities = query[offset:]
        return [fsec_mapper_entity_to_bean(entity) for entity in entities]

    def count_all(self) -> int:
        """Retourne le nombre de FSECs."""
        return FsecEntity.objects.count()

    def get_all_active(self) -> List[FsecBean]:
        """Récupère tous les FSECs actifs."""
        entities = self._base_queryset().filter(is_active=True)
        return [fsec_mapper_entity_to_bean(entity) for entity in entities]

    def get_by_campaign_id(self, campaign_id: str) -> List[FsecBean]:
        """Récupère tous les FSECs d'une campagne."""
        entities = self._base_queryset().filter(campaign_id_id=campaign_id)
        return [fsec_mapper_entity_to_bean(entity) for entity in entities]

    @transaction.atomic
    def update(self, bean: FsecBean) -> FsecBean:
        """Met à jour un FSEC."""
        entity = self._base_queryset().get(version_uuid=bean.version_uuid)
        entity.campaign_id_id = bean.campaign_id
        entity.status_id_id = bean.status_id
        entity.category_id_id = bean.category_id
        entity.rack_id_id = bean.rack_id
        entity.name = bean.name
        entity.comments = bean.comments
        entity.is_active = bean.is_active
        entity.delivery_date = bean.delivery_date
        entity.shooting_date = bean.shooting_date
        entity.preshooting_pressure = bean.preshooting_pressure
        entity.experience_srxx = bean.experience_srxx
        entity.localisation = bean.localisation
        entity.depressurization_failed = bean.depressurization_failed
        entity.save()
        return fsec_mapper_entity_to_bean(entity)

    @transaction.atomic
    def delete(self, version_uuid: str) -> bool:
        """Supprime un FSEC par son version_uuid."""
        try:
            entity = FsecEntity.objects.get(version_uuid=version_uuid)
            entity.delete()
            return True
        except FsecEntity.DoesNotExist:
            return False

    def exists_by_campaign_and_name(self, campaign_id: str, name: str) -> bool:
        """Vérifie si un FSEC existe pour cette campagne avec ce nom."""
        return FsecEntity.objects.filter(campaign_id_id=campaign_id, name=name).exists()

    def exists_by_name(self, name: str) -> bool:
        """Vérifie si un FSEC existe avec ce nom (sans campagne)."""
        return FsecEntity.objects.filter(name=name, campaign_id_id__isnull=True).exists()

    @transaction.atomic
    def deactivate_all_versions(self, fsec_uuid: str) -> bool:
        """Désactive toutes les versions d'un FSEC.

        Utilise select_for_update() pour verrouiller les lignes et éviter
        les race conditions lors du versioning concurrent.
        """
        rows = FsecEntity.objects.select_for_update().filter(fsec_uuid=fsec_uuid)
        updated = rows.update(is_active=False)
        return updated > 0

    @transaction.atomic
    def create_version_atomic(self, fsec_uuid: str, bean: FsecBean) -> FsecBean:
        """Désactive toutes les versions et crée la nouvelle version active.

        Exécuté dans une seule transaction atomique avec select_for_update()
        pour garantir qu'une seule version active existe à tout moment.
        """
        FsecEntity.objects.select_for_update().filter(fsec_uuid=fsec_uuid).update(is_active=False)
        bean.fsec_uuid = fsec_uuid
        bean.is_active = True
        entity = fsec_mapper_bean_to_entity(bean)
        entity.save()
        return fsec_mapper_entity_to_bean(entity)
