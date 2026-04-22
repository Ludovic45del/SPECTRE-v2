"""Repository AssemblyStep - Implémentation IAssemblyStepRepository."""

from typing import List, Optional

from django.db import transaction

from app.domain.exceptions import ValidationException
from app.domain.steps.interface.steps_repository import IAssemblyStepRepository
from app.domain.steps.models.assembly_step_bean import AssemblyStepBean
from app.mapper.steps.assembly_step_mapper import (
    assembly_step_mapper_bean_to_entity,
    assembly_step_mapper_entity_to_bean,
)
from app.repository.steps.models.assembly_bench_entity import AssemblyBenchEntity
from app.repository.steps.models.assembly_step_entity import AssemblyStepEntity


class AssemblyStepRepository(IAssemblyStepRepository):
    """Implémentation du repository AssemblyStep."""

    select_related_fields = ("fsec_version_id",)
    prefetch_related_fields = ("assembly_bench",)

    def _base_queryset(self):
        """Returns queryset with select_related and prefetch_related applied."""
        return AssemblyStepEntity.objects.select_related(
            *self.select_related_fields
        ).prefetch_related(*self.prefetch_related_fields)

    def _get_valid_bench_ids(self) -> set:
        """Récupère les IDs valides depuis la base de données."""
        return set(AssemblyBenchEntity.objects.values_list("id", flat=True))

    def _validate_bench_ids(self, bench_ids: List[int]) -> None:
        """Valide que les IDs de bancs existent dans la base."""
        if not bench_ids:
            return
        valid_ids = self._get_valid_bench_ids()
        invalid_ids = set(bench_ids) - valid_ids
        if invalid_ids:
            raise ValidationException(
                "assembly_bench_ids",
                f"IDs invalides: {invalid_ids}. Valeurs acceptées: {valid_ids}",
            )

    @transaction.atomic
    def create(self, bean: AssemblyStepBean) -> AssemblyStepBean:
        """Crée une nouvelle étape d'assemblage."""
        if bean.assembly_bench_ids:
            self._validate_bench_ids(bean.assembly_bench_ids)

        entity = assembly_step_mapper_bean_to_entity(bean)
        entity.save()

        if bean.assembly_bench_ids:
            benches = AssemblyBenchEntity.objects.filter(id__in=bean.assembly_bench_ids)
            entity.assembly_bench.set(benches)

        return assembly_step_mapper_entity_to_bean(entity)

    def get_by_uuid(self, uuid: str) -> Optional[AssemblyStepBean]:
        """Récupère une étape d'assemblage par son UUID."""
        try:
            entity = self._base_queryset().get(uuid=uuid)
            return assembly_step_mapper_entity_to_bean(entity)
        except AssemblyStepEntity.DoesNotExist:
            return None

    def get_by_fsec_version_id(self, fsec_version_id: str) -> List[AssemblyStepBean]:
        """Récupère toutes les étapes d'assemblage d'un FSEC."""
        entities = self._base_queryset().filter(fsec_version_id_id=fsec_version_id)
        return [assembly_step_mapper_entity_to_bean(entity) for entity in entities]

    @transaction.atomic
    def update(self, bean: AssemblyStepBean) -> AssemblyStepBean:
        """Met à jour une étape d'assemblage."""
        if bean.assembly_bench_ids is not None:
            self._validate_bench_ids(bean.assembly_bench_ids)

        entity = AssemblyStepEntity.objects.get(uuid=bean.uuid)
        entity.fsec_version_id_id = bean.fsec_version_id
        entity.hydrometric_temperature = bean.hydrometric_temperature
        entity.start_date = bean.start_date
        entity.end_date = bean.end_date
        entity.comments = bean.comments
        entity.save()

        if bean.assembly_bench_ids is not None:
            benches = AssemblyBenchEntity.objects.filter(id__in=bean.assembly_bench_ids)
            entity.assembly_bench.set(benches)

        return assembly_step_mapper_entity_to_bean(entity)

    @transaction.atomic
    def delete(self, uuid: str) -> bool:
        """Supprime une étape d'assemblage par son UUID."""
        try:
            entity = AssemblyStepEntity.objects.get(uuid=uuid)
            entity.delete()
            return True
        except AssemblyStepEntity.DoesNotExist:
            return False
