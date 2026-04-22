"""Service FA - Logique métier pour les Fiches d'Anomalie."""

import logging
import re
from datetime import date
from typing import Any, Dict, List, Optional

from app.domain.campaign.interface.campaign_repository import ICampaignRepository
from app.domain.exceptions import (
    ConflictException,
    InvalidDataException,
    NotFoundException,
)
from app.domain.fa.interface.fa_repository import IFaRepository
from app.domain.fa.models.fa_bean import FaBean
from app.domain.fa.models.fa_constants import FaStatus
from app.domain.fa.models.fa_creation_context_bean import FaCreationContextBean
from app.domain.fsec.interface.fsec_repository import IFsecRepository

logger = logging.getLogger(__name__)


def generate_fa_identifier(campaign_name: str, fsec_name: str, year: int) -> str:
    """Génère l'identifiant unique de la FA.

    Format: FA_{année}_{campagne}_{fsec}
    """
    # Nettoyer les noms pour l'identifiant : remplacer espaces/tirets
    # et supprimer tout caractère spécial non alphanumérique/underscore
    clean_campaign = campaign_name.replace(" ", "_").replace("-", "_")
    clean_campaign = re.sub(r"[^A-Za-z0-9_]", "", clean_campaign)
    clean_fsec = fsec_name.replace(" ", "_").replace("-", "_")
    clean_fsec = re.sub(r"[^A-Za-z0-9_]", "", clean_fsec)
    return f"FA_{year}_{clean_campaign}_{clean_fsec}"


def create_fa(
    repository: IFaRepository,
    bean: FaBean,
    campaign_name: str,
    fsec_name: str,
    year: int,
) -> FaBean:
    """Crée une nouvelle FA après validation.

    Args:
        repository: Le repository FA
        bean: Le bean FA à créer
        campaign_name: Nom de la campagne (pour générer l'identifiant)
        fsec_name: Nom de la FSEC (pour générer l'identifiant)
        year: Année de la campagne (pour générer l'identifiant)

    Returns:
        Le bean FA créé

    Raises:
        ConflictException: Si une FA existe déjà pour cette FSEC
    """
    # Vérifier qu'il n'y a pas déjà une FA pour cette FSEC
    if repository.exists_by_fsec_version_id(bean.fsec_version_id):
        raise ConflictException("fsec_version_id", bean.fsec_version_id)

    # Générer l'identifiant automatiquement
    bean.identifier = generate_fa_identifier(campaign_name, fsec_name, year)

    # Vérifier que l'identifiant est unique
    if repository.exists_by_identifier(bean.identifier):
        raise ConflictException("identifier", bean.identifier)

    bean.status_id = FaStatus.OPEN

    result = repository.create(bean)
    logger.info("FA créée: %s (fsec=%s)", result.identifier, result.fsec_version_id)
    return result


def resolve_fa_creation_context(
    bean: FaBean,
    fsec_repository: IFsecRepository,
    campaign_repository: ICampaignRepository,
) -> FaCreationContextBean:
    """Résout le contexte nécessaire à la création d'une FA.

    Récupère la FSEC et la campagne associée pour déduire campaign_name, fsec_name et year.

    Args:
        bean: Le bean FA (doit contenir fsec_version_id)
        fsec_repository: Repository FSEC (interface IFsecRepository)
        campaign_repository: Repository Campaign (interface ICampaignRepository)

    Returns:
        FaCreationContextBean avec campaign_name, fsec_name, year

    Raises:
        InvalidDataException: Si fsec_version_id est manquant
        NotFoundException: Si la FSEC n'existe pas
    """
    if not bean.fsec_version_id:
        raise InvalidDataException("fsec_version_id est obligatoire pour la création")

    fsec = fsec_repository.get_by_version_uuid(bean.fsec_version_id)
    if fsec is None:
        raise NotFoundException("FSEC", bean.fsec_version_id)

    campaign_name = "Unknown"
    year = date.today().year
    if fsec.campaign_id:
        campaign = campaign_repository.get_by_uuid(fsec.campaign_id)
        if campaign:
            campaign_name = campaign.name
            year = campaign.year

    context = FaCreationContextBean(
        campaign_name=campaign_name,
        fsec_name=fsec.name,
        year=year,
    )
    logger.info(
        "Contexte FA résolu: campagne=%s, fsec=%s, année=%d",
        campaign_name,
        fsec.name,
        year,
    )
    return context


def get_fa_by_uuid(repository: IFaRepository, uuid: str) -> FaBean:
    """Récupère une FA par son UUID."""
    bean = repository.get_by_uuid(uuid)
    if bean is None:
        raise NotFoundException("FA", uuid)
    return bean


def get_all_fas(
    repository: IFaRepository, limit: Optional[int] = None, offset: int = 0
) -> List[FaBean]:
    """Récupère toutes les FA."""
    return repository.get_all(limit=limit, offset=offset)


def count_all_fas(repository: IFaRepository) -> int:
    """Retourne le nombre total de FA."""
    return repository.count_all()


def get_fa_by_fsec_version_id(
    repository: IFaRepository, fsec_version_id: str
) -> FaBean:
    """Récupère la FA associée à une FSEC."""
    bean = repository.get_by_fsec_version_id(fsec_version_id)
    if bean is None:
        raise NotFoundException("FA for FSEC", fsec_version_id)
    return bean


_PROTECTED_MERGE_FIELDS = {
    "uuid",
    "fsec_version_id",
    "identifier",
    "status_id",
    "iec_validation_open",
    "iec_validation_open_date",
    "iec_validation_open_name",
    "iec_validation_progress",
    "iec_validation_progress_date",
    "iec_validation_progress_name",
    "closure_validation",
    "closure_date",
    "closure_validator_name",
    "created_at",
    "last_updated",
    "is_active",
}


def _merge_fa_beans(existing: FaBean, updated: FaBean) -> FaBean:
    """Fusionne un bean mis à jour avec les données existantes.

    Les champs non-None du bean updated écrasent les champs existants.
    Les champs protégés (workflow/IEC/statut/metadata) conservent les valeurs existantes.
    Le statut ne peut être changé que via validate_open_phase, validate_progress_phase, close_fa.
    Les champs de clôture sont modifiables si la FA est déjà clôturée.
    """
    from dataclasses import fields

    protected = set(_PROTECTED_MERGE_FIELDS)
    # Permettre la modification des champs de clôture si la FA est déjà fermée
    if existing.status_id == FaStatus.CLOSED:
        protected -= {"closure_validation", "closure_date", "closure_validator_name"}

    merged_kwargs = {}
    for field in fields(existing):
        name = field.name
        if name in protected:
            merged_kwargs[name] = getattr(existing, name)
        else:
            updated_val = getattr(updated, name)
            merged_kwargs[name] = (
                updated_val if updated_val is not None else getattr(existing, name)
            )
    return FaBean(**merged_kwargs)


def update_fa(repository: IFaRepository, bean: FaBean) -> FaBean:
    """Met à jour une FA avec merge des données existantes.

    Seuls les champs fournis (non vides) sont mis à jour.
    Les champs vides/None conservent leur valeur existante.
    """
    existing = repository.get_by_uuid(bean.uuid)
    if existing is None:
        raise NotFoundException("FA", bean.uuid)

    merged = _merge_fa_beans(existing, bean)
    return repository.update(merged)


def delete_fa(repository: IFaRepository, uuid: str) -> bool:
    """Supprime une FA (soft-delete)."""
    if not repository.delete(uuid):
        raise NotFoundException("FA", uuid)
    logger.info("FA supprimée (soft-delete): %s", uuid)
    return True


def patch_fa(
    repository: IFaRepository, uuid: str, partial_data: Dict[str, Any]
) -> FaBean:
    """Met à jour partiellement une FA (PATCH).

    Args:
        repository: Le repository FA
        uuid: UUID de la FA
        partial_data: Dictionnaire des champs à mettre à jour

    Returns:
        Le bean FA mis à jour

    Raises:
        NotFoundException: Si la FA n'existe pas
    """
    existing = repository.get_by_uuid(uuid)
    if existing is None:
        raise NotFoundException("FA", uuid)

    # Champs protégés qui ne peuvent pas être modifiés via PATCH
    # On réutilise la constante globale pour éviter le drift de configuration
    protected_fields = set(_PROTECTED_MERGE_FIELDS)
    
    # Dans un contexte PATCH, si on souhaite autoriser la modification du statut 
    # de façon isolée (hors workflow standard strict), on peut l'enlever ici.
    protected_fields.discard("status_id")

    # Permettre la modification des champs de clôture si la FA est déjà fermée
    if existing.status_id == FaStatus.CLOSED:
        protected_fields -= {
            "closure_validation",
            "closure_date",
            "closure_validator_name",
        }

    new_status = partial_data.get("status_id")
    if (
        "status_id" in partial_data
        and new_status is not None
        and new_status != existing.status_id
    ):
        logger.info(
            "FA %s: status_id modifié via PATCH (bypass workflow strict) %s -> %s",
            uuid,
            existing.status_id,
            new_status,
            extra={
                "action": "fa_status_bypass",
                "entity_type": "FA",
                "entity_id": uuid,
                "extra_data": {
                    "from_status": existing.status_id,
                    "to_status": new_status,
                },
            },
        )

    # Fusion des données (seuls les champs fournis sont mis à jour)
    for key, value in partial_data.items():
        if key in protected_fields:
            continue  # Ignorer les champs protégés
        # Empêcher la mise à null de status_id (NOT NULL en base)
        if key == "status_id" and value is None:
            continue
        if hasattr(existing, key):
            setattr(existing, key, value)

    logger.info("FA %s: patch appliqué (%d champs)", uuid, len(partial_data))
    return repository.update(existing)


def validate_open_phase(
    repository: IFaRepository,
    uuid: str,
    validator_name: str,
    validation_date: Optional[date] = None,
) -> FaBean:
    """Valide la phase Ouvert et passe à En cours.

    Args:
        repository: Le repository FA
        uuid: UUID de la FA
        validator_name: Nom du valideur IEC
        validation_date: Date de validation (défaut: aujourd'hui)

    Returns:
        Le bean FA mis à jour

    Raises:
        NotFoundException: Si la FA n'existe pas
        ConflictException: Si la FA n'est pas au statut Ouvert
    """
    if validation_date is None:
        validation_date = date.today()

    bean = repository.get_by_uuid(uuid)
    if bean is None:
        raise NotFoundException("FA", uuid)

    if bean.status_id != FaStatus.OPEN:
        raise ConflictException(
            "status",
            f"La FA doit être au statut 'Ouvert' pour être validée. Statut actuel : {bean.status_id}",
        )

    # Vérifier la cohérence chronologique
    if bean.event_date and validation_date < bean.event_date:
        raise InvalidDataException(
            f"La date de validation ({validation_date}) ne peut pas être antérieure "
            f"à la date de l'évènement ({bean.event_date})"
        )

    bean.iec_validation_open = True
    bean.iec_validation_open_date = validation_date
    bean.iec_validation_open_name = validator_name
    bean.status_id = FaStatus.IN_PROGRESS

    logger.info("FA %s: validation phase Ouvert par %s", uuid, validator_name)
    return repository.update(bean)


def validate_progress_phase(
    repository: IFaRepository,
    uuid: str,
    validator_name: str,
    validation_date: Optional[date] = None,
) -> FaBean:
    """Valide la phase En cours et passe à Clos.

    Args:
        repository: Le repository FA
        uuid: UUID de la FA
        validator_name: Nom du valideur IEC
        validation_date: Date de validation (défaut: aujourd'hui)

    Returns:
        Le bean FA mis à jour

    Raises:
        NotFoundException: Si la FA n'existe pas
        ConflictException: Si la FA n'est pas au statut En cours
    """
    if validation_date is None:
        validation_date = date.today()

    bean = repository.get_by_uuid(uuid)
    if bean is None:
        raise NotFoundException("FA", uuid)

    if bean.status_id != FaStatus.IN_PROGRESS:
        raise ConflictException(
            "status",
            f"La FA doit être au statut 'En cours' pour être validée. Statut actuel : {bean.status_id}",
        )

    # Vérifier la cohérence chronologique avec la validation de la phase Ouvert
    if (
        bean.iec_validation_open_date
        and validation_date < bean.iec_validation_open_date
    ):
        raise InvalidDataException(
            f"La date de validation 'En cours' ({validation_date}) ne peut pas être antérieure "
            f"à la date de validation 'Ouvert' ({bean.iec_validation_open_date})"
        )

    bean.iec_validation_progress = True
    bean.iec_validation_progress_date = validation_date
    bean.iec_validation_progress_name = validator_name

    logger.info("FA %s: validation phase En cours par %s", uuid, validator_name)
    return repository.update(bean)


def close_fa(
    repository: IFaRepository,
    uuid: str,
    validator_name: str,
    closure_validation: str,
    closure_date: Optional[date] = None,
) -> FaBean:
    """Ferme définitivement une FA.

    Requiert que la phase En cours ait été validée par l'IEC (validate_progress_phase).

    Args:
        repository: Le repository FA
        uuid: UUID de la FA
        validator_name: Nom du valideur (Chef labo + IEC)
        closure_validation: Texte de validation de fermeture
        closure_date: Date de fermeture (défaut: aujourd'hui)

    Returns:
        Le bean FA mis à jour

    Raises:
        NotFoundException: Si la FA n'existe pas
        ConflictException: Si la FA n'est pas au statut En cours ou si la validation IEC n'a pas été faite
    """
    if closure_date is None:
        closure_date = date.today()

    bean = repository.get_by_uuid(uuid)
    if bean is None:
        raise NotFoundException("FA", uuid)

    if bean.status_id != FaStatus.IN_PROGRESS:
        raise ConflictException(
            "status",
            f"La FA doit être au statut 'En cours' pour être fermée. Statut actuel : {bean.status_id}",
        )

    if not bean.iec_validation_progress:
        raise ConflictException(
            "iec_validation_progress",
            "La validation IEC de la phase 'En cours' est requise avant la fermeture",
        )

    # Vérifier la cohérence chronologique avec la validation de la phase En cours
    if (
        bean.iec_validation_progress_date
        and closure_date < bean.iec_validation_progress_date
    ):
        raise InvalidDataException(
            f"La date de fermeture ({closure_date}) ne peut pas être antérieure "
            f"à la date de validation 'En cours' ({bean.iec_validation_progress_date})"
        )

    bean.closure_validation = closure_validation
    bean.closure_date = closure_date
    bean.closure_validator_name = validator_name
    bean.status_id = FaStatus.CLOSED

    logger.info("FA %s: fermeture par %s", uuid, validator_name)
    return repository.update(bean)
