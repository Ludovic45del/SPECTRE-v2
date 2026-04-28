"""Tests unitaires du `RequestIDMiddleware`.

Vérifie :
- Génération d'un request_id par défaut, propagation dans le header de
  réponse `X-Request-ID` et dans `LogContext`.
- Réutilisation d'un header upstream uniquement s'il matche le format
  autorisé (anti log/header injection).
- Enrichissement du `user_id` dans `process_view` après auth Django, et
  re-enrichissement après la vue (couvre l'auth DRF JWT).
- Nettoyage systématique de `LogContext` même si la vue lève.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from django.http import HttpResponse

from app.core.logging import LogContext
from app.core.middleware import RequestIDMiddleware


def _build_request(meta=None, user=None):
    return SimpleNamespace(META=meta or {}, user=user)


def _ok_response(_request):
    return HttpResponse("ok")


@pytest.fixture(autouse=True)
def _clear_log_context():
    LogContext.clear()
    yield
    LogContext.clear()


@pytest.mark.unit
class TestRequestIDExtraction:
    def test_generates_uuid_when_no_header(self):
        mw = RequestIDMiddleware(_ok_response)
        response = mw(_build_request())
        assert "X-Request-ID" in response
        assert len(response["X-Request-ID"]) == 16

    def test_reuses_valid_upstream_header(self):
        mw = RequestIDMiddleware(_ok_response)
        response = mw(_build_request(meta={"HTTP_X_REQUEST_ID": "abc-123_OK"}))
        assert response["X-Request-ID"] == "abc-123_OK"

    @pytest.mark.parametrize(
        "bad_value",
        [
            "x" * 65,  # trop long
            "has space",
            "drop\r\ntable",  # CRLF (header/log injection)
            "../../etc",  # tentative path traversal
            "<script>",  # XSS-like
            "",  # vide
        ],
    )
    def test_rejects_invalid_upstream_header(self, bad_value):
        mw = RequestIDMiddleware(_ok_response)
        response = mw(_build_request(meta={"HTTP_X_REQUEST_ID": bad_value}))
        assert response["X-Request-ID"] != bad_value
        assert len(response["X-Request-ID"]) == 16


@pytest.mark.unit
class TestLogContextPropagation:
    def test_request_id_injected_in_log_context_during_request(self):
        captured = {}

        def capture_response(_request):
            captured["request_id"] = LogContext.get("request_id")
            return HttpResponse("ok")

        mw = RequestIDMiddleware(capture_response)
        mw(_build_request(meta={"HTTP_X_REQUEST_ID": "trace-001"}))
        assert captured["request_id"] == "trace-001"

    def test_log_context_cleared_after_request(self):
        mw = RequestIDMiddleware(_ok_response)
        mw(_build_request())
        assert LogContext.get("request_id") is None

    def test_log_context_cleared_even_on_exception(self):
        def raising(_request):
            raise RuntimeError("boom")

        mw = RequestIDMiddleware(raising)
        with pytest.raises(RuntimeError):
            mw(_build_request())
        assert LogContext.get("request_id") is None
        assert LogContext.get("user_id") is None


@pytest.mark.unit
class TestUserIdEnrichment:
    def test_user_id_set_via_process_view_after_auth(self):
        authed_user = MagicMock(is_authenticated=True, id=42)
        request = _build_request(user=authed_user)
        mw = RequestIDMiddleware(_ok_response)

        mw.process_view(request, lambda r: None, (), {})

        assert LogContext.get("user_id") == 42

    def test_process_view_does_not_overwrite_with_anonymous(self):
        LogContext.set(user_id=42)
        anon = MagicMock(is_authenticated=False)
        request = _build_request(user=anon)
        mw = RequestIDMiddleware(_ok_response)

        mw.process_view(request, lambda r: None, (), {})

        # user_id préalable non écrasé par un AnonymousUser
        assert LogContext.get("user_id") == 42

    def test_user_id_resolved_post_view_for_drf_jwt(self, monkeypatch):
        # Simule le cas DRF JWT : `request.user` n'est résolu qu'au dispatch.
        # On capture les appels à LogContext.set pour observer le re-enrichissement
        # avant le clear final.
        calls: list[dict] = []
        original_set = LogContext.set.__func__  # unbound classmethod

        def spy_set(cls, **kwargs):
            calls.append(dict(kwargs))
            original_set(cls, **kwargs)

        monkeypatch.setattr(LogContext, "set", classmethod(spy_set))

        post_view_user = MagicMock(is_authenticated=True, id=99)

        def view_resolves_user(request):
            request.user = post_view_user
            return HttpResponse("ok")

        request = _build_request(user=MagicMock(is_authenticated=False))
        mw = RequestIDMiddleware(view_resolves_user)
        mw(request)

        # Deux appels attendus : le set initial puis le re-set post-view.
        assert calls[0].get("user_id") is None
        assert calls[-1] == {"user_id": 99}
