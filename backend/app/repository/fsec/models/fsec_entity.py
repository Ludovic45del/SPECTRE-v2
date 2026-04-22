"""Entité principale FSEC - Édifices Cibles."""

import uuid

from django.db import models

from app.repository.campaign.models.campaign_entity import CampaignEntity
from app.repository.fsec.models.fsec_category_entity import FsecCategoryEntity
from app.repository.fsec.models.fsec_rack_entity import FsecRackEntity
from app.repository.fsec.models.fsec_status_entity import FsecStatusEntity


class FsecEntity(models.Model):
    """Entité représentant un FSEC (Édifice Cible) avec versioning."""

    class Meta:
        app_label = "app"
        db_table = "FSEC"
        unique_together = [("campaign_id", "name")]
        indexes = [
            models.Index(fields=["fsec_uuid"], name="fsec_fsec_uuid_idx"),
            models.Index(fields=["is_active"], name="fsec_is_active_idx"),
            models.Index(fields=["campaign_id"], name="fsec_campaign_id_idx"),
        ]

    # Clé primaire - ID unique de la version
    version_uuid = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    # ID FSEC partagé entre toutes les versions
    fsec_uuid = models.UUIDField(default=uuid.uuid4, editable=False)

    # Foreign Keys
    campaign_id = models.ForeignKey(
        CampaignEntity,
        on_delete=models.PROTECT,
        db_column="campaign_id",
        related_name="fsecs",
        null=True,
        blank=True,
    )
    status_id = models.ForeignKey(
        FsecStatusEntity,
        on_delete=models.PROTECT,
        db_column="status_id",
        related_name="fsecs",
    )
    category_id = models.ForeignKey(
        FsecCategoryEntity,
        on_delete=models.PROTECT,
        db_column="category_id",
        related_name="fsecs",
    )
    rack_id = models.ForeignKey(
        FsecRackEntity,
        on_delete=models.PROTECT,
        db_column="rack_id",
        related_name="fsecs",
        null=True,
        blank=True,
    )

    # Champs de base
    name = models.CharField(max_length=50)
    comments = models.TextField(max_length=4000, null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Champs workflow (Usable Step, Installed Step, Shot Step)
    delivery_date = models.DateField(null=True, blank=True)
    shooting_date = models.DateField(null=True, blank=True)
    preshooting_pressure = models.FloatField(null=True, blank=True)
    experience_srxx = models.CharField(max_length=50, null=True, blank=True)
    localisation = models.CharField(max_length=20, null=True, blank=True)
    depressurization_failed = models.BooleanField(null=True, blank=True)
