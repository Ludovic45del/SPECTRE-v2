"""Bean CampaignTeams - Équipe de campagne."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class CampaignTeamsBean:
    """Bean représentant une équipe de campagne."""

    uuid: str = ""
    campaign_uuid: str = ""
    role_id: Optional[int] = None
    name: str = ""
