"""Tests unitaires du `LogContextFilter`.

Garantit le contrat clé : les valeurs posées dans `LogContext` sont
copiées sur chaque `LogRecord` afin que `StructuredFormatter` puisse
les sérialiser. Sans ce filtre, request_id / user_id n'apparaîtraient
jamais dans les logs.
"""

import json
import logging

import pytest

from app.core.logging import LogContext, LogContextFilter, StructuredFormatter


@pytest.fixture(autouse=True)
def _clear_log_context():
    LogContext.clear()
    yield
    LogContext.clear()


def _record(message="msg"):
    return logging.LogRecord(
        name="app.test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg=message,
        args=(),
        exc_info=None,
    )


@pytest.mark.unit
class TestLogContextFilter:
    def test_injects_request_id_from_context(self):
        LogContext.set(request_id="trace-1", user_id=42)
        record = _record()
        LogContextFilter().filter(record)

        assert record.request_id == "trace-1"
        assert record.user_id == 42

    def test_does_not_overwrite_existing_attribute_on_record(self):
        LogContext.set(request_id="trace-1")
        record = _record()
        record.request_id = "explicit"
        LogContextFilter().filter(record)

        assert record.request_id == "explicit"

    def test_filter_returns_true_to_keep_record(self):
        record = _record()
        assert LogContextFilter().filter(record) is True

    def test_end_to_end_with_structured_formatter(self):
        LogContext.set(request_id="trace-99", user_id=7)
        record = _record("hello")
        LogContextFilter().filter(record)
        payload = json.loads(StructuredFormatter().format(record))

        assert payload["request_id"] == "trace-99"
        assert payload["user_id"] == 7
        assert payload["message"] == "hello"

    def test_no_context_means_no_extra_fields(self):
        record = _record()
        LogContextFilter().filter(record)
        payload = json.loads(StructuredFormatter().format(record))

        assert "request_id" not in payload
        assert "user_id" not in payload
