"""Controller FA - API REST pour les Fiches d'Anomalie."""

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ViewSet

from app.api.fa.serializers import (
    FaCloseSerializer,
    FaPatchSerializer,
    FaSerializer,
    FaValidatePhaseSerializer,
)
from app.api.shared.mixins import LazyRepositoryList, PaginatedControllerMixin
from app.core.permissions import IsReadOnlyOrAdmin
from app.domain.exceptions import InvalidDataException
from app.domain.fa.services.fa_service import (
    close_fa,
    count_all_fas,
    create_fa,
    delete_fa,
    get_all_fas,
    get_fa_by_fsec_version_id,
    get_fa_by_uuid,
    patch_fa,
    resolve_fa_creation_context,
    update_fa,
    validate_open_phase,
    validate_progress_phase,
)
from app.mapper.fa.fa_mapper import fa_mapper_api_to_bean, fa_mapper_bean_to_api
from app.mapper.type_conversion import parse_date_string
from app.repository.campaign.repositories.campaign_repository import CampaignRepository
from app.repository.fa.repositories.fa_repository import FaRepository
from app.repository.fsec.repositories.fsec_repository import FsecRepository


class FaPagination(PageNumberPagination):
    """Pagination pour les Fiches d'Anomalie."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class FaController(PaginatedControllerMixin, ViewSet):
    """Controller REST pour les Fiches d'Anomalie (FA)."""

    lookup_field = "uuid"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repository = FaRepository()
        self.fsec_repository = FsecRepository()
        self.campaign_repository = CampaignRepository()
        self.paginator = FaPagination()

    def _validate(self, data, serializer_class):
        """Valide les données avec le serializer et retourne les données validées."""
        serializer = serializer_class(data=data)
        if not serializer.is_valid():
            raise InvalidDataException(str(serializer.errors))
        return serializer.validated_data

    def list(self, request) -> JsonResponse:
        """Liste toutes les FA (GET /).

        AUDIT R-PERF-02 / R-PERF-08 : le fallback non paginé et le count séparé sont
        acceptés pour ~2000 FA max sur 10 ans. Le frontend utilise toujours ?page=.
        """
        source = LazyRepositoryList(
            fetch_func=lambda limit, offset: get_all_fas(
                self.repository, limit=limit, offset=offset
            ),
            count_func=lambda: count_all_fas(self.repository),
        )
        return self.paginate_or_json(request, source, fa_mapper_bean_to_api)

    def retrieve(self, request, uuid=None) -> JsonResponse:
        """Récupère une FA par UUID (GET /:uuid/)."""
        bean = get_fa_by_uuid(self.repository, uuid)
        return JsonResponse(fa_mapper_bean_to_api(bean), encoder=DjangoJSONEncoder)

    def create(self, request) -> JsonResponse:
        """Crée une nouvelle FA (POST /).

        Nécessite fsec_version_id dans le body.
        L'identifiant est généré automatiquement à partir de la campagne et de la FSEC.
        """
        data = request.data
        validated = self._validate(data, FaSerializer)
        bean = fa_mapper_api_to_bean(validated)

        # Résoudre le contexte de création via le service
        context = resolve_fa_creation_context(
            bean, self.fsec_repository, self.campaign_repository
        )

        result = create_fa(
            self.repository,
            bean,
            campaign_name=context.campaign_name,
            fsec_name=context.fsec_name,
            year=context.year,
        )
        return JsonResponse(
            fa_mapper_bean_to_api(result), status=201, encoder=DjangoJSONEncoder
        )

    def update(self, request, uuid=None) -> JsonResponse:
        """Met à jour une FA (PUT /:uuid/)."""
        data = request.data.copy()
        data["uuid"] = uuid
        validated = self._validate(data, FaSerializer)
        bean = fa_mapper_api_to_bean(validated)
        result = update_fa(self.repository, bean)
        return JsonResponse(fa_mapper_bean_to_api(result), encoder=DjangoJSONEncoder)

    def partial_update(self, request, uuid=None) -> JsonResponse:
        """Met à jour partiellement une FA (PATCH /:uuid/)."""
        data = request.data
        validated = self._validate(data, FaPatchSerializer)
        for date_field in ["event_date", "closure_date"]:
            if date_field in validated and validated[date_field]:
                validated[date_field] = parse_date_string(str(validated[date_field]))

        result = patch_fa(self.repository, uuid, validated)
        return JsonResponse(fa_mapper_bean_to_api(result), encoder=DjangoJSONEncoder)

    def get_permissions(self):
        """Admin-only pour la suppression."""
        if self.action == "destroy":
            return [IsReadOnlyOrAdmin()]
        return super().get_permissions()

    def destroy(self, request, uuid=None) -> HttpResponse:
        """Supprime une FA (DELETE /:uuid/)."""
        delete_fa(self.repository, uuid)
        return HttpResponse(status=204)

    # Custom Actions

    @action(detail=False, methods=["get"], url_path="fsec/(?P<fsec_version_id>[^/.]+)")
    def get_by_fsec(self, request, fsec_version_id=None) -> JsonResponse:
        """Récupère la FA associée à une FSEC (GET /fsec/:fsec_version_id/)."""
        bean = get_fa_by_fsec_version_id(self.repository, fsec_version_id)
        return JsonResponse(fa_mapper_bean_to_api(bean), encoder=DjangoJSONEncoder)

    @action(detail=True, methods=["post"], url_path="validate-open")
    def validate_open(self, request, uuid=None) -> JsonResponse:
        """Valide la phase Ouvert et passe à En cours (POST /:uuid/validate-open/).

        Body attendu: { "validator_name": "...", "validation_date": "YYYY-MM-DD" }
        """
        data = request.data
        validated = self._validate(data, FaValidatePhaseSerializer)
        validator_name = validated.get("validator_name", "")
        validation_date = validated.get("validation_date")

        result = validate_open_phase(
            self.repository, uuid, validator_name, validation_date
        )
        return JsonResponse(fa_mapper_bean_to_api(result), encoder=DjangoJSONEncoder)

    @action(detail=True, methods=["post"], url_path="validate-progress")
    def validate_progress(self, request, uuid=None) -> JsonResponse:
        """Valide la phase En cours et passe à Clos (POST /:uuid/validate-progress/).

        Body attendu: { "validator_name": "...", "validation_date": "YYYY-MM-DD" }
        """
        data = request.data
        validated = self._validate(data, FaValidatePhaseSerializer)
        validator_name = validated.get("validator_name", "")
        validation_date = validated.get("validation_date")

        result = validate_progress_phase(
            self.repository, uuid, validator_name, validation_date
        )
        return JsonResponse(fa_mapper_bean_to_api(result), encoder=DjangoJSONEncoder)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, uuid=None) -> JsonResponse:
        """Ferme définitivement une FA (POST /:uuid/close/).

        Body attendu: {
            "validator_name": "...",
            "closure_validation": "...",
            "closure_date": "YYYY-MM-DD"
        }
        """
        data = request.data
        validated = self._validate(data, FaCloseSerializer)
        validator_name = validated.get("validator_name", "")
        closure_validation = validated.get("closure_validation", "")
        closure_date = validated.get("closure_date")

        result = close_fa(
            self.repository,
            uuid,
            validator_name,
            closure_validation,
            closure_date,
        )
        return JsonResponse(fa_mapper_bean_to_api(result), encoder=DjangoJSONEncoder)
