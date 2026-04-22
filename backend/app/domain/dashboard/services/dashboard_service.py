"""Service Dashboard - Logique métier pure."""

import logging
from typing import List, Tuple

from app.domain.dashboard.interface.dashboard_repository import IDashboardRepository
from app.domain.dashboard.models.dashboard_bean import (
    DashboardCountsBean,
    RecentActivityItemBean,
)

logger = logging.getLogger(__name__)

RECENT_ACTIVITY_LIMIT = 10


def get_dashboard_data(
    repository: IDashboardRepository,
    limit: int = RECENT_ACTIVITY_LIMIT,
) -> Tuple[DashboardCountsBean, List[RecentActivityItemBean]]:
    """Récupère les données complètes du dashboard (compteurs + activité récente)."""
    logger.debug("Recuperation des donnees dashboard (limit=%d)", limit)
    counts = get_dashboard_counts(repository)
    recent_activity = get_recent_activity(repository, limit=limit)
    return counts, recent_activity


def get_dashboard_counts(repository: IDashboardRepository) -> DashboardCountsBean:
    """Récupère les compteurs agrégés du dashboard."""
    return repository.get_counts()


def get_recent_activity(
    repository: IDashboardRepository, limit: int = RECENT_ACTIVITY_LIMIT
) -> List[RecentActivityItemBean]:
    """Récupère l'activité récente, triée par date décroissante."""
    items = repository.get_recent_activity(limit=limit)

    # Tri global par date décroissante, prendre les N plus récents
    items.sort(key=lambda x: x.last_updated or "", reverse=True)
    return items[:limit]
