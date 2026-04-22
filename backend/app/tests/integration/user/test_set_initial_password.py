"""Tests d'intégration du endpoint `POST /auth/set-initial-password/` et du
cycle complet création → activation, reset → activation.
"""

import json

import pytest
from django.contrib.auth.models import Group, User
from django.test import Client

from app.repository.user.models.user_profile_entity import UserProfileEntity


@pytest.fixture
def admin_user(db):
    Group.objects.get_or_create(name="admin")
    Group.objects.get_or_create(name="operateur")
    Group.objects.get_or_create(name="lecteur")
    user = User.objects.create_user(
        username="admin_flow", password="AdminStrongPass123!"
    )
    user.groups.add(Group.objects.get(name="admin"))
    UserProfileEntity.objects.create(
        user=user, role="chef_labo", force_password_change=False
    )
    return user


@pytest.fixture
def admin_client(admin_user):
    client = Client()
    client.force_login(admin_user)
    return client


@pytest.mark.integration
@pytest.mark.django_db
class TestSetInitialPasswordFlow:
    """Cycle complet : admin crée un utilisateur puis l'utilisateur active son compte."""

    def test_create_user_then_activate_sets_password_and_clears_force_flag(
        self, admin_client
    ):
        # Étape 1 : admin crée l'utilisateur
        create_resp = admin_client.post(
            "/api/v1/users/",
            data=json.dumps({"username": "new_user_flow", "role": "iec"}),
            content_type="application/json",
        )
        assert create_resp.status_code == 201
        activation_url = create_resp.json()["activation_url"]
        token = activation_url.split("token=", 1)[1]

        # Étape 2 : l'utilisateur consomme le lien (endpoint public)
        anon = Client()
        activate_resp = anon.post(
            "/api/v1/auth/set-initial-password/",
            data=json.dumps({"token": token, "new_password": "MyBrandNewP4ss!word"}),
            content_type="application/json",
        )
        assert activate_resp.status_code == 200

        user = User.objects.get(username="new_user_flow")
        assert user.check_password("MyBrandNewP4ss!word")
        assert user.profile.force_password_change is False

    def test_activate_consumes_token_single_use(self, admin_client):
        create_resp = admin_client.post(
            "/api/v1/users/",
            data=json.dumps({"username": "single_use_flow", "role": "iec"}),
            content_type="application/json",
        )
        token = create_resp.json()["activation_url"].split("token=", 1)[1]

        anon = Client()
        r1 = anon.post(
            "/api/v1/auth/set-initial-password/",
            data=json.dumps({"token": token, "new_password": "Str0ngP4ss!word"}),
            content_type="application/json",
        )
        assert r1.status_code == 200

        r2 = anon.post(
            "/api/v1/auth/set-initial-password/",
            data=json.dumps({"token": token, "new_password": "An0therP4ss!word"}),
            content_type="application/json",
        )
        assert r2.status_code == 400

    def test_activate_rejects_weak_password(self, admin_client):
        create_resp = admin_client.post(
            "/api/v1/users/",
            data=json.dumps({"username": "weak_pw_flow", "role": "iec"}),
            content_type="application/json",
        )
        token = create_resp.json()["activation_url"].split("token=", 1)[1]

        anon = Client()
        resp = anon.post(
            "/api/v1/auth/set-initial-password/",
            data=json.dumps({"token": token, "new_password": "password"}),
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_activate_rejects_invalid_token(self, db):
        anon = Client()
        resp = anon.post(
            "/api/v1/auth/set-initial-password/",
            data=json.dumps(
                {"token": "not-a-signed-token", "new_password": "Str0ngP4ss!word"}
            ),
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_reset_password_flow_invalidates_and_activates(self, admin_client, db):
        # Crée un utilisateur avec un mot de passe initial connu
        operateur_group, _ = Group.objects.get_or_create(name="operateur")
        existing = User.objects.create_user(
            username="reset_target", password="OriginalP4ss!word"
        )
        existing.groups.add(operateur_group)
        profile = UserProfileEntity.objects.create(
            user=existing, role="iec", force_password_change=False
        )

        # Admin déclenche un reset
        reset_resp = admin_client.post(f"/api/v1/users/{profile.uuid}/reset-password/")
        assert reset_resp.status_code == 200
        token = reset_resp.json()["activation_url"].split("token=", 1)[1]

        # L'ancien mot de passe est immédiatement invalide
        existing.refresh_from_db()
        assert not existing.check_password("OriginalP4ss!word")

        # L'utilisateur consomme le lien pour choisir un nouveau mot de passe
        anon = Client()
        activate_resp = anon.post(
            "/api/v1/auth/set-initial-password/",
            data=json.dumps({"token": token, "new_password": "NewReset!P4ssw0rd"}),
            content_type="application/json",
        )
        assert activate_resp.status_code == 200
        existing.refresh_from_db()
        assert existing.check_password("NewReset!P4ssw0rd")
