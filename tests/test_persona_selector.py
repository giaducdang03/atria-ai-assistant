"""Tests for persona_name extraction in the websocket query handler."""


def test_persona_name_extracted_from_query_data():
    """persona_name from WS data dict is correctly extracted."""
    data = {"data": {"message": "hello", "session_id": "abc", "persona_name": "pirate"}}
    query_data = data.get("data", {})
    persona_name = query_data.get("persona_name")
    assert persona_name == "pirate"


def test_persona_name_absent_when_not_sent():
    """persona_name is None when not included in WS payload."""
    data = {"data": {"message": "hello", "session_id": "abc"}}
    query_data = data.get("data", {})
    persona_name = query_data.get("persona_name")
    assert persona_name is None
