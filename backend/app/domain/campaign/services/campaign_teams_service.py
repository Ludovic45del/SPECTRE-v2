"""Service CampaignTeams - Logique métier pure."""

import logging
from typing import List

from app.domain.campaign.interface.campaign_repository import (
    ICampaignRepository,
    ICampaignTeamsRepository,
)
from app.domain.campaign.models.campaign_teams_bean import CampaignTeamsBean
from app.domain.exceptions import ConflictException, NotFoundException

logger = logging.getLogger(__name__)


def create_campaign_team_member(
    repository: ICampaignTeamsRepository,
    bean: CampaignTeamsBean,
    campaign_repository: ICampaignRepository,
) -> CampaignTeamsBean:
    """Crée un nouveau membre d'équipe.

    Args:
        repository: Le repository CampaignTeams
        bean: Le bean à créer
        campaign_repository: Repository Campaign (optionnel, pour vérifier l'existence du parent)

    Raises:
        NotFoundException: Si la campagne parente n'existe pas
        ConflictException: Si un membre avec le même nom et rôle existe déjà
    """
    # Vérifier l'existence de la campagne parente
    if campaign_repository is not None and bean.campaign_uuid:
        if campaign_repository.get_by_uuid(bean.campaign_uuid) is None:
            raise NotFoundException("Campaign", bean.campaign_uuid)

    # Vérifier les doublons (même nom + même rôle dans la même campagne)
    existing_members = repository.get_by_campaign_uuid(bean.campaign_uuid)
    for member in existing_members:
        if member.name == bean.name and member.role_id == bean.role_id:
            raise ConflictException(
                "name/role_id",
                f"Le membre '{bean.name}' avec le rôle {bean.role_id} existe déjà dans cette campagne",
            )

    logger.info(f"Creating campaign team member for campaign_uuid={bean.campaign_uuid}")
    result = repository.create(bean)
    logger.info(f"Created campaign team member uuid={result.uuid}")
    return result


def get_campaign_team_member_by_uuid(
    repository: ICampaignTeamsRepository, uuid: str
) -> CampaignTeamsBean:
    """Récupère un membre d'équipe par son UUID."""
    bean = repository.get_by_uuid(uuid)
    if bean is None:
        raise NotFoundException("CampaignTeamMember", uuid)
    return bean


def get_campaign_team_members(
    repository: ICampaignTeamsRepository, campaign_uuid: str
) -> List[CampaignTeamsBean]:
    """Récupère tous les membres d'une équipe de campagne."""
    return repository.get_by_campaign_uuid(campaign_uuid)


def update_campaign_team_member(
    repository: ICampaignTeamsRepository, bean: CampaignTeamsBean
) -> CampaignTeamsBean:
    """Met à jour un membre d'équipe."""
    existing = repository.get_by_uuid(bean.uuid)
    if existing is None:
        raise NotFoundException("CampaignTeamMember", bean.uuid)

    # Vérifier que le changement de nom/rôle ne crée pas de doublon
    has_key_changed = bean.name != existing.name or bean.role_id != existing.role_id
    if has_key_changed:
        existing_members = repository.get_by_campaign_uuid(bean.campaign_uuid)
        for member in existing_members:
            if (
                member.uuid != bean.uuid
                and member.name == bean.name
                and member.role_id == bean.role_id
            ):
                raise ConflictException(
                    "name/role_id",
                    f"Le membre '{bean.name}' avec le rôle {bean.role_id} existe déjà dans cette campagne",
                )

    logger.info(f"Updating campaign team member uuid={bean.uuid}")
    return repository.update(bean)


def delete_campaign_team_member(
    repository: ICampaignTeamsRepository, uuid: str
) -> bool:
    """Supprime un membre d'équipe."""
    existing = repository.get_by_uuid(uuid)
    if existing is None:
        raise NotFoundException("CampaignTeamMember", uuid)
    logger.info(f"Deleting campaign team member uuid={uuid}")
    if not repository.delete(uuid):
        raise NotFoundException("CampaignTeamMember", uuid)
    logger.info(f"Deleted campaign team member uuid={uuid}")
    return True
