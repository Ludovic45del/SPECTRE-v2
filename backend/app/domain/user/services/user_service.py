"""Service utilisateur — logique metier pure."""

import logging
import secrets
import string
import uuid as uuid_lib

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from app.domain.exceptions import (
    ConflictException,
    NotFoundException,
    ValidationException,
)
from app.domain.user.interface.user_repository import IUserRepository
from app.domain.user.models.user_bean import ALL_SPECTRE_ROLES, UserBean

logger = logging.getLogger(__name__)


def _validate_password_strength(password: str, username: str | None = None) -> None:
    """Applique AUTH_PASSWORD_VALIDATORS (longueur, commun, similarité username).

    Wrappe les django.core.exceptions.ValidationError en ValidationException du
    domaine pour que ErrorHandlerMiddleware retourne un 400 cohérent.

    Utilise une instance User non-persistée pour que
    `UserAttributeSimilarityValidator` puisse accéder à `_meta` sans créer
    réellement l'utilisateur en base.
    """
    # Import local pour éviter un import lourd au chargement du module.
    from django.contrib.auth.models import User

    user_reference = User(username=username) if username else None
    try:
        validate_password(password, user=user_reference)
    except DjangoValidationError as exc:
        raise ValidationException("password", "; ".join(exc.messages)) from exc


def _validate_role(role: str) -> None:
    # Defense en profondeur : createadmin ne passe pas par un serializer
    if role not in ALL_SPECTRE_ROLES:
        raise ValidationException(
            "role",
            f"Role invalide '{role}'. Roles acceptes : {', '.join(ALL_SPECTRE_ROLES)}",
        )


def _generate_temporary_password(length: int = 12) -> str:
    """Genere un mot de passe temporaire securise (CSPRNG)."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in "!@#$%&*" for c in password)
        ):
            return password


def create_user(
    repository: IUserRepository,
    bean: UserBean,
    password: str = None,
) -> tuple[UserBean, str]:
    """Cree un nouvel utilisateur.

    Returns:
        tuple (UserBean cree, mot de passe en clair a communiquer)
    """
    if not bean.username or not bean.username.strip():
        raise ValidationException(
            "username",
            "Le nom d'utilisateur est requis",
        )

    _validate_role(bean.role)

    if repository.exists_by_username(bean.username):
        raise ConflictException("username", bean.username)

    if password:
        # Le mot de passe généré par _generate_temporary_password() passe toujours
        # les validators (12 chars + diversité) : skip la validation coûteuse
        # côté défaut, et la réservons aux mots de passe fournis par l'admin.
        _validate_password_strength(password, username=bean.username)
        generated_password = password
    else:
        generated_password = _generate_temporary_password()
    created_bean = repository.create(bean, generated_password)
    logger.debug("Utilisateur cree: %s (role=%s)", bean.username, bean.role)
    return created_bean, generated_password


def get_user_by_uuid(repository: IUserRepository, uuid: uuid_lib.UUID) -> UserBean:
    bean = repository.get_by_uuid(uuid)
    if not bean:
        raise NotFoundException("USER", str(uuid))
    return bean


def list_users(
    repository: IUserRepository, offset: int = 0, limit: int = 50
) -> list[UserBean]:
    return repository.get_all(offset=offset, limit=limit)


def update_user(
    repository: IUserRepository, uuid: uuid_lib.UUID, bean: UserBean
) -> UserBean:
    existing = repository.get_by_uuid(uuid)
    if not existing:
        raise NotFoundException("USER", str(uuid))

    _validate_role(bean.role)
    bean.uuid = uuid
    updated = repository.update(bean)
    logger.debug("Utilisateur modifie: %s (role=%s)", updated.username, updated.role)
    return updated


def toggle_active(repository: IUserRepository, uuid: uuid_lib.UUID) -> UserBean:
    existing = repository.get_by_uuid(uuid)
    if not existing:
        raise NotFoundException("USER", str(uuid))
    result = repository.toggle_active(uuid)
    logger.debug("Utilisateur %s: is_active=%s", result.username, result.is_active)
    return result


def reset_password(repository: IUserRepository, uuid: uuid_lib.UUID) -> UserBean:
    """Reinitialise le mot de passe (action admin).

    Invalide l'ancien mot de passe en posant un secret aléatoire jamais
    retourné. Le nouvel accès se fait via le lien d'activation émis par le
    controller (cf `app.core.password_activation`).

    Returns:
        UserBean de l'utilisateur cible.
    """
    existing = repository.get_by_uuid(uuid)
    if not existing:
        raise NotFoundException("USER", str(uuid))

    throwaway_password = _generate_temporary_password(length=32)
    repository.reset_password(uuid, throwaway_password)
    logger.debug("Mot de passe reinitialise pour: %s", existing.username)
    return existing


def change_password(
    repository: IUserRepository,
    uuid: uuid_lib.UUID,
    current_password: str,
    new_password: str,
) -> None:
    """Change le mot de passe (action self-service)."""
    existing = repository.get_by_uuid(uuid)
    if not existing:
        raise NotFoundException("USER", str(uuid))

    if not repository.check_password(uuid, current_password):
        raise ValidationException("current_password", "Mot de passe actuel incorrect")

    if current_password == new_password:
        raise ValidationException(
            "new_password",
            "Le nouveau mot de passe doit etre different de l'ancien",
        )

    _validate_password_strength(new_password, username=existing.username)

    repository.set_password(uuid, new_password)
    repository.set_force_password_change(uuid, False)
    logger.debug("Mot de passe change par l'utilisateur: %s", existing.username)
