"""LLM synthesis for deep_analyze report sections."""

from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List

logger = logging.getLogger(__name__)

ChatFn = Callable[[str, str], str]

_SECTION_SYSTEM = """\
You are a data analysis writer producing a professional report section.
Write 3-5 paragraphs of analytical markdown prose.
Use sub-headings (###) only if needed. Bold key terms. Use bullet lists for enumerated findings.
Be specific: reference actual numbers, column names, and patterns from the evidence.
Do not repeat the section name as a heading — begin directly with prose.\
"""

_FINDINGS_SYSTEM = """\
You are a data analysis writer producing a key findings summary.
Output a markdown bullet list of 5-8 concise, specific findings.
Each bullet should reference a concrete number or comparison from the analysis.
Start each bullet with a bold label, e.g. **Salary Premium:**.\
"""

_EXEC_SYSTEM = """\
You are a senior data analyst writing an executive summary for a data analysis report.
Write 2-3 paragraphs of clear, executive-level prose.
Highlight the most important patterns, anomalies, and business implications.
Be direct and specific — no hedging or filler.\
"""


def synthesize_section(
    section_name: str,
    description: str,
    angles: List[str],
    stats_evidence: str,
    chart_insights: List[str],
    chat_fn: ChatFn,
    domain_brief: str = "",
) -> str:
    system = _SECTION_SYSTEM
    if domain_brief:
        system += f"\n\nDomain context:\n{domain_brief}"
    angles_str = "\n".join(f"- {a}" for a in angles) if angles else "- general analysis"
    charts_str = "\n\n".join(chart_insights) if chart_insights else "(no charts rendered)"
    user = (
        f"Section: {section_name}\n"
        f"Description: {description}\n"
        f"Analysis angles to address:\n{angles_str}\n\n"
        f"Statistical evidence:\n{stats_evidence}\n\n"
        f"Chart insights:\n{charts_str}\n\n"
        "Write the section now."
    )
    try:
        return chat_fn(system, user)
    except Exception as e:
        logger.error("synthesize_section failed [%s]: %s", section_name, e)
        return f"*Section synthesis unavailable: {e}*"


def synthesize_key_findings(
    section_contents: List[Dict[str, Any]],
    chat_fn: ChatFn,
) -> str:
    sections_block = "\n\n".join(
        f"### {s['name']}\n{s['content']}" for s in section_contents if s.get("content")
    )
    if not sections_block:
        return "- *No analysis sections available.*"
    user = f"Analysis sections:\n\n{sections_block}\n\nList the key findings."
    try:
        return chat_fn(_FINDINGS_SYSTEM, user)
    except Exception as e:
        logger.error("synthesize_key_findings failed: %s", e)
        return "- *Key findings unavailable*"


def synthesize_executive_summary(
    dataset_name: str,
    section_contents: List[Dict[str, Any]],
    key_findings: str,
    chat_fn: ChatFn,
    domain_brief: str = "",
) -> str:
    system = _EXEC_SYSTEM
    if domain_brief:
        system += f"\n\nDomain context:\n{domain_brief}"
    sections_block = "\n\n".join(
        f"### {s['name']}\n{s['content']}" for s in section_contents if s.get("content")
    )
    user = (
        f"Dataset: {dataset_name}\n\n"
        f"Key findings:\n{key_findings}\n\n"
        f"Full analysis:\n{sections_block}\n\n"
        "Write the executive summary."
    )
    try:
        return chat_fn(system, user)
    except Exception as e:
        logger.error("synthesize_executive_summary failed: %s", e)
        return "*Executive summary unavailable*"
