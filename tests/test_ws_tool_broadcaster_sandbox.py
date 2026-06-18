"""Tests for the WebSocket tool broadcaster sandbox path check."""

from __future__ import annotations

from pathlib import Path

from atria.web.ws_tool_broadcaster import WebSocketToolBroadcaster


class _DummyRegistry:
    """Minimal tool registry stub (no skill_ctx)."""

    skill_ctx = None


def _make_broadcaster(working_dir: Path) -> WebSocketToolBroadcaster:
    return WebSocketToolBroadcaster(
        tool_registry=_DummyRegistry(),
        ws_manager=None,
        loop=None,
        working_dir=working_dir,
    )


def test_sandbox_allows_relative_artifact_path(tmp_path, monkeypatch):
    """A relative artifact path must be allowed regardless of process CWD.

    Regression: _sandbox_check used to resolve relative paths against the
    process CWD instead of the conversation working_dir, producing false
    "Access denied" errors for legitimate paths like
    '.artifacts/conversations/4/file.csv'.
    """
    workspace = tmp_path / "workspace" / "new-chat"
    artifact = workspace / ".artifacts" / "conversations" / "4" / "data.csv"
    artifact.parent.mkdir(parents=True, exist_ok=True)
    artifact.write_text("a,b\n1,2\n")

    # Simulate the server running from a different CWD than the workspace.
    other_cwd = tmp_path / "elsewhere"
    other_cwd.mkdir()
    monkeypatch.chdir(other_cwd)

    broadcaster = _make_broadcaster(workspace)
    err = broadcaster._sandbox_check(
        "read_file",
        {"file_path": ".artifacts/conversations/4/data.csv"},
    )
    assert err is None


def test_sandbox_blocks_relative_traversal(tmp_path, monkeypatch):
    """A relative path escaping the workspace must still be denied."""
    workspace = tmp_path / "workspace" / "new-chat"
    workspace.mkdir(parents=True, exist_ok=True)
    monkeypatch.chdir(tmp_path)

    broadcaster = _make_broadcaster(workspace)
    err = broadcaster._sandbox_check(
        "read_file",
        {"file_path": "../../etc/passwd"},
    )
    assert err is not None
    assert "Access denied" in err


def test_sandbox_allows_absolute_path_within_workspace(tmp_path):
    """An absolute path inside the workspace is allowed."""
    workspace = tmp_path / "workspace" / "new-chat"
    target = workspace / "notes.txt"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("hi")

    broadcaster = _make_broadcaster(workspace)
    err = broadcaster._sandbox_check("read_file", {"file_path": str(target)})
    assert err is None
