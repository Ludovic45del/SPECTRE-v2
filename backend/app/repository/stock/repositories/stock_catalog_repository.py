"""Repository StockCatalog — implémentation IStockCatalogRepository."""

from dataclasses import replace
from datetime import date, timedelta
from typing import List, Optional

from django.db import connection, transaction
from django.db.models import F, Q

from app.domain.stock.interface.catalog_repository import IStockCatalogRepository
from app.domain.stock.models.stock_catalog_bean import StockCatalogItemBean
from app.domain.stock.models.stock_constants import (
    ELEMENT_STATUS_DISPO,
    ITEM_KIND_CONSUMABLE,
    ITEM_KIND_ELEMENT,
)

# Clé de verrou consultatif PostgreSQL sérialisant l'attribution des numéros de
# série de structuration entre requêtes concurrentes (cf. create_structuration_batch).
_STRUCTURATION_LOCK_KEY = 481516234299
from app.mapper.stock.catalog_mapper import (
    stock_catalog_mapper_bean_to_entity,
    stock_catalog_mapper_entity_to_bean,
)
from app.repository.stock.models.fsec_assembly_item_entity import FsecAssemblyItemEntity
from app.repository.stock.models.stock_catalog_entity import StockCatalogItemEntity


class StockCatalogRepository(IStockCatalogRepository):
    """Implémentation du repository pour le catalogue Stock."""

    # ---------------------------------------------------------------- CRUD

    @transaction.atomic
    def create(self, bean: StockCatalogItemBean) -> StockCatalogItemBean:
        """Crée un nouvel item du catalogue."""
        entity = stock_catalog_mapper_bean_to_entity(bean)
        entity.save()
        return stock_catalog_mapper_entity_to_bean(entity)

    @transaction.atomic
    def create_structuration_batch(
        self, template: StockCatalogItemBean, quantity: int
    ) -> List[StockCatalogItemBean]:
        """Crée `quantity` structurations numérotées séquentiellement, atomiquement.

        L'attribution des numéros (lecture du max + insertions) est sérialisée :
        - PostgreSQL : verrou consultatif transactionnel (`pg_advisory_xact_lock`),
          relâché au commit — empêche deux paquets concurrents de réutiliser le
          même numéro, y compris quand le catalogue est vide.
        - SQLite : les écritures sont déjà sérialisées au niveau base, la
          transaction atomique suffit.

        Le compteur est calculé sur l'ensemble `kind=element` (cf.
        `_max_element_number`) pour rester cohérent avec l'unicité (kind, name,
        reference) et ne jamais entrer en collision avec une pièce élémentaire
        au nom numérique.
        """
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT pg_advisory_xact_lock(%s)", [_STRUCTURATION_LOCK_KEY]
                )

        start = self._max_element_number() + 1
        created: List[StockCatalogItemBean] = []
        for offset in range(quantity):
            bean = replace(template, name=str(start + offset))
            entity = stock_catalog_mapper_bean_to_entity(bean)
            entity.save()
            created.append(stock_catalog_mapper_entity_to_bean(entity))
        return created

    def get_by_uuid(self, uuid: str) -> Optional[StockCatalogItemBean]:
        """Récupère un item par son UUID."""
        try:
            entity = StockCatalogItemEntity.objects.get(uuid=uuid)
            return stock_catalog_mapper_entity_to_bean(entity)
        except StockCatalogItemEntity.DoesNotExist:
            return None

    @transaction.atomic
    def update(self, bean: StockCatalogItemBean) -> StockCatalogItemBean:
        """Met à jour un item existant (PUT-like — tous les champs sauf kind)."""
        entity = StockCatalogItemEntity.objects.get(uuid=bean.uuid)

        # Préserver kind (interdit de modifier après création — cf. CDC §5.1).
        # Le service garantit déjà cette règle, mais on fixe une seconde barrière ici.
        entity.category = bean.category
        entity.structuration_type = bean.structuration_type
        entity.name = bean.name
        entity.reference = bean.reference
        entity.caracteristique = bean.caracteristique
        entity.type_de_colle = bean.type_de_colle
        entity.fournisseur = bean.fournisseur
        entity.remarques = bean.remarques
        entity.unite = bean.unite
        entity.quantite = bean.quantite
        entity.seuil_alerte = bean.seuil_alerte
        entity.date_peremption = bean.date_peremption
        entity.type_d_achat = bean.type_d_achat
        entity.fsec_name = bean.fsec_name
        entity.installation = bean.installation
        entity.status = bean.status
        entity.materiaux_mat = bean.materiaux_mat
        entity.boite = bean.boite
        entity.emplacement = bean.emplacement
        entity.is_active = bean.is_active

        entity.save()
        return stock_catalog_mapper_entity_to_bean(entity)

    @transaction.atomic
    def patch(self, uuid: str, fields: dict) -> StockCatalogItemBean:
        """Met à jour partiellement les champs fournis. `kind` est ignoré s'il est passé."""
        entity = StockCatalogItemEntity.objects.get(uuid=uuid)
        for key, value in fields.items():
            if key == "kind":
                continue
            if hasattr(entity, key):
                setattr(entity, key, value)
        entity.save()
        return stock_catalog_mapper_entity_to_bean(entity)

    @transaction.atomic
    def soft_delete(self, uuid: str) -> bool:
        """Désactive un item (is_active=False)."""
        try:
            entity = StockCatalogItemEntity.objects.get(uuid=uuid)
            entity.is_active = False
            entity.save(update_fields=["is_active", "updated_at"])
            return True
        except StockCatalogItemEntity.DoesNotExist:
            return False

    # ---------------------------------------------------------------- Listing

    def _build_filter_queryset(
        self,
        kind: Optional[str],
        category: Optional[str],
        status: Optional[str],
        installation: Optional[str],
        is_active: Optional[bool],
        search: Optional[str],
    ):
        qs = StockCatalogItemEntity.objects.all()
        if kind is not None:
            qs = qs.filter(kind=kind)
        if category is not None:
            qs = qs.filter(category=category)
        if status is not None:
            qs = qs.filter(status=status)
        if installation is not None:
            qs = qs.filter(installation=installation)
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(reference__icontains=search))
        return qs.order_by("name", "reference")

    def list_by_filters(
        self,
        kind: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        installation: Optional[str] = None,
        is_active: Optional[bool] = True,
        search: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[StockCatalogItemBean]:
        """Liste paginée selon filtres (cf. CDC §5.1)."""
        qs = self._build_filter_queryset(
            kind, category, status, installation, is_active, search
        )
        if limit is not None:
            entities = qs[offset : offset + limit]
        else:
            entities = qs[offset:]
        return [stock_catalog_mapper_entity_to_bean(e) for e in entities]

    def count_by_filters(
        self,
        kind: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        installation: Optional[str] = None,
        is_active: Optional[bool] = True,
        search: Optional[str] = None,
    ) -> int:
        """Compte selon filtres."""
        return self._build_filter_queryset(
            kind, category, status, installation, is_active, search
        ).count()

    # ---------------------------------------------------------------- Specific queries

    def exists_by_kind_name_reference(
        self,
        kind: str,
        name: str,
        reference: Optional[str],
        exclude_uuid: Optional[str] = None,
    ) -> bool:
        """Unicité name+reference par kind (CDC §3.1)."""
        qs = StockCatalogItemEntity.objects.filter(
            kind=kind, name=name, reference=reference, is_active=True
        )
        if exclude_uuid:
            qs = qs.exclude(uuid=exclude_uuid)
        return qs.exists()

    def _max_element_number(self) -> int:
        """Plus grand `name` purement numérique parmi les éléments sérialisés.

        Le périmètre est `kind=element` (et non `category=structuration`) pour
        être cohérent avec l'unicité (kind, name, reference) : ainsi le prochain
        numéro ne pourra jamais entrer en collision avec une pièce élémentaire
        au nom numérique. Inclut les items inactifs (numéros jamais réutilisés).
        Renvoie 0 si aucun nom numérique n'existe.
        """
        names = StockCatalogItemEntity.objects.filter(
            kind=ITEM_KIND_ELEMENT
        ).values_list("name", flat=True)
        max_number = 0
        for name in names:
            if name and name.isdigit():
                value = int(name)
                if value > max_number:
                    max_number = value
        return max_number

    def next_structuration_number(self) -> int:
        """Prochain numéro de série (max + 1), non verrouillé — pour l'aperçu UI.

        L'attribution réelle et sérialisée a lieu dans `create_structuration_batch`.
        """
        return self._max_element_number() + 1

    def is_referenced_by_assembly(self, uuid: str) -> bool:
        """Vrai s'il existe au moins un FsecAssemblyItem référençant cet item."""
        return FsecAssemblyItemEntity.objects.filter(catalog_item_id=uuid).exists()

    def list_available_for_fsec(
        self,
        fsec_uuid: str,
        kind: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[StockCatalogItemBean]:
        """Items assignables à une FSEC (cf. CDC §5.4)."""
        qs = StockCatalogItemEntity.objects.filter(is_active=True)
        if kind is not None:
            qs = qs.filter(kind=kind)
        if category is not None:
            qs = qs.filter(category=category)

        # Pour les éléments : status='dispo' OU déjà attribués à cette même FSEC.
        already_assigned_uuids = list(
            FsecAssemblyItemEntity.objects.filter(fsec_uuid=fsec_uuid).values_list(
                "catalog_item_id", flat=True
            )
        )

        # Construire un filtre composite : (kind=consumable) OR (kind=element AND
        # (status=dispo OR uuid in already_assigned)).
        consumable_q = Q(kind=ITEM_KIND_CONSUMABLE)
        element_q = Q(kind=ITEM_KIND_ELEMENT) & (
            Q(status=ELEMENT_STATUS_DISPO) | Q(uuid__in=already_assigned_uuids)
        )
        qs = qs.filter(consumable_q | element_q).order_by("category", "name")
        return [stock_catalog_mapper_entity_to_bean(e) for e in qs]

    @transaction.atomic
    def update_status_for_uuids(self, uuids: List[str], new_status: str) -> int:
        """Met à jour `status` en bulk pour des éléments. Retourne le nb de lignes affectées."""
        if not uuids:
            return 0
        return StockCatalogItemEntity.objects.filter(
            uuid__in=uuids, kind=ITEM_KIND_ELEMENT
        ).update(status=new_status)

    # ---------------------------------------------------------------- Alerts

    def find_low_stock(self) -> List[StockCatalogItemBean]:
        """Consommables actifs où quantite <= seuil_alerte."""
        qs = (
            StockCatalogItemEntity.objects.filter(
                kind=ITEM_KIND_CONSUMABLE,
                is_active=True,
                seuil_alerte__isnull=False,
            )
            .filter(quantite__lte=F("seuil_alerte"))
            .order_by("name")
        )
        return [stock_catalog_mapper_entity_to_bean(e) for e in qs]

    def find_expired(self, today: date) -> List[StockCatalogItemBean]:
        """Consommables actifs périmés (date_peremption <= today)."""
        qs = StockCatalogItemEntity.objects.filter(
            kind=ITEM_KIND_CONSUMABLE,
            is_active=True,
            date_peremption__isnull=False,
            date_peremption__lte=today,
        ).order_by("date_peremption")
        return [stock_catalog_mapper_entity_to_bean(e) for e in qs]

    def find_expiring_soon(
        self, today: date, days_ahead: int
    ) -> List[StockCatalogItemBean]:
        """Consommables périmant entre demain et today + days_ahead jours."""
        qs = StockCatalogItemEntity.objects.filter(
            kind=ITEM_KIND_CONSUMABLE,
            is_active=True,
            date_peremption__isnull=False,
            date_peremption__gt=today,
            date_peremption__lte=today + timedelta(days=days_ahead),
        ).order_by("date_peremption")
        return [stock_catalog_mapper_entity_to_bean(e) for e in qs]
