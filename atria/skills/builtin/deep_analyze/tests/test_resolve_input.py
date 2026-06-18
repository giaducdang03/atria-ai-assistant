"""Tests for DeepAnalyzeEngine._resolve_input_file fallback resolution."""

from __future__ import annotations

from pathlib import Path

from atria.core.skill_tools import SkillToolContext
from atria.skills.builtin.deep_analyze.engine import DeepAnalyzeEngine


def _engine(working_dir: Path) -> DeepAnalyzeEngine:
    return DeepAnalyzeEngine(SkillToolContext(working_dir=str(working_dir)))


def test_existing_path_returned_as_is(tmp_path):
    f = tmp_path / "data.csv"
    f.write_text("a,b\n1,2\n")
    engine = _engine(tmp_path)
    assert engine._resolve_input_file(str(f)) == str(f)


def test_stale_job_dir_path_falls_back_to_artifact(tmp_path):
    """A wrong agent-supplied path (stale analyze job dir + filename) must
    resolve to the real upload under .artifacts when only the basename matches.
    """
    workspace = tmp_path / "new-chat"
    artifact = workspace / ".artifacts" / "conversations" / "4" / "event_data.csv"
    artifact.parent.mkdir(parents=True, exist_ok=True)
    artifact.write_text("x\n1\n")

    engine = _engine(workspace)
    # Path the agent wrongly constructed — does not exist.
    wrong = workspace / "analyze" / "bc9a16bf0d34" / "event_data.csv"
    resolved = engine._resolve_input_file(str(wrong))
    assert Path(resolved) == artifact


def test_bare_filename_falls_back_to_artifact(tmp_path):
    workspace = tmp_path / "new-chat"
    artifact = workspace / ".artifacts" / "conversations" / "1" / "sales.csv"
    artifact.parent.mkdir(parents=True, exist_ok=True)
    artifact.write_text("x\n1\n")

    engine = _engine(workspace)
    resolved = engine._resolve_input_file("sales.csv")
    assert Path(resolved) == artifact


def test_unresolvable_path_returned_unchanged(tmp_path):
    workspace = tmp_path / "new-chat"
    workspace.mkdir(parents=True, exist_ok=True)
    engine = _engine(workspace)
    assert engine._resolve_input_file("missing.csv") == "missing.csv"
