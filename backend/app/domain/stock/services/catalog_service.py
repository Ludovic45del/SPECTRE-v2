"""Service Catalog — logique métier du catalogue Stock.

Voir CAHIER_DES_CHARGES_STOCK.md §3.1 (validations) et §5.1 (API).
"""

import logging
from typing import Any, Dict, List, Optional

from app.domain.exceptions import ConflictException, NotFoundException, ValidationException
from app.domain.stock.interface.catalog_repository import IStockCatalogRepository
from app.domain.stock.models.stock_catalog_bean import StockCatalogItemBean
from app.domain.stock.models.stock_constants import (
    CATEGORY_BY_KIND,
    ELEMENT_STATUS_DISPO,
    ERROR_CODE_CATALOG_ITEM_IN_USE,
    ERROR_CODE_INVALID_KIND_CATEGORY,
    ITEM_KIND_CONSUMABLE,
    ITEM_KIND_ELEMENT,
    ITEM_KINDS,
)

logger = logging.getLogger(__name__)


# Champs autorisés pour la mise à jour partielle (PATCH).
# `kind` est explicitement exclu (immuable après création — cf. CDC §5.1).
ALLOWED_PATCH_FIELDS = {
    "category",
    "name",
    "reference",
    "caracteristique",
    "type_de_colle",
    "fournisseur",
    "remarques",
    "unite",
    "quantite",
    "seuil_alerte",
    "date_peremption",
    "type_d_achat",
    "installation",
    "status",
    "materiaux_mat",
    "boite",
    "emplacement",
    "is_active",
}


# ---------------------------------------------------------------------------
# Validations privées
# ---------------------------------------------------------------------------


def _validate_kind(bean: StockCatalogItemBean) -> None:
    if bean.kind not in ITEM_KINDS:
        raise ValidationException(
            "kind",
            f"Kind invalide '{bean.kind}'. Valeurs autorisées : {sorted(ITEM_KINDS)}",
        )


def _validate_kind_category_consistency(bean: StockCatalogItemBean) -> None:
    """Vérifie que la rubrique est compatible avec le kind (cf. CDC §4.6)."""
    allowed = CATEGORY_BY_KIND.get(bean.kind, frozenset())
    if bean.category not in allowed:
        raise ValidationException(
            ERROR_CODE_INVALID_KIND_CATEGORY,
            f"Rubrique '{bean.category}' incompatible avec kind='{bean.kind}'. "
            f"Valeurs autorisées pour ce kind : {sorted(allowed)}",
        )


def _validate_kind_specific_fields(bean: StockCatalogItemBean) -> None:
    """Applique les contraintes CDC §3.1 selon le kind."""
    if bean.kind == ITEM_KIND_ELEMENT:
        # Champs requis pour element
        if not bean.status:
            # Service applique le default si absent.
            bean.status = ELEMENT_STATUS_DISPO
        if not bean.installation:
            raise ValidationException(
                "installation",
                "Le champ 'installation' (LMJ/OMEGA) est requis pour un élément sérialisé.",
            )
        # Champs interdits pour element
        for forbidden in ("unite", "seuil_alerte", "date_peremption", "type_d_achat"):
            if getattr(bean, forbidden) is not None:
                raise ValidationException(
                    forbidden,
                    f"Le champ '{forbidden}' est interdit pour un élément sérialisé.",
                )
        # quantite : doit être null ou 0 (le default IntegerField=0 est OK)
        if bean.quantite not in (None, 0):
            raise ValidationException(
                "quantite",
                "Le champ 'quantite' est interdit pour un élément sérialisé.",
            )
    elif bean.kind == ITEM_KIND_CONSUMABLE:
        # Champs requis pour consumable
        if not bean.unite:
            raise ValidationException("unite", "Le champ 'unite' est requis pour un consommable.")
        if bean.quantite is None:
            raise ValidationException(
                "quantite",
                "Le champ 'quantite' est requis pour un consommable (peut valoir 0).",
            )
        if bean.quantite < 0:
            raise ValidationException("quantite", "La quantité ne peut pas être négative.")
        # Champs interdits pour consumable
        for forbidden in ("status", "installation", "materiaux_mat"):
            if getattr(bean, forbidden) is not None:
                raise ValidationException(
                    forbidden,
                    f"Le champ '{forbidden}' est interdit pour un consommable.",
                )


def _validate_unicity(
    repository: IStockCatalogRepository,
    bean: StockCatalogItemBean,
    exclude_uuid: Optional[str] = None,
) -> None:
    """Unicité (kind, name, reference) — cf. CDC §3.1."""
    if repository.exists_by_kind_name_reference(
        kind=bean.kind,
        name=bean.name,
        reference=bean.reference,
        exclude_uuid=exclude_uuid,
    ):
        raise ConflictException(
            "name/reference",
            f"{bean.name}/{bean.reference or '(sans référence)'}",
        )


# ---------------------------------------------------------------------------
# Opérations CRUD exposées
# ---------------------------------------------------------------------------


def create_item(repository: IStockCatalogRepository, bean: StockCatalogItemBean) -> StockCatalogItemBean:
    """Crée un nouvel item du catalogue après validation (cf. CDC §5.1)."""
    _validate_kind(bean)
    _validate_kind_category_consistency(bean)
    _validate_kind_specific_fields(bean)
    _validate_unicity(repository, bean)

    logger.info(
        "Creating stock catalog item kind=%s category=%s name=%s",
        bean.kind,
        bean.category,
        bean.name,
    )
    result = repository.create(bean)
    logger.info("Created stock catalog item uuid=%s", result.uuid)
    return result


def get_item(repository: IStockCatalogRepository, uuid: str) -> StockCatalogItemBean:
    """Récupère un item par UUID. Lève NotFoundException sinon."""
    bean = repository.get_by_uuid(uuid)
    if bean is None:
        raise NotFoundException("StockCatalogItem", uuid)
    return bean


def list_items(
    repository: IStockCatalogRepository,
    kind: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    installation: Optional[str] = None,
    is_active: Optional[bool] = True,
    search: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> List[StockCatalogItemBean]:
    """Liste paginée du catalogue."""
    return repository.list_by_filters(
        kind=kind,
        category=category,
        status=status,
        installation=installation,
        is_active=is_active,
        search=search,
        limit=limit,
        offset=offset,
    )


def count_items(
    repository: IStockCatalogRepository,
    kind: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    installation: Optional[str] = None,
    is_active: Optional[bool] = True,
    search: Optional[str] = None,
) -> int:
    """Compte des items selon filtres."""
    return repository.count_by_filters(
        kind=kind,
        category=category,
        status=status,
        installation=installation,
        is_active=is_active,
        search=search,
    )


def update_item(repository: IStockCatalogRepository, bean: StockCatalogItemBean) -> StockCatalogItemBean:
    """Met à jour complètement un item (PUT). `kind` est conservé tel qu'en base."""
    existing = repository.get_by_uuid(bean.uuid)
    if existing is None:
        raise NotFoundException("StockCatalogItem", bean.uuid)

    # `kind` est immuable : on force la valeur en base, peu importe ce que l'API a envoyé.
    bean.kind = existing.kind

    _validate_kind(bean)
    _validate_kind_category_consistency(bean)
    _validate_kind_specific_fields(bean)
    _validate_unicity(repository, bean, exclude_uuid=bean.uuid)

    logger.info("Updating stock catalog item uuid=%s", bean.uuid)
    return repository.update(bean)


def patch_item(
    repository: IStockCatalogRepository,
    uuid: str,
    partial_data: Dict[str, Any],
) -> StockCatalogItemBean:
    """Mise à jour partielle (PATCH). Les champs hors whitelist sont ignorés silencieusement."""
    existing = repository.get_by_uuid(uuid)
    if existing is None:
        raise NotFoundException("StockCatalogItem", uuid)

    # Fusion des champs autorisés
    for key, value in partial_data.items():
        if key in ALLOWED_PATCH_FIELDS:
            setattr(existing, key, value)

    # Re-validation post-fusion
    _validate_kind_category_consistency(existing)
    _validate_kind_specific_fields(existing)
    _validate_unicity(repository, existing, exclude_uuid=uuid)

    logger.info(
        "Patching stock catalog item uuid=%s fields=%s",
        uuid,
        list(partial_data.keys()),
    )
    return repository.update(existing)


def soft_delete_item(repository: IStockCatalogRepository, uuid: str) -> bool:
    """Désactive un item (is_active=False). Refusé si référencé par un FsecAssemblyItem."""
    existing = repository.get_by_uuid(uuid)
    if existing is None:
        raise NotFoundException("StockCatalogItem", uuid)

    if repository.is_referenced_by_assembly(uuid):
        raise ValidationException(
            ERROR_CODE_CATALOG_ITEM_IN_USE,
            "Cet item est référencé par un tableau récap FSEC, suppression impossible.",
        )

    logger.info("Soft-deleting stock catalog item uuid=%s", uuid)
    if not repository.soft_delete(uuid):
        raise NotFoundException("StockCatalogItem", uuid)
    return True
