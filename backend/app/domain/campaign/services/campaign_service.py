"""Service Campaign - Logique métier pure."""

import logging
from datetime import date
from typing import Any, Dict, List, Optional

from app.domain.campaign.interface.campaign_repository import (
    ICampaignDocumentsRepository,
    ICampaignRepository,
    ICampaignTeamsRepository,
)
from app.domain.campaign.models.campaign_bean import CampaignBean
from app.domain.exceptions import (
    ConflictException,
    NotFoundException,
    ValidationException,
)
from app.domain.fsec.interface.fsec_repository import IFsecRepository

logger = logging.getLogger(__name__)

# Statut par défaut appliqué lors de la création d'une campagne si aucun statut
# n'est fourni par l'appelant. Correspond à l'entrée "Brouillon" seedée par la
# migration 0003_seed_campaign_referential.
DEFAULT_CAMPAIGN_STATUS_ID = 0

# Champs autorisés pour les opérations de mise à jour partielle (PATCH)
ALLOWED_PATCH_FIELDS = {
    "name",
    "year",
    "semester",
    "type_id",
    "status_id",
    "installation_id",
    "start_date",
    "end_date",
    "dtri_number",
    "description",
}

# Types attendus par champ pour la validation PATCH
FIELD_TYPES = {
    "name": str,
    "year": int,
    "semester": str,
    "type_id": (int, type(None)),
    "status_id": (int, type(None)),
    "installation_id": (int, type(None)),
    "start_date": (date, type(None)),
    "end_date": (date, type(None)),
    "dtri_number": (int, type(None)),
    "description": (str, type(None)),
}


def _merge_partial_data(bean: CampaignBean, partial_data: Dict[str, Any]) -> None:
    """Fusionne les données partielles dans le bean existant avec validation des types."""
    for key, value in partial_data.items():
        if key not in ALLOWED_PATCH_FIELDS:
            continue
        # Valider le type si une contrainte est définie
        expected = FIELD_TYPES.get(key)
        if (
            expected is not None
            and value is not None
            and not isinstance(value, expected)
        ):
            raise ValidationException(
                key,
                f"Type invalide pour '{key}': attendu {expected}, reçu {type(value).__name__}",
            )
        if hasattr(bean, key):
            setattr(bean, key, value)


def _validate_date_range(bean: CampaignBean) -> None:
    """Valide que start_date < end_date si les deux sont définis."""
    if bean.start_date and bean.end_date and bean.start_date > bean.end_date:
        raise ValidationException(
            "start_date/end_date",
            f"La date de début ({bean.start_date}) doit être antérieure à la date de fin ({bean.end_date})",
        )


def create_campaign(
    repository: ICampaignRepository, bean: CampaignBean
) -> CampaignBean:
    """Crée une nouvelle campagne après validation."""
    _validate_date_range(bean)

    # status_id est NOT NULL en base. Si l'appelant n'en fournit pas
    # (ex: formulaire de création qui n'expose pas le champ), on applique
    # le statut par défaut "Brouillon".
    if bean.status_id is None:
        bean.status_id = DEFAULT_CAMPAIGN_STATUS_ID

    if repository.exists_by_name_year_semester(bean.name, bean.year, bean.semester):
        raise ConflictException(
            "name/year/semester", f"{bean.name}/{bean.year}/{bean.semester}"
        )
    logger.info(
        f"Creating campaign name={bean.name}, year={bean.year}, semester={bean.semester}"
    )
    result = repository.create(bean)
    logger.info(f"Created campaign uuid={result.uuid}")
    return result


def get_campaign_by_uuid(repository: ICampaignRepository, uuid: str) -> CampaignBean:
    """Récupère une campagne par son UUID."""
    bean = repository.get_by_uuid(uuid)
    if bean is None:
        raise NotFoundException("Campaign", uuid)
    return bean


def get_campaign_by_slug(repository: ICampaignRepository, slug: str) -> CampaignBean:
    """Récupère une campagne par son slug d'URL."""
    bean = repository.get_by_slug(slug)
    if bean is None:
        raise NotFoundException("Campaign", slug)
    return bean


def get_all_campaigns(
    repository: ICampaignRepository, limit: Optional[int] = None, offset: int = 0
) -> List[CampaignBean]:
    """Récupère toutes les campagnes (avec pagination optionnelle)."""
    return repository.get_all(limit=limit, offset=offset)


def count_all_campaigns(repository: ICampaignRepository) -> int:
    """Retourne le nombre total de campagnes."""
    return repository.count_all()


def update_campaign(
    repository: ICampaignRepository, bean: CampaignBean
) -> CampaignBean:
    """Met à jour une campagne (remplacement complet)."""
    # 1. Vérifie existence
    existing = repository.get_by_uuid(bean.uuid)
    if existing is None:
        raise NotFoundException("Campaign", bean.uuid)

    _validate_date_range(bean)

    # 2. Vérifie conflit doublon (SI changement de clé unique)
    has_key_changed = (
        bean.name != existing.name
        or bean.year != existing.year
        or bean.semester != existing.semester
    )

    if has_key_changed:
        if repository.exists_duplicate(bean.uuid, bean.name, bean.year, bean.semester):
            raise ConflictException(
                "name/year/semester", f"{bean.name}/{bean.year}/{bean.semester}"
            )

    logger.info(f"Updating campaign uuid={bean.uuid}")
    return repository.update(bean)


def patch_campaign(
    repository: ICampaignRepository, uuid: str, partial_data: Dict[str, Any]
) -> CampaignBean:
    """Met à jour partiellement une campagne (PATCH)."""
    existing_bean = repository.get_by_uuid(uuid)
    if existing_bean is None:
        raise NotFoundException("Campaign", uuid)

    # Sauvegarde des anciennes valeurs clés pour comparaison
    old_key = (existing_bean.name, existing_bean.year, existing_bean.semester)

    # Fusion des données (Merge) avec validation des types
    _merge_partial_data(existing_bean, partial_data)

    _validate_date_range(existing_bean)

    # Vérification conflit APRÈS fusion (uniquement si clé modifiée)
    new_key = (existing_bean.name, existing_bean.year, existing_bean.semester)
    if new_key != old_key:
        if repository.exists_duplicate(
            uuid, existing_bean.name, existing_bean.year, existing_bean.semester
        ):
            raise ConflictException(
                "name/year/semester",
                f"{existing_bean.name}/{existing_bean.year}/{existing_bean.semester}",
            )

    logger.info(f"Patching campaign uuid={uuid}, fields={list(partial_data.keys())}")
    return repository.update(existing_bean)


def delete_campaign(
    repository: ICampaignRepository,
    uuid: str,
    fsec_repository: IFsecRepository,
    teams_repository: Optional[ICampaignTeamsRepository] = None,
    documents_repository: Optional[ICampaignDocumentsRepository] = None,
) -> bool:
    """Supprime une campagne et ses données rattachées.

    Bloque si des FSEC y sont rattachés (artefacts majeurs : étapes, FA, etc.).
    En revanche les membres d'équipe et documents — dont les FK sont en PROTECT —
    sont supprimés explicitement AVANT la campagne : sans cela, le ``delete()`` de
    Django lève ``ProtectedError`` (→ 500) dès qu'une campagne a une équipe, ce qui
    est le cas courant (RCE/IEC). Les lignes de planning (FK CASCADE) partent seules.
    """
    existing = repository.get_by_uuid(uuid)
    if existing is None:
        raise NotFoundException("Campaign", uuid)
    linked_fsecs = fsec_repository.get_by_campaign_id(uuid)
    if linked_fsecs:
        raise ValidationException(
            "campaign",
            f"Impossible de supprimer : {len(linked_fsecs)} FSEC(s) rattaché(s) à cette campagne.",
        )
    # Suppression des enfants PROTECT avant la campagne (sinon ProtectedError).
    if teams_repository is not None:
        for member in teams_repository.get_by_campaign_uuid(uuid):
            teams_repository.delete(member.uuid)
    if documents_repository is not None:
        for document in documents_repository.get_by_campaign_uuid(uuid):
            documents_repository.delete(document.uuid)
    logger.info(f"Deleting campaign uuid={uuid}")
    if not repository.delete(uuid):
        raise NotFoundException("Campaign", uuid)
    logger.info(f"Deleted campaign uuid={uuid}")
    return True
