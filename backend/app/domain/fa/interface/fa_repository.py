"""Interface IFaRepository - Repository abstrait pour FA."""

import abc
from typing import List, Optional

from app.domain.fa.models.fa_bean import FaBean


class IFaRepository(abc.ABC):
    """Interface abstraite pour le repository FA."""

    @abc.abstractmethod
    def create(self, bean: FaBean) -> FaBean:
        """Crée une nouvelle FA."""
        raise NotImplementedError

    @abc.abstractmethod
    def get_by_uuid(self, uuid: str) -> Optional[FaBean]:
        """Récupère une FA par son UUID."""
        raise NotImplementedError

    @abc.abstractmethod
    def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[FaBean]:
        """Récupère toutes les FA (avec pagination optionnelle)."""
        raise NotImplementedError

    @abc.abstractmethod
    def count_all(self) -> int:
        """Retourne le nombre total de FA."""
        raise NotImplementedError

    @abc.abstractmethod
    def get_by_fsec_version_id(self, fsec_version_id: str) -> Optional[FaBean]:
        """Récupère la FA associée à une FSEC."""
        raise NotImplementedError

    @abc.abstractmethod
    def update(self, bean: FaBean) -> FaBean:
        """Met à jour une FA."""
        raise NotImplementedError

    @abc.abstractmethod
    def delete(self, uuid: str) -> bool:
        """Soft-delete une FA par son UUID (is_active=False)."""
        raise NotImplementedError

    @abc.abstractmethod
    def exists_by_identifier(self, identifier: str) -> bool:
        """Vérifie si une FA existe avec cet identifiant."""
        raise NotImplementedError

    @abc.abstractmethod
    def exists_by_fsec_version_id(self, fsec_version_id: str) -> bool:
        """Vérifie si une FA existe déjà pour cette FSEC."""
        raise NotImplementedError
