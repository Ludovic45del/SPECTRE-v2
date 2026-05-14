"""Conftest partagé pour les tests d'intégration.

Fournit des fixtures autouse pour seeder les tables référentielles
nécessaires aux tests qui créent des entités directement.
"""

import pytest
from django.contrib.auth.models import Group, User
from django.core.cache import cache
from django.test import Client


@pytest.fixture(autouse=True)
def _reset_throttle_cache():
    """Empêche les throttles DRF de leak entre tests.

    Les PK utilisateurs peuvent être réassignées après rollback transactionnel ;
    le ScopedRateThrottle utilise la PK dans la clé de cache ⇒ sans reset, la
    N+1e requête d'un test est vue comme une suite des précédentes → 429 intempestif.
    """
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client(db):
    """Client Django authentifié avec rôle operateur pour les tests API."""
    user, created = User.objects.get_or_create(username="testuser")
    if created:
        user.set_password("testpass")
        user.save()
    group, _ = Group.objects.get_or_create(name="operateur")
    user.groups.add(group)
    client = Client()
    client.force_login(user)
    return client


@pytest.fixture
def admin_api_client(db):
    """Client Django authentifié avec rôle admin pour les tests nécessitant des droits élevés."""
    user, created = User.objects.get_or_create(username="adminuser")
    if created:
        user.set_password("adminpass")
        user.save()
    group, _ = Group.objects.get_or_create(name="admin")
    user.groups.add(group)
    client = Client()
    client.force_login(user)
    return client


@pytest.fixture(autouse=True)
def seed_reference_data(db):
    """Seed les tables référentielles pour les tests d'intégration.

    Les migrations seed déjà les données Campaign (types, status, installations).
    Ici on seed les données FSEC (status, category, rack) qui n'ont pas de migration seed.
    """
    from app.repository.fsec.models.fsec_category_entity import FsecCategoryEntity
    from app.repository.fsec.models.fsec_rack_entity import FsecRackEntity
    from app.repository.fsec.models.fsec_status_entity import FsecStatusEntity

    # FSEC Status (0-13 for all workflow categories)
    for id_, label, color in [
        (0, "Design", "#c3c3c3"),
        (1, "Assemblage", "#ecce18"),
        (2, "Métrologie", "#7a8ce0"),
        (3, "Scellement", "#4caf50"),
        (4, "Photos", "#9c27b0"),
        (5, "Utilisable", "#00bcd4"),
        (6, "Sur installation", "#ff9800"),
        (7, "Tirée", "#795548"),
        (8, "HS", "#f44336"),
        (9, "Remplissage BP", "#3f51b5"),
        (10, "Étanchéité", "#009688"),
        (11, "Perméation", "#e91e63"),
        (12, "Repressurisation", "#607d8b"),
        (13, "Dépressurisation", "#ff5722"),
    ]:
        FsecStatusEntity.objects.get_or_create(
            id=id_, defaults={"label": label, "color": color}
        )

    # FSEC Category
    for id_, label in [
        (0, "Sans gaz"),
        (1, "BP"),
        (2, "BP + HP"),
        (3, "Perméation + HP"),
        (4, "Perméation + BP + HP"),
    ]:
        FsecCategoryEntity.objects.get_or_create(id=id_, defaults={"label": label})

    # FSEC Rack
    for id_, label in [
        (0, "Rack A"),
        (1, "Rack B"),
        (2, "Rack C"),
    ]:
        FsecRackEntity.objects.get_or_create(id=id_, defaults={"label": label})
