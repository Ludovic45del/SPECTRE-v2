"""Bean LabSalle - Salle du laboratoire."""

from __future__ import annotations

import uuid as uuid_mod
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.planning.models.lab_machine_bean import LabMachineBean


@dataclass
class LabSalleBean:
    """Bean representant une salle avec ses machines."""

    uuid: uuid_mod.UUID | None = None
    name: str = ""
    sort_order: int = 0
    machines: list[LabMachineBean] = field(default_factory=list)
