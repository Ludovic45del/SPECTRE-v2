"""Controller Campaign - API REST."""

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse, JsonResponse
from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ViewSet

from app.api.campaign.serializers import CampaignPatchSerializer, CampaignSerializer
from app.api.shared.mixins import LazyRepositoryList, PaginatedControllerMixin
from app.core.permissions import IsReadOnlyOrAdmin
from app.domain.campaign.services.campaign_service import (
    count_all_campaigns,
    create_campaign,
    delete_campaign,
    get_all_campaigns,
    get_campaign_by_uuid,
    patch_campaign,
    update_campaign,
)
from app.domain.exceptions import InvalidDataException
from app.mapper.campaign.campaign_mapper import campaign_mapper_api_to_bean, campaign_mapper_bean_to_api
from app.repository.campaign.repositories.campaign_repository import CampaignRepository
from app.repository.fsec.repositories.fsec_repository import FsecRepository


class CampaignPagination(PageNumberPagination):
    """Pagination pour les campagnes."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class CampaignController(PaginatedControllerMixin, ViewSet):
    """Controller REST pour les campagnes."""

    lookup_field = "uuid"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repository = CampaignRepository()
        self.paginator = CampaignPagination()

    def list(self, request) -> JsonResponse:
        """Liste toutes les campagnes avec pagination (GET /)."""
        source = LazyRepositoryList(
            fetch_func=lambda limit, offset: get_all_campaigns(self.repository, limit=limit, offset=offset),
            count_func=lambda: count_all_campaigns(self.repository),
        )
        return self.paginate_or_json(request, source, campaign_mapper_bean_to_api)

    def retrieve(self, request, uuid=None) -> JsonResponse:
        """Récupère une campagne par UUID (GET /:uuid/)."""
        bean = get_campaign_by_uuid(self.repository, uuid)
        return JsonResponse(campaign_mapper_bean_to_api(bean), encoder=DjangoJSONEncoder)

    def create(self, request) -> JsonResponse:
        """Crée une nouvelle campagne (POST /)."""
        data = request.data

        # Validation avec serializer
        serializer = CampaignSerializer(data=data)
        if not serializer.is_valid():
            raise InvalidDataException(str(serializer.errors))

        bean = campaign_mapper_api_to_bean(serializer.validated_data)
        result = create_campaign(self.repository, bean)
        return JsonResponse(campaign_mapper_bean_to_api(result), status=201, encoder=DjangoJSONEncoder)

    def update(self, request, uuid=None) -> JsonResponse:
        """Met à jour une campagne (PUT /:uuid/)."""
        data = request.data.copy()
        data["uuid"] = uuid

        # Validation avec serializer
        serializer = CampaignSerializer(data=data)
        if not serializer.is_valid():
            raise InvalidDataException(str(serializer.errors))

        bean = campaign_mapper_api_to_bean(serializer.validated_data)
        result = update_campaign(self.repository, bean)
        return JsonResponse(campaign_mapper_bean_to_api(result), encoder=DjangoJSONEncoder)

    def partial_update(self, request, uuid=None) -> JsonResponse:
        """Met à jour partiellement une campagne (PATCH /:uuid/)."""
        data = request.data

        # Validation partielle avec serializer
        serializer = CampaignPatchSerializer(data=data)
        if not serializer.is_valid():
            raise InvalidDataException(str(serializer.errors))

        validated = serializer.validated_data
        result = patch_campaign(self.repository, uuid, validated)
        return JsonResponse(campaign_mapper_bean_to_api(result), encoder=DjangoJSONEncoder)

    def get_permissions(self):
        """Admin-only pour la suppression."""
        if self.action == "destroy":
            return [IsReadOnlyOrAdmin()]
        return super().get_permissions()

    def destroy(self, request, uuid=None) -> HttpResponse:
        """Supprime une campagne (DELETE /:uuid/)."""
        delete_campaign(self.repository, uuid, fsec_repository=FsecRepository())
        return HttpResponse(status=204)
