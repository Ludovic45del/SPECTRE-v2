"""Bean Fa - Fiche d'Anomalie."""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class FaBean:
    """Bean représentant une Fiche d'Anomalie (FA)."""

    # Identifiant
    uuid: str = ""

    # Foreign Keys
    fsec_version_id: str = ""
    status_id: Optional[int] = None
    type_id: Optional[int] = None
    criticality_id: Optional[int] = None

    # Identifiant généré automatiquement
    identifier: str = ""

    # Phase Ouvert
    fsec_step_id: Optional[int] = None  # Étape FSEC où l'anomalie a été découverte
    fsec_step_other: Optional[str] = None  # Précision si "Autre" est sélectionné
    discoverer: str = ""
    event_date: Optional[date] = None
    observation: str = ""
    location_equipment: Optional[str] = None
    quick_analysis: str = ""
    immediate_measures: Optional[str] = None
    iec_validation_open: bool = False
    iec_validation_open_date: Optional[date] = None
    iec_validation_open_name: Optional[str] = None

    # Phase En cours
    cause: Optional[str] = None
    experience_impact: Optional[str] = None
    iec_validation_progress: bool = False
    iec_validation_progress_date: Optional[date] = None
    iec_validation_progress_name: Optional[str] = None

    # Phase Clos
    closure_validation: Optional[str] = None
    closure_date: Optional[date] = None
    closure_validator_name: Optional[str] = None

    # Soft delete
    is_active: bool = True

    # Metadata
    created_at: Optional[datetime] = None
    last_updated: Optional[datetime] = None
