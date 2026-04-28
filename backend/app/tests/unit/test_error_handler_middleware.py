"""Tests unitaires du `ErrorHandlerMiddleware`.

Vérifie le mapping exception -> (status, code) et l'enrichissement du
code d'erreur en DEBUG vs prod.
"""

import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.core.middleware import ErrorHandlerMiddleware
from app.domain.exceptions import (
    ConflictException,
    DomainException,
    InvalidDataException,
    NotFoundException,
    ValidationException,
)


def _passthrough(_request):
    return None


def _payload(response):
    return json.loads(response.content)


@pytest.mark.unit
class TestExceptionMapping:
    def setup_method(self):
        self.mw = ErrorHandlerMiddleware(_passthrough)
        self.request = SimpleNamespace()

    def test_not_found_returns_404(self):
        with patch("app.core.middleware.settings.DEBUG", False):
            response = self.mw.process_exception(self.request, NotFoundException("Campaign", "abc"))
        assert response.status_code == 404
        body = _payload(response)
        assert body["code"] == "NOT_FOUND"
        assert body["type"] == "NotFoundException"

    def test_conflict_returns_409(self):
        with patch("app.core.middleware.settings.DEBUG", False):
            response = self.mw.process_exception(self.request, ConflictException("name", "Foo"))
        assert response.status_code == 409
        assert _payload(response)["code"] == "CONFLICT"

    def test_validation_returns_400(self):
        with patch("app.core.middleware.settings.DEBUG", False):
            response = self.mw.process_exception(self.request, ValidationException("year", "must be positive"))
        assert response.status_code == 400
        assert _payload(response)["code"] == "VALIDATION_ERROR"

    def test_invalid_data_returns_400(self):
        with patch("app.core.middleware.settings.DEBUG", False):
            response = self.mw.process_exception(self.request, InvalidDataException("bad payload"))
        assert response.status_code == 400
        assert _payload(response)["code"] == "INVALID_DATA"

    def test_unknown_domain_exception_returns_500(self):
        class CustomDomain(DomainException):
            pass

        with patch("app.core.middleware.settings.DEBUG", False):
            response = self.mw.process_exception(self.request, CustomDomain("oops"))
        assert response.status_code == 500
        assert _payload(response)["code"] == "DOMAIN_ERROR"

    def test_unhandled_exception_returns_500_generic_message(self):
        response = self.mw.process_exception(self.request, RuntimeError("boom"))
        assert response.status_code == 500
        body = _payload(response)
        # Le message ne doit JAMAIS exposer le détail de l'erreur interne.
        assert body["error"] == "Internal server error"
        assert body["code"] == "INTERNAL_SERVER_ERROR"

    def test_json_decode_error_returns_400(self):
        response = self.mw.process_exception(self.request, json.JSONDecodeError("Expecting value", "doc", 0))
        assert response.status_code == 400
        assert _payload(response)["code"] == "INVALID_JSON"


@pytest.mark.unit
class TestErrorCodeEnrichment:
    def setup_method(self):
        self.mw = ErrorHandlerMiddleware(_passthrough)
        self.request = SimpleNamespace()

    def test_debug_enriches_not_found_with_resource(self):
        with patch("app.core.middleware.settings.DEBUG", True):
            response = self.mw.process_exception(self.request, NotFoundException("Campaign", "abc"))
        assert _payload(response)["code"] == "CAMPAIGN_NOT_FOUND"

    def test_debug_enriches_conflict_with_field(self):
        with patch("app.core.middleware.settings.DEBUG", True):
            response = self.mw.process_exception(self.request, ConflictException("name/year", "Foo/2025"))
        assert _payload(response)["code"] == "CONFLICT_NAME_YEAR"

    def test_debug_enriches_validation_with_field(self):
        with patch("app.core.middleware.settings.DEBUG", True):
            response = self.mw.process_exception(self.request, ValidationException("year", "must be positive"))
        assert _payload(response)["code"] == "VALIDATION_ERROR_YEAR"

    def test_prod_does_not_enrich_to_avoid_leaking_schema(self):
        with patch("app.core.middleware.settings.DEBUG", False):
            response = self.mw.process_exception(self.request, NotFoundException("Campaign", "abc"))
        # Code générique en prod, pas de leak du nom de la ressource.
        assert _payload(response)["code"] == "NOT_FOUND"


@pytest.mark.unit
class TestPassthrough:
    def test_call_does_not_intercept_normal_responses(self):
        sentinel = object()
        mw = ErrorHandlerMiddleware(lambda _request: sentinel)
        assert mw(SimpleNamespace()) is sentinel
