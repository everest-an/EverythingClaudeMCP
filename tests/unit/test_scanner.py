"""Tests for repository scanner."""

from pathlib import Path

from src.compiler.scanner import scan_repository


def test_scan_everything_claude_code():
    """Scan the vendored everything-claude-code repo."""
    repo_root = Path("vendor/everything-claude-code")
    if not repo_root.exists():
        import pytest
        pytest.skip("vendor/everything-claude-code not available")

    modules = scan_repository(repo_root)
    assert len(modules) > 50, f"Expected 50+ modules, got {len(modules)}"

    # Check module types present
    types = {m.module_type for m in modules}
    assert "agent" in types
    assert "skill" in types
    assert "command" in types

    # All modules should have non-empty content and ID
    for m in modules:
        assert m.module_id, f"Empty module_id: {m}"
        assert m.content, f"Empty content: {m.module_id}"
        assert m.content_hash, f"Empty hash: {m.module_id}"


def test_scan_nonexistent_raises():
    try:
        scan_repository("/nonexistent/path")
        assert False, "Should have raised FileNotFoundError"
    except FileNotFoundError:
        pass


def test_modules_sorted_by_id():
    """Modules should be sorted by module_id."""
    repo_root = Path("vendor/everything-claude-code")
    if not repo_root.exists():
        import pytest
        pytest.skip("vendor/everything-claude-code not available")

    modules = scan_repository(repo_root)
    ids = [m.module_id for m in modules]
    assert ids == sorted(ids)
