"""Mapper PicturesStep - Conversion Entity ↔ Bean ↔ API."""

from typing import Any, Dict

from app.domain.steps.models.pictures_step_bean import PicturesStepBean
from app.mapper.type_conversion import format_date_for_api, parse_date_string
from app.repository.steps.models.pictures_step_entity import PicturesStepEntity


def pictures_step_mapper_entity_to_bean(entity: PicturesStepEntity) -> PicturesStepBean:
    """Convertit une PicturesStepEntity en PicturesStepBean."""
    return PicturesStepBean(
        uuid=str(entity.uuid),
        fsec_version_id=(
            str(entity.fsec_version_id_id) if entity.fsec_version_id_id else ""
        ),
        operator=entity.operator,
        date=entity.date,
        comments=entity.comments,
    )


def pictures_step_mapper_bean_to_entity(bean: PicturesStepBean) -> PicturesStepEntity:
    """Convertit un PicturesStepBean en PicturesStepEntity."""
    entity = PicturesStepEntity()
    if bean.uuid:
        entity.uuid = bean.uuid
    entity.fsec_version_id_id = bean.fsec_version_id
    entity.operator = bean.operator
    entity.date = bean.date
    entity.comments = bean.comments
    return entity


def pictures_step_mapper_api_to_bean(data: Dict[str, Any]) -> PicturesStepBean:
    """Convertit des données API en PicturesStepBean."""
    return PicturesStepBean(
        uuid=data.get("uuid", ""),
        fsec_version_id=data.get("fsec_version_id", ""),
        operator=data.get("operator"),
        date=parse_date_string(data.get("date")),
        comments=data.get("comments"),
    )


def pictures_step_mapper_bean_to_api(bean: PicturesStepBean) -> Dict[str, Any]:
    """Convertit un PicturesStepBean en données API."""
    return {
        "uuid": bean.uuid,
        "fsec_version_id": bean.fsec_version_id,
        "operator": bean.operator,
        "date": format_date_for_api(bean.date),
        "comments": bean.comments,
    }
