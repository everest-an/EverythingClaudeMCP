"""Tests for shared type definitions."""

from src.shared.types import EncodedModule, ParsedModule, RetrievedModule


def test_parsed_module_auto_hash():
    """ParsedModule should auto-compute content_hash."""
    m = ParsedModule(
        module_id="test/mod",
        module_type="rule",
        name="Test",
        description="A test module",
        content="Some content here",
        source_path="/tmp/test.md",
    )
    assert m.content_hash != ""
    assert len(m.content_hash) == 64


def test_parsed_module_preserves_explicit_hash():
    """If content_hash is provided, should not override."""
    m = ParsedModule(
        module_id="test/mod",
        module_type="rule",
        name="Test",
        description="",
        content="content",
        source_path="/tmp/test.md",
        content_hash="explicit_hash",
    )
    assert m.content_hash == "explicit_hash"


def test_parsed_module_default_metadata():
    m = ParsedModule(
        module_id="x", module_type="rule", name="X",
        description="", content="c", source_path="p",
    )
    assert m.metadata == {}
