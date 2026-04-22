"""Controller profil courant — tout utilisateur authentifie."""

import logging

from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from app.domain.user.services import user_service
from app.mapper.user.user_mapper import user_mapper_bean_to_api
from app.repository.user.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


class MeController(viewsets.ViewSet):
    """Profil de l'utilisateur connecte."""

    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repository = UserRepository()

    def list(self, request):
        """GET /api/v1/auth/me/"""
        profile = request.user.profile
        bean = user_service.get_user_by_uuid(self.repository, profile.uuid)
        return JsonResponse(user_mapper_bean_to_api(bean))
