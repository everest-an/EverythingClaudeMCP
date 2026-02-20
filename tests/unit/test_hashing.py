"""Tests for content hashing."""

from src.shared.hashing import content_hash


def test_content_hash_deterministic():
    h1 = content_hash("hello world")
    h2 = content_hash("hello world")
    assert h1 == h2


def test_content_hash_different_inputs():
    h1 = content_hash("hello")
    h2 = content_hash("world")
    assert h1 != h2


def test_content_hash_is_sha256():
    h = content_hash("test")
    assert len(h) == 64  # SHA-256 hex digest length
    assert all(c in "0123456789abcdef" for c in h)
