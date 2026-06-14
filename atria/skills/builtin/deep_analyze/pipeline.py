"""Background analyze pipeline."""

from __future__ import annotations

import logging
import sqlite3
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

from atria.core.skill_tools import SkillToolContext

from .dataloader import load_to_sqlite
from .jobs import AnalyzeJob, AnalyzeJobRegistry
from .persistence import default_reporter
from .profiler import build_rich_profile

logger = logging.getLogger(__name__)

PlannerFn = Callable[[Dict[str, Any]], Dict[str, Any]]
ExtractorFn = Callable[[AnalyzeJob, Dict[str, Any]], None]
SynthesizerFn = Callable[[Dict[str, Any], str, List[str]], str]
PostSynthesizerFn = Callable[[AnalyzeJob], Tuple[str, str]]
ReporterFn = Callable[[AnalyzeJob], str]
EnricherFn = Callable[[str, str], Dict[str, Any]]
PlanModifierFn = Callable[[Dict[str, Any], str], Dict[str, Any]]


def _emit(ctx: SkillToolContext, event: Dict[str, Any]) -> None:
    if ctx.broadcaster is None:
        return
    try:
        ctx.broadcaster(event)
    except Exception as e:
        logger.warning("progress callback failed: %s", e)


def _check_cancel(ctx: SkillToolContext, job: AnalyzeJob) -> bool:
    if job.cancel_event.is_set():
        job.status = "cancelled"
        _emit(ctx, {"type": "analyze.cancelled", "job_id": job.job_id})
        return True
    return False


def _infer_topic(filename: str) -> str:
    import re  # noqa: PLC0415
    stem = Path(filename).stem
    return re.sub(r"[_\-]+", " ", stem).strip()



def run_job(
    ctx: SkillToolContext,
    registry: AnalyzeJobRegistry,
    job: AnalyzeJob,
    planner: PlannerFn,
    extractor: ExtractorFn,
    synthesizer: SynthesizerFn,
    post_synthesizer: PostSynthesizerFn,
    chat_fn: Callable[[str, str], str],
    reporter: Optional[ReporterFn] = None,
    enricher: Optional[EnricherFn] = None,
    plan_modifier: Optional[PlanModifierFn] = None,
) -> None:
    try:
        # ── load ─────────────────────────────────────────────────────────────
        job.status = "loading"
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "load", "status": "start"})
        rows = load_to_sqlite(Path(job.file_path), job.dir / "data.db")
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "load", "status": "done", "rows": rows})
        if _check_cancel(ctx, job):
            return

        # ── profile ───────────────────────────────────────────────────────────
        job.status = "profiling"
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "profile", "status": "start"})
        job.profile_rich = build_rich_profile(job.dir / "data.db", file_name=Path(job.file_path).name)
        job.profile = job.profile_rich
        job._profile_ready.set()
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "profile", "status": "done"})
        if _check_cancel(ctx, job):
            return

        # ── enrich (after profile so column names inform the topic) ──────────
        job.status = "enriching"
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "enrich", "status": "start"})
        if enricher is not None:
            try:
                col_names = [c["name"] for c in job.profile_rich.get("columns", [])][:20]
                col_str = ", ".join(col_names) if col_names else _infer_topic(Path(job.file_path).name)
                topic = f"{_infer_topic(Path(job.file_path).name)} analysis"
                context = (job.domain_context + f"; columns: {col_str}").lstrip("; ") if col_str else job.domain_context
                result = enricher(topic, context)
                job.domain_brief = result.get("summary", "") or ""
            except Exception as _enrich_err:
                logger.warning("domain enrichment failed (continuing): %s", _enrich_err)
                job.domain_brief = ""
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "enrich", "status": "done"})
        if _check_cancel(ctx, job):
            return

        # ── plan ──────────────────────────────────────────────────────────────
        job.status = "planning"
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "plan", "status": "start"})
        job.plan = planner(job.profile_rich)
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "plan", "status": "done",
                    "sub_tables": len(job.plan["sub_tables"]),
                    "charts": len(job.plan["charts"]),
                    "sections": len(job.plan.get("sections", []))})
        if _check_cancel(ctx, job):
            return

        # ── plan review (blocks until user accepts) ───────────────────────────
        if ctx.review_callback is not None:
            import uuid  # noqa: PLC0415
            while True:
                request_id = uuid.uuid4().hex[:12]
                result = ctx.review_callback(job.job_id, request_id, {
                    "type": "analyze.plan_ready",
                    "job_id": job.job_id,
                    "plan": job.plan,
                    "request_id": request_id,
                })
                action = result.get("action", "accept")
                if action == "modify":
                    if plan_modifier is not None:
                        instructions = (result.get("instructions") or "").strip()
                        if instructions:
                            try:
                                job.plan = plan_modifier(job.plan, instructions)
                            except Exception as _mod_err:
                                logger.error("plan_modifier failed: %s — keeping previous plan", _mod_err)
                    else:
                        logger.warning("plan_modifier not wired — ignoring modify request, re-prompting")
                    # continue loop so review fires again
                elif action == "regenerate":
                    try:
                        job.plan = planner(job.profile_rich)
                    except Exception as _regen_err:
                        logger.error("plan regeneration failed: %s — keeping previous plan", _regen_err)
                else:
                    break
                if _check_cancel(ctx, job):
                    return

        job.sections = [dict(s) for s in job.plan.get("sections", [])]

        # ── extract + stream chart data ───────────────────────────────────────
        job.status = "extracting"
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "extract", "status": "start"})
        job.sub_tables = _fanout_extract(ctx, registry, job, extractor)
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "extract", "status": "done"})
        if _check_cancel(ctx, job):
            return

        # ── render charts + stream insight per chart ──────────────────────────
        _stats_evidence = _build_stats_evidence(job)
        job.charts = _fanout_render_charts(
            ctx, registry, job,
            stats_evidence=_stats_evidence,
            chat_fn=chat_fn,
            domain_brief=job.domain_brief,
        )
        if _check_cancel(ctx, job):
            return

        # ── synthesize sections ───────────────────────────────────────────────
        job.status = "synthesizing"
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "synthesize", "status": "start"})
        _chart_insights_by_section = _group_chart_insights(job)
        _fanout_synthesize(ctx, registry, job, synthesizer, _chart_insights_by_section)
        key_findings, exec_summary = post_synthesizer(job)
        job.key_findings = key_findings
        job.exec_summary = exec_summary
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "synthesize", "status": "done"})
        if _check_cancel(ctx, job):
            return

        # ── report ────────────────────────────────────────────────────────────
        job.status = "reporting"
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "report", "status": "start"})
        fn = reporter or default_reporter
        job.report_path = fn(job)
        _emit(ctx, {"type": "analyze.phase", "job_id": job.job_id, "phase": "report", "status": "done"})
        _emit(ctx, {"type": "analyze.report", "job_id": job.job_id, "pdf_path": job.report_path})

        job.status = "done"
        _emit(ctx, {"type": "analyze.done", "job_id": job.job_id})

        # ── final agent message ────────────────────────────────────────────────
        _final_msg = _build_final_message(job)
        _emit(ctx, {"type": "analyze.agent_message", "job_id": job.job_id, "content": _final_msg})

        if ctx.on_analyze_done is not None:
            try:
                # Build lookup: chart name → spec (for title/sql)
                _spec_by_name = {s.get("name", ""): s for s in job.plan.get("charts", [])}
                _sql_by_table = {t["name"]: t.get("sql", "") for t in job.plan.get("sub_tables", [])}
                _chart_meta = [
                    {
                        "name": c["name"],
                        "title": _spec_by_name.get(c["name"], {}).get("title", c["name"]),
                        "png_path": c.get("png_path"),
                        "insight_md": c.get("insight_md", ""),
                        "sql": _sql_by_table.get(
                            _spec_by_name.get(c["name"], {}).get("source_table", "").removeprefix("t_"), ""
                        ),
                    }
                    for c in job.charts
                    if c.get("status") == "done" and c.get("png_path")
                ]
                ctx.on_analyze_done({
                    "type": "deep_analyze",
                    "job_id": job.job_id,
                    "file_name": Path(job.file_path).name,
                    "da_status": "done",
                    "da_report_path": job.report_path,
                    "da_subtables": job.sub_tables,
                    "da_charts": _chart_meta,
                    "da_agent_message": _final_msg,
                    "da_phases": {p: "done" for p in
                                  ["load", "profile", "enrich", "plan", "extract", "synthesize", "report"]},
                })
            except Exception as _save_err:
                logger.warning("on_analyze_done callback failed: %s", _save_err)

    except Exception as e:
        logger.exception("deep_analyze job failed: %s", e)
        failed_phase = job.status
        job.status = "failed"
        job.error = str(e)
        job._profile_ready.set()  # unblock engine.deep_analyze wait on failure
        _emit(ctx, {"type": "analyze.failed", "job_id": job.job_id, "phase": failed_phase, "error": str(e)})
    finally:
        job._done_event.set()


def _build_stats_evidence(job: AnalyzeJob) -> str:
    """Format the rich profile as a markdown evidence string."""
    profile = job.profile_rich if job.profile_rich else job.profile
    lines: List[str] = []
    cols = profile.get("columns", [])
    if cols:
        lines.append("**Column Statistics:**")
        for col in cols:
            dtype = col.get("dtype", "?")
            if dtype in {"int", "float"}:
                parts = [f"type={dtype}"]
                if col.get("mean") is not None:
                    parts.append(f"mean={col['mean']:.2f}")
                if col.get("outlier_count") is not None:
                    parts.append(f"outliers={col['outlier_count']}")
                if col.get("skewness") is not None:
                    parts.append(f"skew={col['skewness']:.2f}")
                if col.get("is_bimodal"):
                    parts.append("bimodal=yes")
                lines.append(f"- **{col['name']}** ({', '.join(parts)})")
            else:
                tvs = col.get("top_values", [])[:3]
                top_str = ", ".join(f"{v['value']}({v['count']})" for v in tvs)
                lines.append(f"- **{col['name']}** (type={dtype}, top: {top_str})")

    notable = [c for c in profile.get("correlations", []) if c.get("notable")]
    if notable:
        lines.append("\n**Notable correlations:**")
        for c in notable:
            lines.append(f"- {c['col_a']} ↔ {c['col_b']} (r={c['r']})")

    sig = profile.get("significance_tests", [])
    if sig:
        lines.append("\n**Group significance tests (Kruskal-Wallis):**")
        for t in sig:
            flag = "significant" if t["significant"] else "not significant"
            lines.append(f"- {t['categorical']} → {t['numeric']}: H={t['h_stat']}, p={t['p_value']} ({flag})")

    return "\n".join(lines)


# ── fan-out helpers ────────────────────────────────────────────────────────────

def _fanout_extract(ctx, registry, job, extractor):
    results, futures = [], []
    for spec in job.plan["sub_tables"]:
        futures.append(registry.fanout.submit(_run_extract, job, spec, extractor))

    for spec, fut in zip(job.plan["sub_tables"], futures):
        try:
            rows = fut.result()
            results.append({"name": spec["name"], "rows": rows, "status": "done"})
            _emit(ctx, {"type": "analyze.subtable", "job_id": job.job_id,
                        "name": spec["name"], "rows": rows, "status": "done"})
        except Exception as e:
            logger.warning("subtable %s failed: %s", spec["name"], e)
            results.append({"name": spec["name"], "rows": 0, "status": "failed", "error": str(e)})
            _emit(ctx, {"type": "analyze.subtable", "job_id": job.job_id,
                        "name": spec["name"], "rows": 0, "status": "failed", "error": str(e)})
    return results


def _run_extract(job, spec, extractor):
    extractor(job, spec)
    with sqlite3.connect(job.dir / "data.db") as cx:
        try:
            cx.execute(spec["sql"])
        except sqlite3.Error:
            pass
        bare = spec["name"][2:] if spec["name"].startswith("t_") else spec["name"]
        table = f"t_{bare}"
        return cx.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def _read_table_data(db_path: str, table: str, limit: int = 500):
    try:
        candidates = [table] if table.startswith("t_") else [f"t_{table}", table]
        with sqlite3.connect(db_path) as cx:
            for tbl in candidates:
                try:
                    cur = cx.execute(f"SELECT * FROM {tbl} LIMIT {limit}")  # noqa: S608
                    col_names = [d[0] for d in cur.description] if cur.description else []
                    raw = cur.fetchall()
                    rows = [dict(zip(col_names, r)) for r in raw]
                    non_null = {c: [r[c] for r in rows if r[c] is not None] for c in col_names}
                    cols = [
                        {"name": c, "type": "number" if non_null[c] and all(isinstance(v, (int, float)) for v in non_null[c]) else "string"}
                        for c in col_names
                    ]
                    return cols, rows
                except sqlite3.OperationalError:
                    continue
    except Exception as e:
        logger.warning("_read_table_data failed for %s: %s", table, e)
    return [], []


def _fanout_render_charts(ctx, registry, job, stats_evidence: str, chat_fn: Callable, domain_brief: str = "") -> List[Dict[str, Any]]:
    """Render charts sequentially: PNG → emit image → synthesize insight → emit insight."""
    import base64 as _b64  # noqa: PLC0415
    from atria.core.context_engineering.tools.implementations.chart_tool import ChartTool  # noqa: PLC0415
    from .synthesis import synthesize_chart_insight  # noqa: PLC0415

    chart_tool = ChartTool()
    db_path = str(job.dir / "data.db")
    charts_dir = job.dir / "charts"
    charts_dir.mkdir(parents=True, exist_ok=True)

    sql_by_table: Dict[str, str] = {
        s["name"]: s.get("sql", "") for s in job.plan.get("sub_tables", [])
    }

    results: List[Dict[str, Any]] = []
    for spec in job.plan.get("charts", []):
        name = spec.get("name") or spec.get("title", "chart")
        title = spec.get("title", name)

        # ── render PNG ────────────────────────────────────────────────────────
        try:
            png_path = registry.fanout.submit(_render_one_chart, chart_tool, db_path, charts_dir, spec).result()
        except Exception as e:
            logger.warning("chart render failed for %s: %s", name, e)
            results.append({"name": name, "png_path": None, "status": "failed", "insight_md": ""})
            continue

        # ── emit image + table data to chat ──────────────────────────────────
        png_bytes = Path(png_path).read_bytes()
        src = f"data:image/png;base64,{_b64.b64encode(png_bytes).decode()}"
        source_table = spec.get("source_table", "")
        bare_table = source_table.removeprefix("t_")
        _tbl_cols, _tbl_rows = _read_table_data(db_path, source_table)
        _y = spec.get("y", [])
        if isinstance(_y, str):
            _y = [_y]
        _emit(ctx, {
            "type": "analyze.chart_image",
            "job_id": job.job_id,
            "name": name,
            "title": title,
            "sql": sql_by_table.get(bare_table, "") or sql_by_table.get(source_table, ""),
            "src": src,
            "columns": _tbl_cols,
            "rows": _tbl_rows,
            "suggestions": [{"chart_type": spec.get("type", "bar"), "x": spec.get("x", ""), "y": _y, "title": title}],
        })

        # ── synthesize insight + emit to chat ─────────────────────────────────
        y = spec.get("y", [])
        if isinstance(y, str):
            y = [y]
        insight = synthesize_chart_insight(
            chart_title=title,
            chart_type=spec.get("type", "bar"),
            x_col=spec.get("x", ""),
            y_cols=y,
            stats_evidence=stats_evidence,
            chat_fn=chat_fn,
            domain_brief=domain_brief,
        )
        _emit(ctx, {
            "type": "analyze.chart_insight",
            "job_id": job.job_id,
            "name": name,
            "title": title,
            "insight": insight,
        })

        results.append({"name": name, "png_path": png_path, "status": "done", "insight_md": insight})

    return results


def _render_one_chart(chart_tool, db_path: str, charts_dir: Path, spec: Dict[str, Any]) -> str:
    name = spec.get("name") or spec.get("title", "chart")
    out_path = str(charts_dir / f"{name}.png")
    y = spec.get("y", [])
    if isinstance(y, str):
        y = [y]
    res = chart_tool.render(
        db_path=db_path,
        source_table=spec.get("source_table", ""),
        chart_type=spec.get("type", "bar"),
        x=spec.get("x", ""),
        y=y,
        title=spec.get("title", name),
        out_path=out_path,
        agg=spec.get("agg"),
    )
    if not res["success"]:
        raise RuntimeError(res["error"])
    return out_path


def _group_chart_insights(job: AnalyzeJob) -> Dict[str, List[str]]:
    """Map section name → list of insight strings from rendered charts."""
    insight_by_name: Dict[str, str] = {
        c["name"]: c.get("insight_md", "") for c in job.charts if c.get("insight_md")
    }
    result: Dict[str, List[str]] = {}
    for section in job.sections:
        insights = [insight_by_name[n] for n in section.get("chart_names", []) if n in insight_by_name]
        if insights:
            result[section["name"]] = insights
    return result


def _build_final_message(job: AnalyzeJob) -> str:
    lines = [f"## Analysis of `{Path(job.file_path).name}` complete"]
    if job.exec_summary:
        lines.append(f"\n{job.exec_summary}")
    if job.key_findings:
        lines.append(f"\n### Key Findings\n{job.key_findings}")
    if job.report_path:
        lines.append(f"\n📄 Full PDF report saved to `{job.report_path}`")
    return "\n".join(lines)


def _fanout_synthesize(ctx, registry, job, synthesizer, chart_insights_by_section: Optional[Dict[str, List[str]]] = None):
    stats_evidence = _build_stats_evidence(job)
    futures = []
    for section in job.sections:
        section_insights = (chart_insights_by_section or {}).get(section["name"], [])
        futures.append(registry.fanout.submit(synthesizer, section, stats_evidence, section_insights))

    for section, fut in zip(job.sections, futures):
        try:
            section["content"] = fut.result()
            _emit(ctx, {"type": "analyze.section_synthesized", "job_id": job.job_id,
                        "name": section["name"], "status": "done"})
        except Exception as e:
            logger.warning("synthesis %s failed: %s", section.get("name"), e)
            section["content"] = None
            _emit(ctx, {"type": "analyze.section_synthesized", "job_id": job.job_id,
                        "name": section.get("name"), "status": "failed", "error": str(e)})
