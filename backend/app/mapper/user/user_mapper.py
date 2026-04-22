"""Mapper utilisateur — conversion entre Entity, Bean et API."""

from django.contrib.auth.models import User

from app.domain.user.models.user_bean import ROLE_TO_PERMISSION_GROUP, UserBean
from app.repository.user.models.user_profile_entity import UserProfileEntity


def user_mapper_entity_to_bean(user: User, profile: UserProfileEntity) -> UserBean:
    """Convertit User Django + UserProfileEntity -> UserBean."""
    return UserBean(
        uuid=profile.uuid,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        role=profile.role,
        permission_group=ROLE_TO_PERMISSION_GROUP.get(profile.role),
        laboratoire=profile.laboratoire,
        service=profile.service,
        numero=profile.numero,
        bureau=profile.bureau,
        is_active=user.is_active,
        force_password_change=profile.force_password_change,
        dashboard_preferences=profile.dashboard_preferences or {},
        last_login=user.last_login,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


def user_mapper_api_to_bean(data: dict) -> UserBean:
    """Convertit les donnees validees par le serializer -> UserBean."""
    return UserBean(
        username=data.get("username"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        role=data.get("role"),
        laboratoire=data.get("laboratoire"),
        service=data.get("service"),
        numero=data.get("numero"),
        bureau=data.get("bureau"),
    )


def user_mapper_bean_to_api(bean: UserBean) -> dict:
    """Convertit UserBean -> dict de reponse API."""
    return {
        "uuid": str(bean.uuid),
        "username": bean.username,
        "first_name": bean.first_name,
        "last_name": bean.last_name,
        "role": bean.role,
        "permission_group": bean.permission_group,
        "laboratoire": bean.laboratoire or "",
        "service": bean.service or "",
        "numero": bean.numero or "",
        "bureau": bean.bureau or "",
        "is_active": bean.is_active,
        "force_password_change": bean.force_password_change,
        "dashboard_preferences": bean.dashboard_preferences or {},
        "last_login": bean.last_login.isoformat() if bean.last_login else None,
        "created_at": bean.created_at.isoformat() if bean.created_at else None,
        "updated_at": bean.updated_at.isoformat() if bean.updated_at else None,
    }
