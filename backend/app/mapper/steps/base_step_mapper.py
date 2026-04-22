"""Mapper BaseStep - Fonctions utilitaires pour les mappers de steps.

Ce module fournit des fonctions utilitaires de parsing de dates
pour les mappers de steps.
"""

from datetime import date, datetime
from typing import Any


def parse_date_from_api(value: Any) -> date | None:
    """Parse une date depuis une chaîne ISO envoyée par l'API.

    Args:
        value: La valeur à parser (str, date, ou None)

    Returns:
        Un objet date ou None
    """
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        return date.fromisoformat(value)
    return None


def parse_datetime_from_api(value: Any) -> datetime | None:
    """Parse une datetime depuis une chaîne ISO envoyée par l'API.

    Gère le format ISO 8601 avec timezone 'Z' (UTC).

    Args:
        value: La valeur à parser (str, datetime, ou None)

    Returns:
        Un objet datetime ou None
    """
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return None
