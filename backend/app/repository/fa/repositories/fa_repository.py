"""Repository FA - Implémentation IFaRepository."""

from typing import List, Optional

from django.db import transaction

from app.domain.fa.interface.fa_repository import IFaRepository
from app.domain.fa.models.fa_bean import FaBean
from app.mapper.fa.fa_mapper import fa_mapper_bean_to_entity, fa_mapper_entity_to_bean
from app.repository.fa.models.fa_entity import FaEntity


class FaRepository(IFaRepository):
    """Implémentation du repository FA."""

    SELECT_RELATED = (
        "fsec_version_id",
        # Précharge fsec → campaign → installation pour exposer fsec_name +
        # installation dans le mapper sans déclencher de N+1 sur les listes.
        "fsec_version_id__campaign_id",
        "fsec_version_id__campaign_id__installation_id",
        "status_id",
        "type_id",
        "criticality_id",
    )

    @transaction.atomic
    def create(self, bean: FaBean) -> FaBean:
        """Crée une nouvelle FA."""
        entity = fa_mapper_bean_to_entity(bean)
        entity.save()
        return fa_mapper_entity_to_bean(entity)

    def get_by_uuid(self, uuid: str) -> Optional[FaBean]:
        """Récupère une FA par son UUID."""
        try:
            entity = FaEntity.objects.select_related(*self.SELECT_RELATED).get(uuid=uuid, is_active=True)
            return fa_mapper_entity_to_bean(entity)
        except FaEntity.DoesNotExist:
            return None

    def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[FaBean]:
        """Récupère toutes les FA actives."""
        query = FaEntity.objects.select_related(*self.SELECT_RELATED).filter(is_active=True).order_by("-created_at")
        if limit is not None:
            entities = query[offset : offset + limit]
        else:
            entities = query[offset:]
        return [fa_mapper_entity_to_bean(entity) for entity in entities]

    def count_all(self) -> int:
        """Retourne le nombre total de FA actives."""
        return FaEntity.objects.filter(is_active=True).count()

    def get_by_fsec_version_id(self, fsec_version_id: str) -> Optional[FaBean]:
        """Récupère la FA active associée à une FSEC."""
        try:
            entity = FaEntity.objects.select_related(*self.SELECT_RELATED).get(
                fsec_version_id_id=fsec_version_id, is_active=True
            )
            return fa_mapper_entity_to_bean(entity)
        except FaEntity.DoesNotExist:
            return None

    @transaction.atomic
    def update(self, bean: FaBean) -> FaBean:
        """Met à jour une FA.

        AUDIT R-PERF-01 : le SELECT avant UPDATE est intentionnel.
        On a besoin de l'entité avec select_related pour retourner un bean complet.
        Pour ~2000 FA max, le surcoût est négligeable (~1ms par requête supplémentaire).
        """
        entity = FaEntity.objects.select_related(*self.SELECT_RELATED).get(uuid=bean.uuid, is_active=True)
        # FK
        entity.status_id_id = bean.status_id
        entity.type_id_id = bean.type_id
        entity.criticality_id_id = bean.criticality_id
        # Phase Ouvert
        entity.fsec_step_id = bean.fsec_step_id
        entity.fsec_step_other = bean.fsec_step_other
        entity.discoverer = bean.discoverer
        entity.event_date = bean.event_date
        entity.observation = bean.observation
        entity.location_equipment = bean.location_equipment
        entity.quick_analysis = bean.quick_analysis
        entity.immediate_measures = bean.immediate_measures
        entity.iec_validation_open = bean.iec_validation_open
        entity.iec_validation_open_date = bean.iec_validation_open_date
        entity.iec_validation_open_name = bean.iec_validation_open_name
        # Phase En cours
        entity.cause = bean.cause
        entity.experience_impact = bean.experience_impact
        entity.iec_validation_progress = bean.iec_validation_progress
        entity.iec_validation_progress_date = bean.iec_validation_progress_date
        entity.iec_validation_progress_name = bean.iec_validation_progress_name
        # Phase Clos
        entity.closure_validation = bean.closure_validation
        entity.closure_date = bean.closure_date
        entity.closure_validator_name = bean.closure_validator_name
        entity.save()
        return fa_mapper_entity_to_bean(entity)

    @transaction.atomic
    def delete(self, uuid: str) -> bool:
        """Soft-delete une FA par son UUID (is_active=False)."""
        try:
            entity = FaEntity.objects.get(uuid=uuid, is_active=True)
            entity.is_active = False
            entity.save(update_fields=["is_active"])
            return True
        except FaEntity.DoesNotExist:
            return False

    def exists_by_identifier(self, identifier: str) -> bool:
        """Vérifie si une FA active existe avec cet identifiant."""
        return FaEntity.objects.filter(identifier=identifier, is_active=True).exists()

    def exists_by_fsec_version_id(self, fsec_version_id: str) -> bool:
        """Vérifie si une FA active existe déjà pour cette FSEC."""
        return FaEntity.objects.filter(fsec_version_id_id=fsec_version_id, is_active=True).exists()
