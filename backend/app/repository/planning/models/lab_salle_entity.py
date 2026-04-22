"""Entité PLANNING_LAB_SALLE - Salles du laboratoire."""

import uuid

from django.db import models


class LabSalleEntity(models.Model):
    """Représente une salle du laboratoire dans le planning Vie Labo."""

    class Meta:
        app_label = "app"
        db_table = "PLANNING_LAB_SALLE"
        ordering = ["sort_order", "name"]

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
