"""Tests d'integration pour /api/v1/users/lookup/.

Endpoint dedie aux dropdowns d'operateurs : retourne les UserProfile filtres
par role et is_active. Accessible a tout utilisateur authentifie.
"""

import pytest
from django.contrib.auth.models import User

from app.repository.user.models.user_profile_entity import UserProfileEntity


def _make_profile(username, role, is_active=True, first_name="", last_name=""):
    user, _ = User.objects.get_or_create(
        username=username,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "is_active": is_active,
        },
    )
    user.first_name = first_name
    user.last_name = last_name
    user.is_active = is_active
    user.save()
    profile, _ = UserProfileEntity.objects.get_or_create(user=user, defaults={"role": role})
    profile.role = role
    profile.save(update_fields=["role"])
    return profile


@pytest.mark.integration
@pytest.mark.django_db
class TestUserLookupEndpoint:
    """GET /api/v1/users/lookup/"""

    def test_requires_authentication(self, db):
        from django.test import Client

        client = Client()
        response = client.get("/api/v1/users/lookup/")
        assert response.status_code in (401, 403)

    def test_returns_active_users_by_default(self, api_client):
        _make_profile("alice", "metrologue", first_name="Alice", last_name="Martin")
        _make_profile("bob", "iec", is_active=False, first_name="Bob", last_name="Petit")

        response = api_client.get("/api/v1/users/lookup/")

        assert response.status_code == 200
        data = response.json()
        usernames = [u["username"] for u in data]
        assert "alice" in usernames
        assert "bob" not in usernames  # is_active=False filtre par defaut

    def test_filter_by_single_role(self, api_client):
        _make_profile("met1", "metrologue")
        _make_profile("iec1", "iec")

        response = api_client.get("/api/v1/users/lookup/?role=metrologue")

        assert response.status_code == 200
        data = response.json()
        roles = {u["role"] for u in data}
        assert roles == {"metrologue"}

    def test_filter_by_multiple_roles(self, api_client):
        _make_profile("met1", "metrologue")
        _make_profile("chef1", "chef_labo")
        _make_profile("iec1", "iec")

        response = api_client.get("/api/v1/users/lookup/?role=metrologue&role=chef_labo")

        assert response.status_code == 200
        data = response.json()
        roles = {u["role"] for u in data}
        assert roles == {"metrologue", "chef_labo"}

    def test_invalid_role_is_ignored(self, api_client):
        """Un role inconnu ne doit pas casser la requete (filtre defensif)."""
        _make_profile("met1", "metrologue")
        _make_profile("iec1", "iec")

        response = api_client.get("/api/v1/users/lookup/?role=fake_role")

        assert response.status_code == 200
        # Aucun role valide fourni -> tous les users actifs.
        assert {u["role"] for u in response.json()} >= {"metrologue", "iec"}

    def test_payload_only_exposes_safe_fields(self, api_client):
        _make_profile("met1", "metrologue", first_name="Alice", last_name="Martin")

        response = api_client.get("/api/v1/users/lookup/?role=metrologue")
        data = response.json()
        assert data, "expected at least one user"
        keys = set(data[0].keys())
        # Annuaire : identite + role + is_active + coordonnees pratiques.
        assert keys == {
            "uuid",
            "username",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "laboratoire",
            "service",
            "numero",
            "bureau",
        }
        # Pas de fuite des champs sensibles.
        assert "password" not in keys
        assert "dashboard_preferences" not in keys
        assert "force_password_change" not in keys

    def test_is_active_false_returns_inactive_users(self, api_client):
        _make_profile("met1", "metrologue", is_active=True)
        _make_profile("met2", "metrologue", is_active=False)

        response = api_client.get("/api/v1/users/lookup/?role=metrologue&is_active=false")
        data = response.json()
        usernames = [u["username"] for u in data]
        # is_active=false retourne uniquement les inactifs
        assert "met2" in usernames
        assert "met1" not in usernames
