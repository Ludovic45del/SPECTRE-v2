"""Bean Fsec - FSEC (Édifice Cible) principal avec versioning."""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class FsecBean:
    """Bean représentant un FSEC avec versioning."""

    # Versioning
    version_uuid: str = ""
    fsec_uuid: str = ""

    # Foreign Keys
    campaign_id: Optional[str] = None
    status_id: Optional[int] = None
    category_id: Optional[int] = None
    rack_id: Optional[int] = None

    # Champs de base
    name: str = ""
    comments: Optional[str] = None
    last_updated: Optional[datetime] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    # Champs workflow
    delivery_date: Optional[date] = None
    shooting_date: Optional[date] = None
    preshooting_pressure: Optional[float] = None
    experience_srxx: Optional[str] = None
    localisation: Optional[str] = None
    depressurization_failed: Optional[bool] = None
