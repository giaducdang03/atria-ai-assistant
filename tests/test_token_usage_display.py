"""Tests for per-conversation token usage exposed to the web UI.

Covers two seams added for the TopBar token pill:
  * WebUICallback.on_cost_update broadcasts input/output/total tokens.
  * The /resume route helper extracts persisted token totals from a session's
    cost_tracking metadata.
"""

from __future__ import annotations

from types import SimpleNamespace

from atria.web.web_ui_callback import WebUICallback
from atria.web.protocol import WSMessageType
from atria.web.routes.sessions import _token_usage_from_session


def _make_callback() -> tuple[WebUICallback, list]:
    """Build a WebUICallback whose broadcasts are captured into a list."""
    cb = WebUICallback(
        ws_manager=object(),
        loop=object(),
        session_id="abc123",
        state=object(),
    )
    captured: list = []
    cb._broadcast = captured.append  # type: ignore[method-assign]
    return cb, captured


class TestOnCostUpdateBroadcast:
    def test_includes_token_fields_when_provided(self) -> None:
        cb, captured = _make_callback()

        cb.on_cost_update(0.0123, input_tokens=12_000, output_tokens=4_500)

        assert len(captured) == 1
        msg = captured[0]
        assert msg["type"] == WSMessageType.STATUS_UPDATE
        data = msg["data"]
        assert data["session_cost"] == 0.0123
        assert data["session_id"] == "abc123"
        assert data["input_tokens"] == 12_000
        assert data["output_tokens"] == 4_500
        assert data["total_tokens"] == 16_500  # input + output

    def test_omits_token_fields_when_not_provided(self) -> None:
        cb, captured = _make_callback()

        cb.on_cost_update(0.05)

        data = captured[0]["data"]
        assert data["session_cost"] == 0.05
        assert "input_tokens" not in data
        assert "output_tokens" not in data
        assert "total_tokens" not in data


class TestTokenUsageFromSession:
    def test_reads_persisted_cost_tracking(self) -> None:
        session = SimpleNamespace(
            metadata={
                "cost_tracking": {
                    "total_cost_usd": 0.42,
                    "total_input_tokens": 100_000,
                    "total_output_tokens": 25_000,
                    "api_call_count": 7,
                }
            }
        )

        result = _token_usage_from_session(session)

        assert result == {
            "session_cost": 0.42,
            "input_tokens": 100_000,
            "output_tokens": 25_000,
            "total_tokens": 125_000,
        }

    def test_defaults_to_zero_without_cost_tracking(self) -> None:
        session = SimpleNamespace(metadata={})
        result = _token_usage_from_session(session)
        assert result == {
            "session_cost": 0.0,
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
        }

    def test_handles_none_session(self) -> None:
        result = _token_usage_from_session(None)
        assert result["total_tokens"] == 0
        assert result["session_cost"] == 0.0
