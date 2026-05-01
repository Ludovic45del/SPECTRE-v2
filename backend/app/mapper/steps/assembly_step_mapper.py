"""Mapper AssemblyStep - Conversion Entity ↔ Bean ↔ API."""

from typing import Any, Dict

from app.domain.steps.models.assembly_step_bean import AssemblyStepBean
from app.mapper.steps.base_step_mapper import (
    normalize_user_uuid,
    read_operator_user_uuid,
)
from app.mapper.type_conversion import format_date_for_api
from app.repository.steps.models.assembly_step_entity import AssemblyStepEntity


def assembly_step_mapper_entity_to_bean(entity: AssemblyStepEntity) -> AssemblyStepBean:
    """Convertit une AssemblyStepEntity en AssemblyStepBean."""
    return AssemblyStepBean(
        uuid=str(entity.uuid),
        fsec_version_id=(
            str(entity.fsec_version_id_id) if entity.fsec_version_id_id else ""
        ),
        operator=entity.operator,
        operator_user_uuid=read_operator_user_uuid(entity),
        start_date=entity.start_date,
        end_date=entity.end_date,
        comments=entity.comments,
        assembly_bench_ids=[bench.id for bench in entity.assembly_bench.all()],
    )


def assembly_step_mapper_bean_to_entity(bean: AssemblyStepBean) -> AssemblyStepEntity:
    """Convertit un AssemblyStepBean en AssemblyStepEntity."""
    entity = AssemblyStepEntity()
    if bean.uuid:
        entity.uuid = bean.uuid
    entity.fsec_version_id_id = bean.fsec_version_id
    entity.operator = bean.operator
    entity.operator_user_id = bean.operator_user_uuid
    entity.start_date = bean.start_date
    entity.end_date = bean.end_date
    entity.comments = bean.comments
    return entity


def assembly_step_mapper_api_to_bean(data: Dict[str, Any]) -> AssemblyStepBean:
    """Convertit des données API en AssemblyStepBean."""
    return AssemblyStepBean(
        uuid=data.get("uuid", ""),
        fsec_version_id=data.get("fsec_version_id", ""),
        operator=data.get("operator"),
        operator_user_uuid=normalize_user_uuid(data.get("operator_user_uuid")),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        comments=data.get("comments"),
        assembly_bench_ids=data.get("assembly_bench_ids", []),
    )


def assembly_step_mapper_bean_to_api(bean: AssemblyStepBean) -> Dict[str, Any]:
    """Convertit un AssemblyStepBean en données API."""
    return {
        "uuid": bean.uuid,
        "fsec_version_id": bean.fsec_version_id,
        "operator": bean.operator,
        "operator_user_uuid": bean.operator_user_uuid,
        "start_date": format_date_for_api(bean.start_date),
        "end_date": format_date_for_api(bean.end_date),
        "comments": bean.comments,
        "assembly_bench_ids": bean.assembly_bench_ids,
    }
