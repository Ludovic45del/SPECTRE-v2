"""Bean MetrologyStep - Étape de métrologie."""

from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class MetrologyStepBean:
    """Bean représentant une étape de métrologie."""

    uuid: str = ""
    fsec_version_id: str = ""
    machine_id: Optional[int] = None
    rack_id: Optional[int] = None
    metrologist_name: Optional[str] = None
    metrologist_user_uuid: Optional[str] = None
    date: Optional[date] = None
    comments: Optional[str] = None
