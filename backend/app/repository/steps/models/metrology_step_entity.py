"""Entite METROLOGY_STEP - Etape de metrologie."""

from django.db import models

from app.repository.fsec.models.fsec_entity import FsecEntity
from app.repository.fsec.models.fsec_rack_entity import FsecRackEntity
from app.repository.steps.models.base_step_entity import BaseStepEntity
from app.repository.steps.models.metrology_machine_entity import MetrologyMachineEntity


class MetrologyStepEntity(BaseStepEntity):
    """Entite representant une etape de metrologie."""

    class Meta:
        app_label = "app"
        db_table = "METROLOGY_STEP"

    fsec_version_id = models.ForeignKey(
        FsecEntity,
        on_delete=models.PROTECT,
        db_column="fsec_version_id",
        related_name="metrology_steps",
        to_field="version_uuid",
    )
    machine_id = models.ForeignKey(
        MetrologyMachineEntity,
        on_delete=models.PROTECT,
        db_column="machine_id",
        related_name="metrology_steps",
        null=True,
        blank=True,
    )
    rack_id = models.ForeignKey(
        FsecRackEntity,
        on_delete=models.PROTECT,
        db_column="rack_id",
        related_name="metrology_steps",
        null=True,
        blank=True,
    )
    metrologist_name = models.CharField(max_length=255, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    comments = models.TextField(max_length=4000, null=True, blank=True)
