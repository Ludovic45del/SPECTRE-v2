"""Implementation du repository utilisateur (Django ORM)."""

import logging

from django.contrib.auth.models import Group, User
from django.db import transaction

from app.domain.user.interface.user_repository import IUserRepository
from app.domain.user.models.dashboard_preferences_bean import DashboardPreferencesBean
from app.domain.user.models.user_bean import ROLE_TO_PERMISSION_GROUP, UserBean
from app.mapper.user.dashboard_preferences_mapper import (
    dashboard_preferences_bean_to_dict,
    dashboard_preferences_dict_to_bean,
)
from app.mapper.user.user_mapper import user_mapper_entity_to_bean
from app.repository.user.models.user_profile_entity import UserProfileEntity

logger = logging.getLogger(__name__)


class UserRepository(IUserRepository):
    SELECT_RELATED = ("user",)

    def _base_queryset(self):
        return UserProfileEntity.objects.select_related(*self.SELECT_RELATED)

    @transaction.atomic
    def create(self, bean: UserBean, password: str) -> UserBean:
        user = User.objects.create_user(
            username=bean.username,
            password=password,
            first_name=bean.first_name or "",
            last_name=bean.last_name or "",
            is_active=True,
        )
        profile = UserProfileEntity.objects.create(
            user=user,
            role=bean.role,
            laboratoire=bean.laboratoire or "",
            service=bean.service or "",
            numero=bean.numero or "",
            bureau=bean.bureau or "",
            force_password_change=True,
        )
        group_name = ROLE_TO_PERMISSION_GROUP.get(bean.role)
        if group_name:
            group = Group.objects.get(name=group_name)
            user.groups.set([group])

        logger.debug(
            "Utilisateur cree: %s (role=%s, groupe=%s)",
            user.username,
            bean.role,
            group_name,
        )
        return user_mapper_entity_to_bean(user, profile)

    def get_by_uuid(self, uuid):
        try:
            profile = self._base_queryset().get(uuid=uuid)
            return user_mapper_entity_to_bean(profile.user, profile)
        except UserProfileEntity.DoesNotExist:
            return None

    def get_all(
        self,
        offset: int = 0,
        limit: int = 50,
        roles=None,
        is_active=None,
    ):
        qs = self._base_queryset()
        if roles:
            qs = qs.filter(role__in=roles)
        if is_active is not None:
            qs = qs.filter(user__is_active=is_active)
        profiles = qs.order_by("user__last_name", "user__first_name")[
            offset : offset + limit
        ]
        return [user_mapper_entity_to_bean(p.user, p) for p in profiles]

    @transaction.atomic
    def update(self, bean: UserBean) -> UserBean:
        profile = self._base_queryset().get(uuid=bean.uuid)
        user = profile.user
        user.first_name = bean.first_name or ""
        user.last_name = bean.last_name or ""
        user.save(update_fields=["first_name", "last_name"])

        old_role = profile.role
        profile.role = bean.role
        profile.laboratoire = (
            bean.laboratoire if bean.laboratoire is not None else profile.laboratoire
        )
        profile.service = bean.service if bean.service is not None else profile.service
        profile.numero = bean.numero if bean.numero is not None else profile.numero
        profile.bureau = bean.bureau if bean.bureau is not None else profile.bureau
        profile.save(
            update_fields=["role", "laboratoire", "service", "numero", "bureau"]
        )

        if old_role != bean.role:
            group_name = ROLE_TO_PERMISSION_GROUP.get(bean.role)
            if group_name:
                group = Group.objects.get(name=group_name)
                user.groups.set([group])
            logger.debug(
                "Role modifie pour %s: %s -> %s",
                user.username,
                old_role,
                bean.role,
            )

        return user_mapper_entity_to_bean(user, profile)

    @transaction.atomic
    def set_password(self, uuid, new_password: str) -> None:
        profile = self._base_queryset().get(uuid=uuid)
        profile.user.set_password(new_password)
        profile.user.save(update_fields=["password"])

    def check_password(self, uuid, password: str) -> bool:
        profile = self._base_queryset().get(uuid=uuid)
        return profile.user.check_password(password)

    @transaction.atomic
    def set_force_password_change(self, uuid, value: bool) -> None:
        UserProfileEntity.objects.filter(uuid=uuid).update(force_password_change=value)

    @transaction.atomic
    def reset_password(self, uuid, new_password: str) -> None:
        profile = self._base_queryset().get(uuid=uuid)
        profile.user.set_password(new_password)
        profile.user.save(update_fields=["password"])
        profile.force_password_change = True
        profile.save(update_fields=["force_password_change"])

    @transaction.atomic
    def toggle_active(self, uuid):
        profile = self._base_queryset().get(uuid=uuid)
        user = profile.user
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        logger.debug(
            "Utilisateur %s: is_active=%s",
            user.username,
            user.is_active,
        )
        return user_mapper_entity_to_bean(user, profile)

    def exists_by_username(self, username: str) -> bool:
        return User.objects.filter(username=username).exists()

    def get_dashboard_preferences(self, uuid) -> DashboardPreferencesBean:
        profile = self._base_queryset().get(uuid=uuid)
        data = profile.dashboard_preferences or {}
        return dashboard_preferences_dict_to_bean(data)

    @transaction.atomic
    def update_dashboard_preferences(
        self, uuid, preferences: DashboardPreferencesBean
    ) -> DashboardPreferencesBean:
        UserProfileEntity.objects.filter(uuid=uuid).update(
            dashboard_preferences=dashboard_preferences_bean_to_dict(preferences)
        )
        return preferences
