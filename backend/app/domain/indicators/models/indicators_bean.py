"""Beans Indicators - DTOs pour les indicateurs agrégés."""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class StepDurationBean:
    """Durée d'une transition entre deux étapes du workflow FSEC (en jours).

    Calculée sur les FSEC tirées dans l'année (shooting_date dans l'année filtrée),
    pour disposer d'un pipeline complet et éviter les biais de FSEC en cours.
    """

    key: str
    label: str
    count: int = 0
    avg_days: Optional[float] = None
    median_days: Optional[float] = None
    min_days: Optional[float] = None
    max_days: Optional[float] = None
    is_gas: bool = False


@dataclass
class FaIndicatorsBean:
    """Indicateurs agrégés sur les Fiches d'Anomalie."""

    total_created_in_year: int = 0
    by_status: Dict[str, int] = field(default_factory=dict)
    by_criticality: Dict[str, int] = field(default_factory=dict)
    by_discovery_step: Dict[str, int] = field(default_factory=dict)
    open_stock_all_years: int = 0
    avg_event_to_open_days: Optional[float] = None
    avg_open_to_progress_days: Optional[float] = None
    avg_progress_to_closure_days: Optional[float] = None
    avg_total_lifecycle_days: Optional[float] = None
    created_per_month: Dict[str, int] = field(default_factory=dict)


@dataclass
class FsecIndicatorsBean:
    """Indicateurs agrégés sur les FSEC."""

    total_created_in_year: int = 0
    total_shot_in_year: int = 0
    by_status: Dict[str, int] = field(default_factory=dict)
    by_category: Dict[str, int] = field(default_factory=dict)
    avg_cycle_time_days: Optional[float] = None
    median_cycle_time_days: Optional[float] = None
    shot_per_month: Dict[str, int] = field(default_factory=dict)


@dataclass
class OperatorWorkloadBean:
    """Charge de travail d'un opérateur (nombre d'étapes complétées dans l'année)."""

    user_uuid: str
    name: str
    steps_count: int = 0


@dataclass
class IndicatorsBean:
    """Conteneur global des indicateurs pour une année donnée."""

    year: int = 0
    fa: FaIndicatorsBean = field(default_factory=FaIndicatorsBean)
    fsec: FsecIndicatorsBean = field(default_factory=FsecIndicatorsBean)
    step_durations: List[StepDurationBean] = field(default_factory=list)
    top_operators: List[OperatorWorkloadBean] = field(default_factory=list)
    bottleneck_step_key: Optional[str] = None
