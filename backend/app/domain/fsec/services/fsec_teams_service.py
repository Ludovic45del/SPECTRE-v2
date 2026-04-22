"""Service FsecTeams - Logique métier pure."""

import logging
from typing import List

from app.domain.exceptions import ConflictException, NotFoundException
from app.domain.fsec.interface.fsec_repository import (
    IFsecRepository,
    IFsecTeamsRepository,
)
from app.domain.fsec.models.fsec_teams_bean import FsecTeamsBean

logger = logging.getLogger(__name__)


def create_fsec_team_member(
    repository: IFsecTeamsRepository,
    bean: FsecTeamsBean,
    fsec_repository: IFsecRepository = None,
) -> FsecTeamsBean:
    """Crée un nouveau membre d'équipe.

    Args:
        repository: Le repository FsecTeams
        bean: Le bean à créer
        fsec_repository: Repository FSEC (optionnel, pour vérifier l'existence du parent)

    Raises:
        NotFoundException: Si le FSEC parent n'existe pas
        ConflictException: Si un membre avec le même nom et rôle existe déjà
    """
    # Vérifier l'existence du FSEC parent
    if fsec_repository is not None and bean.fsec_id:
        if fsec_repository.get_by_version_uuid(bean.fsec_id) is None:
            raise NotFoundException("FSEC", bean.fsec_id)

    # Vérifier les doublons (même nom + même rôle dans le même FSEC)
    existing_members = repository.get_by_fsec_id(bean.fsec_id)
    for member in existing_members:
        if member.name == bean.name and member.role_id == bean.role_id:
            raise ConflictException(
                "name/role_id",
                f"{bean.name}/{bean.role_id}",
            )

    logger.info(f"Creating fsec team member for fsec_id={bean.fsec_id}")
    result = repository.create(bean)
    logger.info(f"Created fsec team member with uuid={result.uuid}")
    return result


def get_fsec_team_member_by_uuid(
    repository: IFsecTeamsRepository, uuid: str
) -> FsecTeamsBean:
    """Récupère un membre d'équipe par son UUID."""
    bean = repository.get_by_uuid(uuid)
    if bean is None:
        raise NotFoundException("FsecTeamMember", uuid)
    return bean


def get_fsec_team_members(
    repository: IFsecTeamsRepository, fsec_id: str
) -> List[FsecTeamsBean]:
    """Récupère tous les membres d'une équipe FSEC."""
    return repository.get_by_fsec_id(fsec_id)


def update_fsec_team_member(
    repository: IFsecTeamsRepository, bean: FsecTeamsBean
) -> FsecTeamsBean:
    """Met à jour un membre d'équipe."""
    logger.info(f"Updating fsec team member uuid={bean.uuid}")
    existing = repository.get_by_uuid(bean.uuid)
    if existing is None:
        logger.warning(f"FsecTeamMember not found: uuid={bean.uuid}")
        raise NotFoundException("FsecTeamMember", bean.uuid)
    result = repository.update(bean)
    logger.info(f"Updated fsec team member uuid={bean.uuid}")
    return result


def delete_fsec_team_member(repository: IFsecTeamsRepository, uuid: str) -> bool:
    """Supprime un membre d'équipe."""
    logger.info(f"Deleting fsec team member uuid={uuid}")
    if not repository.delete(uuid):
        logger.warning(f"FsecTeamMember not found for deletion: uuid={uuid}")
        raise NotFoundException("FsecTeamMember", uuid)
    logger.info(f"Deleted fsec team member uuid={uuid}")
    return True
