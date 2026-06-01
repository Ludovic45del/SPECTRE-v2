"""Bean SealingStep - Étape de scellement."""

from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class SealingStepBean:
    """Bean représentant une étape de scellement, liée à une métrologie."""

    uuid: str = ""
    metrology_step_id: str = ""
    date: Optional[date] = None
    metrologist_name: Optional[str] = None
    metrologist_user_uuid: Optional[str] = None
    rack_id: Optional[int] = None
    interface_io: Optional[str] = None
    comments: Optional[str] = None
    # Liens fichiers (URL HTTP ou chemin UNC \\serveur\...) : fichier métro .txt et Visrad réalisé.
    metro_file_link: Optional[str] = None
    visrad_link: Optional[str] = None
