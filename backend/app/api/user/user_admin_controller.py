"""Controller d'administration des utilisateurs — reserve aux admins (chef de labo)."""

import logging

from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from app.api.user.serializers import CreateUserSerializer, UpdateUserSerializer
from app.core.password_activation import build_activation_url, issue_activation_token
from app.core.permissions import IsAdmin
from app.domain.user.services import user_service
from app.mapper.user.user_mapper import user_mapper_api_to_bean, user_mapper_bean_to_api
from app.repository.user.models.user_profile_entity import UserProfileEntity
from app.repository.user.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


def _activation_payload(request, profile: UserProfileEntity) -> dict:
    """Émet un jeton d'activation, loggue le lien, retourne le payload API.

    Le lien est loggué côté serveur (canal de secours si SMTP indisponible) et
    retourné à l'admin pour transmission hors-bande (mail/SMS/chat). Il est
    single-use + TTL 24h : beaucoup moins risqué qu'un mot de passe clair.
    """
    token = issue_activation_token(profile)
    base_url = request.build_absolute_uri("/").rstrip("/")
    url = build_activation_url(token, base_url=base_url)
    logger.info(
        "Lien d'activation émis pour %s: %s (TTL 24h, single-use)",
        profile.user.username,
        url,
    )
    return {"activation_url": url, "activation_token_ttl_hours": 24}


class UserAdminController(viewsets.ViewSet):
    """CRUD utilisateurs — acces admin uniquement."""

    lookup_field = "uuid"
    permission_classes = [IsAdmin]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repository = UserRepository()

    def get_throttles(self):
        # Durcir les endpoints qui émettent un jeton ou créent un compte
        # (anti-spam / brute-force).
        if self.action in ("create", "reset_password"):
            self.throttle_scope = "password_reset"
        return super().get_throttles()

    def list(self, request):
        """GET /api/v1/users/"""
        try:
            offset = max(0, int(request.query_params.get("offset", 0)))
            limit = min(max(1, int(request.query_params.get("limit", 50))), 100)
        except (ValueError, TypeError):
            return JsonResponse(
                {"error": "Les parametres offset et limit doivent etre des entiers"},
                status=400,
            )
        beans = user_service.list_users(self.repository, offset=offset, limit=limit)
        data = [user_mapper_bean_to_api(b) for b in beans]
        return JsonResponse(data, safe=False)

    def retrieve(self, request, uuid: str = None):
        """GET /api/v1/users/{uuid}/"""
        bean = user_service.get_user_by_uuid(self.repository, uuid)
        return JsonResponse(user_mapper_bean_to_api(bean))

    def create(self, request):
        """POST /api/v1/users/ — retourne un lien d'activation (pas de mot de passe en clair)."""
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bean = user_mapper_api_to_bean(serializer.validated_data)
        password = serializer.validated_data.get("password")
        created_bean, _ = user_service.create_user(
            self.repository,
            bean,
            password=password,
        )

        logger.info(
            "Admin %s a cree l'utilisateur %s (role=%s)",
            request.user.username,
            created_bean.username,
            created_bean.role,
        )

        profile = UserProfileEntity.objects.select_related("user").get(uuid=created_bean.uuid)
        response_data = user_mapper_bean_to_api(created_bean)
        response_data.update(_activation_payload(request, profile))
        response = JsonResponse(response_data, status=201)
        response["Cache-Control"] = "no-store"
        return response

    def update(self, request, uuid: str = None):
        """PUT /api/v1/users/{uuid}/"""
        serializer = UpdateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bean = user_mapper_api_to_bean(serializer.validated_data)
        updated_bean = user_service.update_user(self.repository, uuid, bean)

        logger.info(
            "Admin %s a modifie l'utilisateur %s",
            request.user.username,
            updated_bean.username,
        )
        return JsonResponse(user_mapper_bean_to_api(updated_bean))

    @action(detail=True, methods=["patch"], url_path="toggle")
    def toggle_active(self, request, uuid: str = None):
        """PATCH /api/v1/users/{uuid}/toggle/"""
        bean = user_service.toggle_active(self.repository, uuid)

        action_label = "active" if bean.is_active else "desactive"
        logger.info(
            "Admin %s a %s l'utilisateur %s",
            request.user.username,
            action_label,
            bean.username,
        )
        return JsonResponse(user_mapper_bean_to_api(bean))

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, uuid: str = None):
        """POST /api/v1/users/{uuid}/reset-password/ — retourne un lien d'activation."""
        target_bean = user_service.reset_password(self.repository, uuid)

        logger.info(
            "Admin %s a reinitialise le mot de passe de %s",
            request.user.username,
            target_bean.username,
        )

        profile = UserProfileEntity.objects.select_related("user").get(uuid=target_bean.uuid)
        response_data = {
            "message": "Lien d'activation émis avec succès",
            "username": target_bean.username,
        }
        response_data.update(_activation_payload(request, profile))
        response = JsonResponse(response_data)
        response["Cache-Control"] = "no-store"
        return response
