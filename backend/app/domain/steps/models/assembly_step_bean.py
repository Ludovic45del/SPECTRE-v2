"""Bean AssemblyStep - Étape d'assemblage."""

from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional


@dataclass
class AssemblyStepBean:
    """Bean représentant une étape d'assemblage."""

    uuid: str = ""
    fsec_version_id: str = ""
    operator: Optional[str] = None
    operator_user_uuid: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    comments: Optional[str] = None
    assembly_bench_ids: List[int] = field(default_factory=list)
