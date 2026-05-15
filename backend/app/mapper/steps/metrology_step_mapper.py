"""Mapper MetrologyStep - Conversion Entity ↔ Bean ↔ API."""

from typing import Any, Dict

from app.domain.steps.models.metrology_step_bean import MetrologyStepBean
from app.mapper.type_conversion import format_date_for_api, parse_date_string
from app.repository.steps.models.metrology_step_entity import MetrologyStepEntity


def _metrologist_user_uuid(entity: MetrologyStepEntity):
    raw = getattr(entity, "metrologist_user_id", None)
    return str(raw) if raw else None


def metrology_step_mapper_entity_to_bean(
    entity: MetrologyStepEntity,
) -> MetrologyStepBean:
    """Convertit une MetrologyStepEntity en MetrologyStepBean."""
    return MetrologyStepBean(
        uuid=str(entity.uuid),
        fsec_version_id=(
            str(entity.fsec_version_id_id) if entity.fsec_version_id_id else ""
        ),
        rack_id=entity.rack_id_id if entity.rack_id_id is not None else None,
        metrologist_name=entity.metrologist_name,
        metrologist_user_uuid=_metrologist_user_uuid(entity),
        date=entity.date,
        comments=entity.comments,
        machine_uuids=[str(machine.uuid) for machine in entity.machines.all()],
    )


def metrology_step_mapper_bean_to_entity(
    bean: MetrologyStepBean,
) -> MetrologyStepEntity:
    """Convertit un MetrologyStepBean en MetrologyStepEntity."""
    entity = MetrologyStepEntity()
    if bean.uuid:
        entity.uuid = bean.uuid
    entity.fsec_version_id_id = bean.fsec_version_id
    entity.rack_id_id = bean.rack_id
    entity.metrologist_name = bean.metrologist_name
    entity.metrologist_user_id = bean.metrologist_user_uuid
    entity.date = bean.date
    entity.comments = bean.comments
    return entity


def metrology_step_mapper_api_to_bean(data: Dict[str, Any]) -> MetrologyStepBean:
    """Convertit des données API en MetrologyStepBean."""
    user_uuid = data.get("metrologist_user_uuid")
    return MetrologyStepBean(
        uuid=data.get("uuid", ""),
        fsec_version_id=data.get("fsec_version_id", ""),
        rack_id=data.get("rack_id"),
        metrologist_name=data.get("metrologist_name"),
        metrologist_user_uuid=str(user_uuid) if user_uuid else None,
        date=parse_date_string(data.get("date")),
        comments=data.get("comments"),
        machine_uuids=[str(uuid) for uuid in data.get("machine_uuids") or []],
    )


def metrology_step_mapper_bean_to_api(bean: MetrologyStepBean) -> Dict[str, Any]:
    """Convertit un MetrologyStepBean en données API."""
    return {
        "uuid": bean.uuid,
        "fsec_version_id": bean.fsec_version_id,
        "rack_id": bean.rack_id,
        "metrologist_name": bean.metrologist_name,
        "metrologist_user_uuid": bean.metrologist_user_uuid,
        "date": format_date_for_api(bean.date),
        "comments": bean.comments,
        "machine_uuids": list(bean.machine_uuids),
    }
