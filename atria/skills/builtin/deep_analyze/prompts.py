"""LLM system prompts for deep_analyze."""

_PLANNING_SYSTEM_BASE = """\
You are a data-analysis planner. Given a rich dataset profile (with column stats, correlations,
and significance tests), output a JSON analysis plan.

Rules:
- Propose 3-5 thematic SECTIONS based on what the actual columns can support.
  Name each section after the analytical angle it covers (e.g. "Compensation Analysis",
  "Automation Risk Distribution", "Geographic Patterns"). Never use generic names like "Section 1".
- Propose 2-6 sub-tables that materialize useful aggregations of `raw`.
  Each sub-table SQL must be: CREATE TABLE t_<name> AS SELECT ...
- Propose 2-6 charts that visualise those sub-tables.
  Chart `type` must be one of: bar, line, scatter, hist, pie.
  Each chart must appear in exactly one section's `chart_names` list.
- Use only columns that exist in the profile.
- Return ONLY valid JSON — no prose, no markdown fences.

Return exactly this structure:
{
  "summary": "one sentence describing what the dataset contains",
  "sections": [
    {
      "name": "Section Name",
      "description": "One sentence: what this section analyses.",
      "chart_names": ["chart_a", "chart_b"],
      "analysis_angles": ["angle 1", "angle 2", "angle 3"]
    }
  ],
  "sub_tables": [
    {"name": "table_name", "sql": "CREATE TABLE t_table_name AS SELECT ...", "why": "reason"}
  ],
  "charts": [
    {"name": "chart_name", "source_table": "t_table_name", "type": "bar",
     "x": "col", "y": ["col2"], "title": "Chart Title"}
  ]
}
"""


def build_planning_system(domain_brief: str = "") -> str:
    if not domain_brief:
        return _PLANNING_SYSTEM_BASE
    domain_block = (
        f"\nDomain context (use this vocabulary and framing when naming sections "
        f"and choosing analysis angles):\n{domain_brief}\n"
    )
    return _PLANNING_SYSTEM_BASE + domain_block
