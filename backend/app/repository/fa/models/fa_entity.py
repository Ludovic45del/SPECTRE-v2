"""Entité principale FA - Fiche d'Anomalie."""

import uuid

from django.db import models

from app.repository.fa.models.fa_criticality_entity import FaCriticalityEntity
from app.repository.fa.models.fa_status_entity import FaStatusEntity
from app.repository.fa.models.fa_type_entity import FaTypeEntity
from app.repository.fsec.models.fsec_entity import FsecEntity


class FaEntity(models.Model):
    """Entité représentant une Fiche d'Anomalie (FA)."""

    class Meta:
        app_label = "app"
        db_table = "FA"
        indexes = [
            models.Index(fields=["fsec_version_id"], name="fa_fsec_idx"),
            models.Index(fields=["status_id"], name="fa_status_idx"),
        ]

    # Clé primaire
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Foreign Keys
    fsec_version_id = models.OneToOneField(
        FsecEntity,
        on_delete=models.PROTECT,
        db_column="fsec_version_id",
        related_name="fa",
        to_field="version_uuid",
    )
    status_id = models.ForeignKey(
        FaStatusEntity,
        on_delete=models.PROTECT,
        db_column="status_id",
        related_name="fas",
    )
    type_id = models.ForeignKey(
        FaTypeEntity,
        on_delete=models.PROTECT,
        db_column="type_id",
        related_name="fas",
        null=True,
        blank=True,
    )
    criticality_id = models.ForeignKey(
        FaCriticalityEntity,
        on_delete=models.PROTECT,
        db_column="criticality_id",
        related_name="fas",
        null=True,
        blank=True,
    )

    # Identifiant généré automatiquement
    identifier = models.CharField(max_length=100, unique=True)

    # Phase Ouvert
    fsec_step_id = models.IntegerField(
        null=True, blank=True
    )  # Étape FSEC où l'anomalie a été découverte
    fsec_step_other = models.CharField(
        max_length=255, null=True, blank=True
    )  # Précision si "Autre"
    discoverer = models.CharField(max_length=100)
    event_date = models.DateField()
    observation = models.TextField()
    location_equipment = models.CharField(max_length=255, null=True, blank=True)
    quick_analysis = models.TextField()
    immediate_measures = models.TextField(null=True, blank=True)
    iec_validation_open = models.BooleanField(default=False)
    iec_validation_open_date = models.DateField(null=True, blank=True)
    iec_validation_open_name = models.CharField(max_length=100, null=True, blank=True)

    # Phase En cours
    cause = models.TextField(null=True, blank=True)
    experience_impact = models.TextField(null=True, blank=True)
    iec_validation_progress = models.BooleanField(default=False)
    iec_validation_progress_date = models.DateField(null=True, blank=True)
    iec_validation_progress_name = models.CharField(
        max_length=100, null=True, blank=True
    )

    # Phase Clos
    closure_validation = models.TextField(null=True, blank=True)
    closure_date = models.DateField(null=True, blank=True)
    closure_validator_name = models.CharField(max_length=100, null=True, blank=True)

    # Soft delete
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
