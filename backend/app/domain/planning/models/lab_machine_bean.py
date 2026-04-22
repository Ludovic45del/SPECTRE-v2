"""Bean LabMachine - Machine du laboratoire."""

import uuid as uuid_mod
from dataclasses import dataclass


@dataclass
class LabMachineBean:
    """Bean representant une machine dans une salle."""

    uuid: uuid_mod.UUID | None = None
    salle_uuid: uuid_mod.UUID | None = None
    name: str = ""
    sort_order: int = 0
