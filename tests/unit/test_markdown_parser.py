"""Tests for markdown parser and module ID derivation."""

import json
import tempfile
from pathlib import Path

from src.shared.markdown_parser import parse_hooks_json, parse_markdown_file


def test_parse_plain_markdown():
    """Parse a plain markdown file without frontmatter."""
    with tempfile.NamedTemporaryFile(suffix=".md", mode="w", delete=False, encoding="utf-8") as f:
        f.write("# My Rule\n\nDo this, not that.")
        f.flush()
        module = parse_markdown_file(f.name, "rule")

    assert module is not None
    assert module.module_type == "rule"
    assert "Do this, not that." in module.content
    assert module.content_hash != ""


def test_parse_frontmatter_markdown():
    """Parse markdown with YAML frontmatter."""
    content = """---
name: Security Review
description: OWASP Top 10 checks
---

# Security Review

Check for SQL injection.
"""
    with tempfile.NamedTemporaryFile(suffix=".md", mode="w", delete=False, encoding="utf-8") as f:
        f.write(content)
        f.flush()
        module = parse_markdown_file(f.name, "skill")

    assert module is not None
    assert module.name == "Security Review"
    assert module.description == "OWASP Top 10 checks"
    assert "SQL injection" in module.content


def test_parse_empty_file_returns_none():
    """Empty files should return None."""
    with tempfile.NamedTemporaryFile(suffix=".md", mode="w", delete=False, encoding="utf-8") as f:
        f.write("")
        f.flush()
        module = parse_markdown_file(f.name, "rule")

    assert module is None


def test_parse_nonexistent_file_returns_none():
    module = parse_markdown_file("/nonexistent/file.md", "agent")
    assert module is None


def test_parse_hooks_json():
    """Parse hooks.json into multiple modules."""
    hooks_data = {
        "hooks": {
            "PreToolUse": [
                {
                    "matcher": "Bash",
                    "description": "Validate bash commands",
                    "command": "echo ok"
                }
            ]
        }
    }
    with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False, encoding="utf-8") as f:
        json.dump(hooks_data, f)
        f.flush()
        modules = parse_hooks_json(f.name)

    assert len(modules) >= 1
    assert modules[0].module_type == "hook"
    assert "PreToolUse" in modules[0].module_id


def test_parse_hooks_nonexistent():
    modules = parse_hooks_json("/nonexistent/hooks.json")
    assert modules == []


def test_content_hash_deterministic():
    """Same content should produce same hash."""
    content = "---\nname: Test\n---\n\nHello world"
    with tempfile.NamedTemporaryFile(suffix=".md", mode="w", delete=False, encoding="utf-8") as f:
        f.write(content)
        f.flush()
        m1 = parse_markdown_file(f.name, "rule")
        m2 = parse_markdown_file(f.name, "rule")

    assert m1.content_hash == m2.content_hash
