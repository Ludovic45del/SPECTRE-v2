"""Bean AirtightnessTestLpStep - Test d'étanchéité basse pression."""

from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class AirtightnessTestLpStepBean:
    """Bean représentant un test d'étanchéité basse pression."""

    uuid: str = ""
    fsec_version_id: str = ""
    embase_id: Optional[str] = None
    embase_identifier: Optional[str] = None
    leak_rate_dtri: Optional[str] = None
    gas_type: Optional[str] = None
    experiment_pressure: Optional[float] = None
    airtightness_test_duration: Optional[float] = None
    operator: Optional[str] = None
    operator_user_uuid: Optional[str] = None
    date_of_fulfilment: Optional[date] = None
