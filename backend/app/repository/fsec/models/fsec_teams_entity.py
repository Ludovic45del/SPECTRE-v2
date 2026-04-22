"""Entité FSEC_TEAMS - Équipes FSEC."""

import uuid

from django.db import models

from app.repository.fsec.models.fsec_entity import FsecEntity
from app.repository.fsec.models.fsec_roles_entity import FsecRolesEntity


class FsecTeamsEntity(models.Model):
    """Entité représentant les équipes FSEC."""

    class Meta:
        app_label = "app"
        db_table = "FSEC_TEAMS"

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fsec_id = models.ForeignKey(
        FsecEntity,
        on_delete=models.PROTECT,
        db_column="fsec_id",
        related_name="teams",
        to_field="version_uuid",
    )
    role_id = models.ForeignKey(
        FsecRolesEntity,
        on_delete=models.PROTECT,
        db_column="role_id",
        related_name="team_members",
    )
    name = models.CharField(max_length=50)
