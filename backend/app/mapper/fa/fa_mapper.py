"""Mapper FA - Conversion Entity ↔ Bean ↔ API."""

from typing import Any, Dict, List

from app.domain.fa.models.fa_bean import FaBean
from app.mapper.type_conversion import parse_date_string
from app.repository.fa.models.fa_entity import FaEntity


def fa_mapper_entity_to_bean(entity: FaEntity) -> FaBean:
    """Convertit une FaEntity en FaBean."""
    return FaBean(
        uuid=str(entity.uuid),
        fsec_version_id=(
            str(entity.fsec_version_id_id) if entity.fsec_version_id_id else ""
        ),
        status_id=entity.status_id_id if entity.status_id_id is not None else None,
        type_id=entity.type_id_id if entity.type_id_id is not None else None,
        criticality_id=(
            entity.criticality_id_id if entity.criticality_id_id is not None else None
        ),
        identifier=entity.identifier,
        # Phase Ouvert
        fsec_step_id=entity.fsec_step_id,
        fsec_step_other=entity.fsec_step_other,
        discoverer=entity.discoverer,
        event_date=entity.event_date,
        observation=entity.observation,
        location_equipment=entity.location_equipment,
        quick_analysis=entity.quick_analysis,
        immediate_measures=entity.immediate_measures,
        iec_validation_open=entity.iec_validation_open,
        iec_validation_open_date=entity.iec_validation_open_date,
        iec_validation_open_name=entity.iec_validation_open_name,
        # Phase En cours
        cause=entity.cause,
        experience_impact=entity.experience_impact,
        iec_validation_progress=entity.iec_validation_progress,
        iec_validation_progress_date=entity.iec_validation_progress_date,
        iec_validation_progress_name=entity.iec_validation_progress_name,
        # Phase Clos
        closure_validation=entity.closure_validation,
        closure_date=entity.closure_date,
        closure_validator_name=entity.closure_validator_name,
        # Soft delete
        is_active=entity.is_active,
        # Metadata
        created_at=entity.created_at,
        last_updated=entity.last_updated,
    )


def fa_mapper_bean_to_entity(bean: FaBean) -> FaEntity:
    """Convertit un FaBean en FaEntity."""
    entity = FaEntity()
    if bean.uuid:
        entity.uuid = bean.uuid
    entity.fsec_version_id_id = bean.fsec_version_id
    entity.status_id_id = bean.status_id
    entity.type_id_id = bean.type_id
    entity.criticality_id_id = bean.criticality_id
    entity.identifier = bean.identifier
    # Phase Ouvert
    entity.fsec_step_id = bean.fsec_step_id
    entity.fsec_step_other = bean.fsec_step_other
    entity.discoverer = bean.discoverer
    entity.event_date = bean.event_date
    entity.observation = bean.observation
    entity.location_equipment = bean.location_equipment
    entity.quick_analysis = bean.quick_analysis
    entity.immediate_measures = bean.immediate_measures
    entity.iec_validation_open = bean.iec_validation_open
    entity.iec_validation_open_date = bean.iec_validation_open_date
    entity.iec_validation_open_name = bean.iec_validation_open_name
    # Phase En cours
    entity.cause = bean.cause
    entity.experience_impact = bean.experience_impact
    entity.iec_validation_progress = bean.iec_validation_progress
    entity.iec_validation_progress_date = bean.iec_validation_progress_date
    entity.iec_validation_progress_name = bean.iec_validation_progress_name
    # Phase Clos
    entity.closure_validation = bean.closure_validation
    entity.closure_date = bean.closure_date
    entity.closure_validator_name = bean.closure_validator_name
    entity.is_active = bean.is_active
    return entity


def fa_mapper_api_to_bean(data: Dict[str, Any]) -> FaBean:
    """Convertit des données API en FaBean."""
    return FaBean(
        uuid=data.get("uuid", ""),
        fsec_version_id=data.get("fsec_version_id", ""),
        status_id=data.get("status_id"),
        type_id=data.get("type_id"),
        criticality_id=data.get("criticality_id"),
        identifier=data.get("identifier", ""),
        # Phase Ouvert
        fsec_step_id=data.get("fsec_step_id"),
        fsec_step_other=data.get("fsec_step_other"),
        discoverer=data.get("discoverer", ""),
        event_date=parse_date_string(data.get("event_date")),
        observation=data.get("observation", ""),
        location_equipment=data.get("location_equipment"),
        quick_analysis=data.get("quick_analysis", ""),
        immediate_measures=data.get("immediate_measures"),
        iec_validation_open=data.get("iec_validation_open", False),
        iec_validation_open_date=parse_date_string(
            data.get("iec_validation_open_date")
        ),
        iec_validation_open_name=data.get("iec_validation_open_name"),
        # Phase En cours
        cause=data.get("cause"),
        experience_impact=data.get("experience_impact"),
        iec_validation_progress=data.get("iec_validation_progress", False),
        iec_validation_progress_date=parse_date_string(
            data.get("iec_validation_progress_date")
        ),
        iec_validation_progress_name=data.get("iec_validation_progress_name"),
        # Phase Clos
        closure_validation=data.get("closure_validation"),
        closure_date=parse_date_string(data.get("closure_date")),
        closure_validator_name=data.get("closure_validator_name"),
    )


def fa_mapper_bean_to_api(bean: FaBean) -> Dict[str, Any]:
    """Convertit un FaBean en données API."""
    return {
        "uuid": bean.uuid,
        "fsec_version_id": bean.fsec_version_id,
        "status_id": bean.status_id,
        "type_id": bean.type_id,
        "criticality_id": bean.criticality_id,
        "identifier": bean.identifier,
        # Phase Ouvert
        "fsec_step_id": bean.fsec_step_id,
        "fsec_step_other": bean.fsec_step_other,
        "discoverer": bean.discoverer,
        "event_date": bean.event_date.isoformat() if bean.event_date else None,
        "observation": bean.observation,
        "location_equipment": bean.location_equipment,
        "quick_analysis": bean.quick_analysis,
        "immediate_measures": bean.immediate_measures,
        "iec_validation_open": bean.iec_validation_open,
        "iec_validation_open_date": (
            bean.iec_validation_open_date.isoformat()
            if bean.iec_validation_open_date
            else None
        ),
        "iec_validation_open_name": bean.iec_validation_open_name,
        # Phase En cours
        "cause": bean.cause,
        "experience_impact": bean.experience_impact,
        "iec_validation_progress": bean.iec_validation_progress,
        "iec_validation_progress_date": (
            bean.iec_validation_progress_date.isoformat()
            if bean.iec_validation_progress_date
            else None
        ),
        "iec_validation_progress_name": bean.iec_validation_progress_name,
        # Phase Clos
        "closure_validation": bean.closure_validation,
        "closure_date": bean.closure_date.isoformat() if bean.closure_date else None,
        "closure_validator_name": bean.closure_validator_name,
        # Metadata
        "created_at": bean.created_at.isoformat() if bean.created_at else None,
        "last_updated": bean.last_updated.isoformat() if bean.last_updated else None,
    }


def fa_mapper_beans_to_api(beans: List[FaBean]) -> List[Dict[str, Any]]:
    """Convertit une liste de FaBeans en liste de données API."""
    return [fa_mapper_bean_to_api(bean) for bean in beans]
