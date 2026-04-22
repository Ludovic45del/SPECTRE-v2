"""Entite PLANNING_LAB_MACHINE - Machines du laboratoire."""

import uuid

from django.db import models

from app.repository.planning.models.lab_salle_entity import LabSalleEntity


class LabMachineEntity(models.Model):
    """Represente une machine dans une salle du laboratoire."""

    class Meta:
        app_label = "app"
        db_table = "PLANNING_LAB_MACHINE"
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["salle", "name"],
                name="uq_planning_lab_machine_salle_name",
            ),
        ]

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salle = models.ForeignKey(
        LabSalleEntity, on_delete=models.CASCADE, db_column="salle_id"
    )
    name = models.CharField(max_length=100)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
