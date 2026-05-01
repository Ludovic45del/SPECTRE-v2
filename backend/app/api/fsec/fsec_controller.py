"""Controller FSEC - API REST."""

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ViewSet

from app.api.fsec.serializers import FsecCreateVersionSerializer, FsecSerializer
from app.api.shared.mixins import LazyRepositoryList, PaginatedControllerMixin
from app.core.permissions import IsReadOnlyOrAdmin
from app.domain.exceptions import InvalidDataException
from app.domain.fsec.services.fsec_service import (
    count_all_fsecs,
    create_fsec,
    create_new_version,
    delete_fsec,
    get_active_fsec,
    get_all_active_fsecs,
    get_all_fsecs,
    get_fsec_by_version_uuid,
    get_fsec_versions,
    get_fsecs_by_campaign,
    update_fsec,
)
from app.mapper.fsec.fsec_mapper import fsec_mapper_api_to_bean, fsec_mapper_bean_to_api
from app.repository.fsec.repositories.fsec_repository import FsecRepository
from app.repository.stock.repositories.fsec_assembly_item_repository import FsecAssemblyItemRepository
from app.repository.stock.repositories.stock_catalog_repository import StockCatalogRepository


class FsecPagination(PageNumberPagination):
    """Pagination pour les FSECs."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class FsecController(PaginatedControllerMixin, ViewSet):
    """Controller REST pour les FSECs."""

    lookup_field = "version_uuid"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repository = FsecRepository()
        self.paginator = FsecPagination()
        # Repositories Stock injectés dans patch/update_fsec pour activer le
        # couplage automatique des statuts d'éléments (CDC §4.2).
        self.stock_catalog_repository = StockCatalogRepository()
        self.stock_assembly_repository = FsecAssemblyItemRepository()

    def list(self, request) -> JsonResponse:
        """Liste tous les FSECs (GET /)."""
        source = LazyRepositoryList(
            fetch_func=lambda limit, offset: get_all_fsecs(self.repository, limit=limit, offset=offset),
            count_func=lambda: count_all_fsecs(self.repository),
        )
        return self.paginate_or_json(request, source, fsec_mapper_bean_to_api)

    def retrieve(self, request, version_uuid=None) -> JsonResponse:
        """Récupère un FSEC par version_uuid (GET /:version_uuid/)."""
        bean = get_fsec_by_version_uuid(self.repository, version_uuid)
        return JsonResponse(fsec_mapper_bean_to_api(bean), encoder=DjangoJSONEncoder)

    def create(self, request) -> JsonResponse:
        """Crée un nouveau FSEC (POST /)."""
        data = request.data

        # Validation avec serializer
        serializer = FsecSerializer(data=data)
        if not serializer.is_valid():
            raise InvalidDataException(str(serializer.errors))

        bean = fsec_mapper_api_to_bean(serializer.validated_data)
        result = create_fsec(self.repository, bean)
        return JsonResponse(fsec_mapper_bean_to_api(result), status=201, encoder=DjangoJSONEncoder)

    def update(self, request, version_uuid=None) -> JsonResponse:
        """Met à jour un FSEC (PUT /:version_uuid/)."""
        data = request.data.copy()
        data["version_uuid"] = version_uuid

        # Validation avec serializer
        serializer = FsecSerializer(data=data)
        if not serializer.is_valid():
            raise InvalidDataException(str(serializer.errors))

        bean = fsec_mapper_api_to_bean(serializer.validated_data)
        result = update_fsec(
            self.repository,
            bean,
            stock_catalog_repository=self.stock_catalog_repository,
            stock_assembly_repository=self.stock_assembly_repository,
        )
        return JsonResponse(fsec_mapper_bean_to_api(result), encoder=DjangoJSONEncoder)

    def get_permissions(self):
        """Admin-only pour la suppression."""
        if self.action == "destroy":
            return [IsReadOnlyOrAdmin()]
        return super().get_permissions()

    def destroy(self, request, version_uuid=None) -> HttpResponse:
        """Supprime un FSEC (DELETE /:version_uuid/)."""
        delete_fsec(self.repository, version_uuid)
        return HttpResponse(status=204)

    # Custom Actions
    @action(detail=False, methods=["get"], url_path="active")
    def list_active_fsecs(self, request) -> JsonResponse:
        """Liste tous les FSECs actifs."""
        beans = get_all_active_fsecs(self.repository)
        return self.paginate_or_json(request, beans, fsec_mapper_bean_to_api)

    @action(detail=False, methods=["get"], url_path="campaign/(?P<campaign_id>[^/.]+)")
    def list_by_campaign(self, request, campaign_id=None) -> JsonResponse:
        """Liste tous les FSECs d'une campagne."""
        beans = get_fsecs_by_campaign(self.repository, campaign_id)
        return self.paginate_or_json(request, beans, fsec_mapper_bean_to_api)

    @action(detail=False, methods=["get"], url_path="versions/(?P<fsec_uuid>[^/.]+)")
    def get_versions(self, request, fsec_uuid=None) -> JsonResponse:
        """Récupère toutes les versions d'un FSEC."""
        beans = get_fsec_versions(self.repository, fsec_uuid)
        return self.paginate_or_json(request, beans, fsec_mapper_bean_to_api)

    @action(detail=False, methods=["get"], url_path="active/(?P<fsec_uuid>[^/.]+)")
    def get_active(self, request, fsec_uuid=None) -> JsonResponse:
        """Récupère la version active d'un FSEC."""
        bean = get_active_fsec(self.repository, fsec_uuid)
        return JsonResponse(fsec_mapper_bean_to_api(bean), encoder=DjangoJSONEncoder)

    @action(detail=False, methods=["post"], url_path="version/(?P<fsec_uuid>[^/.]+)")
    def create_version(self, request, fsec_uuid=None) -> JsonResponse:
        """Crée une nouvelle version d'un FSEC existant."""
        data = request.data

        # Validation avec serializer
        serializer = FsecCreateVersionSerializer(data=data)
        if not serializer.is_valid():
            raise InvalidDataException(str(serializer.errors))

        bean = fsec_mapper_api_to_bean(serializer.validated_data)
        result = create_new_version(self.repository, fsec_uuid, bean)
        return JsonResponse(fsec_mapper_bean_to_api(result), status=201, encoder=DjangoJSONEncoder)
