"""Bean FsecTeams - Équipe FSEC."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class FsecTeamsBean:
    """Bean représentant un membre d'équipe FSEC."""

    uuid: str = ""
    fsec_id: str = ""  # Référence vers version_uuid du FSEC
    role_id: Optional[int] = None
    name: str = ""
