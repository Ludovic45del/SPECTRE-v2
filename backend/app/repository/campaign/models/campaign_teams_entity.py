"""Entité CAMPAIGN_TEAMS - Équipes de campagne."""

import uuid

from django.db import models

from app.repository.campaign.models.campaign_entity import CampaignEntity
from app.repository.campaign.models.campaign_roles_entity import CampaignRolesEntity


class CampaignTeamsEntity(models.Model):
    """Entité représentant les équipes de campagne."""

    class Meta:
        app_label = "app"
        db_table = "CAMPAIGN_TEAMS"

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign_uuid = models.ForeignKey(
        CampaignEntity,
        on_delete=models.PROTECT,
        db_column="campaign_uuid",
        related_name="teams",
    )
    role_id = models.ForeignKey(
        CampaignRolesEntity,
        on_delete=models.PROTECT,
        db_column="role_id",
        related_name="team_members",
    )
    name = models.CharField(max_length=50)
