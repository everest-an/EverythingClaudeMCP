"""Tests for ChatML prompt builders."""

from src.adapter.chat_template import (
    build_compliance_decode_prompt,
    build_decode_prompt,
    build_intent_query_prompt,
    build_rule_encoding_prompt,
)


def test_build_rule_encoding_prompt_structure():
    msgs = build_rule_encoding_prompt("skill", "Security Review", "Check OWASP top 10.")
    assert len(msgs) == 2
    assert msgs[0]["role"] == "system"
    assert msgs[1]["role"] == "user"


def test_build_rule_encoding_prompt_contains_content():
    msgs = build_rule_encoding_prompt("rule", "Coding Style", "Use 4-space indent.")
    assert "Coding Style" in msgs[0]["content"]
    assert "Use 4-space indent." in msgs[1]["content"]
    assert "rule" in msgs[0]["content"]


def test_build_intent_query_prompt():
    msgs = build_intent_query_prompt("implement debounced search")
    assert len(msgs) == 2
    assert msgs[0]["role"] == "system"
    assert msgs[1]["role"] == "user"
    assert "implement debounced search" in msgs[1]["content"]


def test_build_decode_prompt():
    msgs = build_decode_prompt("skill", "TDD Workflow")
    assert len(msgs) == 2
    assert "TDD Workflow" in msgs[1]["content"]
    assert "skill" in msgs[1]["content"]


def test_build_compliance_decode_prompt():
    msgs = build_compliance_decode_prompt()
    assert len(msgs) == 2
    assert "compliance" in msgs[0]["content"].lower() or "compliance" in msgs[1]["content"].lower()
