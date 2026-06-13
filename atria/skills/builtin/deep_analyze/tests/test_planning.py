"""Planning phase: schema profile -> structured plan JSON with sections."""

from unittest.mock import MagicMock

import pytest

from atria.skills.builtin.deep_analyze.planning import PlanningError, run_planning


_VALID_PLAN = """{
  "summary": "small sales sample",
  "sections": [
    {
      "name": "Revenue by Region",
      "description": "How revenue varies across geographic regions.",
      "chart_names": ["regional_revenue"],
      "analysis_angles": ["total revenue", "regional mix", "outliers"]
    }
  ],
  "sub_tables": [
    {"name": "by_region", "sql": "CREATE TABLE t_by_region AS SELECT region, SUM(revenue) r FROM raw GROUP BY region", "why": "regional mix"}
  ],
  "charts": [
    {"name": "regional_revenue", "source_table": "t_by_region", "type": "bar",
     "x": "region", "y": ["r"], "title": "Revenue by region"}
  ]
}"""


def _fake_chat(responses: list[str]) -> MagicMock:
    m = MagicMock()
    m.side_effect = responses
    return m


def test_valid_plan_parses() -> None:
    plan = run_planning(
        {"file_name": "x.csv", "row_count": 3, "columns": []}, chat=_fake_chat([_VALID_PLAN])
    )
    assert plan["sub_tables"][0]["name"] == "by_region"
    assert plan["charts"][0]["type"] == "bar"
    assert plan["sections"][0]["name"] == "Revenue by Region"
    assert plan["sections"][0]["chart_names"] == ["regional_revenue"]


def test_parse_failure_then_success_retries_once() -> None:
    chat = _fake_chat(["not json at all", _VALID_PLAN])
    plan = run_planning({"file_name": "x.csv", "row_count": 3, "columns": []}, chat=chat)
    assert chat.call_count == 2
    assert plan["summary"] == "small sales sample"


def test_two_consecutive_failures_raise() -> None:
    chat = _fake_chat(["nope", "still nope"])
    with pytest.raises(PlanningError):
        run_planning({"file_name": "x.csv", "row_count": 3, "columns": []}, chat=chat)


def test_empty_sub_tables_rejected() -> None:
    no_tables = """{
      "summary": "x",
      "sections": [{"name": "S", "description": "d", "chart_names": [], "analysis_angles": []}],
      "sub_tables": [],
      "charts": [{"name": "c", "source_table": "t_x", "type": "bar", "x": "a", "y": ["b"], "title": "T"}]
    }"""
    with pytest.raises(PlanningError, match="no work"):
        run_planning(
            {"file_name": "x.csv", "row_count": 3, "columns": []}, chat=_fake_chat([no_tables])
        )


def test_missing_sections_rejected() -> None:
    no_sections = """{
      "summary": "x",
      "sub_tables": [{"name": "t", "sql": "CREATE TABLE t_t AS SELECT 1", "why": ""}],
      "charts": [{"name": "c", "source_table": "t_t", "type": "bar", "x": "a", "y": ["b"], "title": "T"}]
    }"""
    with pytest.raises(PlanningError, match="sections"):
        run_planning(
            {"file_name": "x.csv", "row_count": 3, "columns": []}, chat=_fake_chat([no_sections])
        )


def test_empty_sections_list_rejected() -> None:
    empty_sections = """{
      "summary": "x",
      "sections": [],
      "sub_tables": [{"name": "t", "sql": "CREATE TABLE t_t AS SELECT 1", "why": ""}],
      "charts": [{"name": "c", "source_table": "t_t", "type": "bar", "x": "a", "y": ["b"], "title": "T"}]
    }"""
    with pytest.raises(PlanningError, match="no work"):
        run_planning(
            {"file_name": "x.csv", "row_count": 3, "columns": []}, chat=_fake_chat([empty_sections])
        )
