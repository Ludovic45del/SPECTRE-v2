"""Tests unitaires du `ForcePasswordChangeMiddleware`.

Vérifie :
- Bypass des requêtes preflight CORS (OPTIONS).
- Bypass des utilisateurs anonymes ou non authentifiés.
- Tolérance des utilisateurs sans profil (pas de crash).
- Whitelist `/api/v1/auth/*` même quand `force_password_change=True`.
- Blocage 403 sur les autres endpoints quand `force_password_change=True`.
"""

import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from django.http import HttpResponse

from app.core.middleware import ForcePasswordChangeMiddleware

OK_BODY = b"ok"


def _ok_response(_request):
    return HttpResponse(OK_BODY)


def _request(*, method="GET", path="/api/v1/users/", user=None):
    return SimpleNamespace(method=method, path=path, user=user)


@pytest.mark.unit
class TestForcePasswordChangeMiddleware:
    def test_options_preflight_is_never_blocked(self):
        user = MagicMock(is_authenticated=True)
        user.profile = MagicMock(force_password_change=True)
        mw = ForcePasswordChangeMiddleware(_ok_response)
        response = mw(_request(method="OPTIONS", user=user))
        assert response.status_code == 200

    def test_anonymous_user_is_never_blocked(self):
        anon = MagicMock(is_authenticated=False)
        mw = ForcePasswordChangeMiddleware(_ok_response)
        response = mw(_request(user=anon))
        assert response.status_code == 200

    def test_request_without_user_attribute_is_passthrough(self):
        # `user` non défini sur la request : ne doit pas crasher.
        mw = ForcePasswordChangeMiddleware(_ok_response)
        response = mw(SimpleNamespace(method="GET", path="/api/v1/users/"))
        assert response.status_code == 200

    def test_user_without_profile_is_passthrough(self):
        # Simule RelatedObjectDoesNotExist : `getattr(user, "profile", None)`
        # doit retourner None et le middleware ne doit pas bloquer.
        class UserNoProfile:
            is_authenticated = True

            def __getattr__(self, item):
                if item == "profile":
                    raise AttributeError(item)
                raise AttributeError(item)

        mw = ForcePasswordChangeMiddleware(_ok_response)
        response = mw(_request(user=UserNoProfile()))
        assert response.status_code == 200

    def test_user_with_force_password_change_blocked_on_business_endpoint(self):
        user = MagicMock(is_authenticated=True)
        user.profile = MagicMock(force_password_change=True)
        mw = ForcePasswordChangeMiddleware(_ok_response)

        response = mw(_request(path="/api/v1/users/", user=user))

        assert response.status_code == 403
        body = json.loads(response.content)
        assert body["code"] == "FORCE_PASSWORD_CHANGE"

    @pytest.mark.parametrize(
        "path",
        [
            "/api/v1/auth/login/",
            "/api/v1/auth/refresh/",
            "/api/v1/auth/change-password/",
            "/api/v1/auth/me/",
        ],
    )
    def test_auth_endpoints_are_whitelisted(self, path):
        user = MagicMock(is_authenticated=True)
        user.profile = MagicMock(force_password_change=True)
        mw = ForcePasswordChangeMiddleware(_ok_response)

        response = mw(_request(path=path, user=user))

        assert response.status_code == 200

    def test_user_with_change_done_is_not_blocked(self):
        user = MagicMock(is_authenticated=True)
        user.profile = MagicMock(force_password_change=False)
        mw = ForcePasswordChangeMiddleware(_ok_response)

        response = mw(_request(path="/api/v1/users/", user=user))

        assert response.status_code == 200
