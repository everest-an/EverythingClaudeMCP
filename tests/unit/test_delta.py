"""Tests for delta (incremental) compilation."""

import json
import os
import tempfile

from src.compiler.delta import DeltaCompiler
from src.shared.types import ParsedModule


def _make_module(module_id: str, content: str) -> ParsedModule:
    return ParsedModule(
        module_id=module_id,
        module_type="rule",
        name=module_id,
        description="",
        content=content,
        source_path="/tmp/test.md",
    )


def test_needs_recompile_first_time():
    """First compilation: all modules need recompile."""
    dc = DeltaCompiler(hash_file="/nonexistent/hashes.json")
    m = _make_module("rules/a", "content a")
    assert dc.needs_recompile(m) is True


def test_needs_recompile_unchanged():
    """If content hash matches, no recompile needed."""
    with tempfile.TemporaryDirectory() as tmpdir:
        hash_file = os.path.join(tmpdir, "hashes.json")
        m = _make_module("rules/a", "content a")

        # First compile
        dc1 = DeltaCompiler(hash_file=hash_file)
        dc1.needs_recompile(m)
        dc1.save_hashes()

        # Second compile: same content
        dc2 = DeltaCompiler(hash_file=hash_file)
        dc2.load_previous_hashes()
        assert dc2.needs_recompile(m) is False


def test_needs_recompile_changed():
    """If content changes, recompile needed."""
    with tempfile.TemporaryDirectory() as tmpdir:
        hash_file = os.path.join(tmpdir, "hashes.json")

        dc1 = DeltaCompiler(hash_file=hash_file)
        dc1.needs_recompile(_make_module("rules/a", "version 1"))
        dc1.save_hashes()

        dc2 = DeltaCompiler(hash_file=hash_file)
        dc2.load_previous_hashes()
        assert dc2.needs_recompile(_make_module("rules/a", "version 2")) is True


def test_get_deleted_modules():
    """Detect modules removed since last compilation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        hash_file = os.path.join(tmpdir, "hashes.json")

        # First: compile a and b
        dc1 = DeltaCompiler(hash_file=hash_file)
        dc1.needs_recompile(_make_module("rules/a", "a"))
        dc1.needs_recompile(_make_module("rules/b", "b"))
        dc1.save_hashes()

        # Second: only a exists
        dc2 = DeltaCompiler(hash_file=hash_file)
        dc2.load_previous_hashes()
        current = [_make_module("rules/a", "a")]
        deleted = dc2.get_deleted_modules(current)
        assert "rules/b" in deleted


def test_save_creates_directory():
    with tempfile.TemporaryDirectory() as tmpdir:
        hash_file = os.path.join(tmpdir, "nested", "deep", "hashes.json")
        dc = DeltaCompiler(hash_file=hash_file)
        dc.needs_recompile(_make_module("x", "y"))
        dc.save_hashes()
        assert os.path.exists(hash_file)
