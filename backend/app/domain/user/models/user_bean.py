"""
Bean utilisateur — DTO pour la couche domaine.

Definit les roles metier SPECTRE et le mapping vers les groupes de permission Django.
"""

import uuid as uuid_lib
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

# --------------------------------------------------------------------------- #
#  Roles metier SPECTRE
# --------------------------------------------------------------------------- #
ROLE_CHEF_LABO = "chef_labo"
ROLE_IEC = "iec"
ROLE_RCE = "rce"
ROLE_STAGIAIRE = "stagiaire"
ROLE_ALTERNANT = "alternant"
ROLE_ASSEMBLEUR = "assembleur"
ROLE_METROLOGUE = "metrologue"
ROLE_CRYOGENIE = "cryogenie"

ALL_SPECTRE_ROLES = [
    ROLE_CHEF_LABO,
    ROLE_IEC,
    ROLE_RCE,
    ROLE_ASSEMBLEUR,
    ROLE_METROLOGUE,
    ROLE_CRYOGENIE,
    ROLE_STAGIAIRE,
    ROLE_ALTERNANT,
]

# --------------------------------------------------------------------------- #
#  Mapping role metier → groupe de permission Django
# --------------------------------------------------------------------------- #
ROLE_TO_PERMISSION_GROUP: dict[str, str] = {
    ROLE_CHEF_LABO: "admin",
    ROLE_IEC: "operateur",
    ROLE_RCE: "operateur",
    ROLE_ASSEMBLEUR: "operateur",
    ROLE_METROLOGUE: "operateur",
    ROLE_CRYOGENIE: "operateur",
    ROLE_STAGIAIRE: "lecteur",
    ROLE_ALTERNANT: "lecteur",
}


@dataclass
class UserBean:
    """DTO utilisateur pour la couche domaine."""

    uuid: Optional[uuid_lib.UUID] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    permission_group: Optional[str] = None
    laboratoire: Optional[str] = None
    service: Optional[str] = None
    numero: Optional[str] = None
    bureau: Optional[str] = None
    avatar_url: Optional[str] = None
    signature_url: Optional[str] = None
    is_active: Optional[bool] = True
    force_password_change: Optional[bool] = True
    dashboard_preferences: Optional[dict] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
