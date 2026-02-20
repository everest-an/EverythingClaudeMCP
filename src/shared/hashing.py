"""Content hashing utilities for delta compilation."""

from __future__ import annotations

import hashlib


def content_hash(text: str) -> str:
    """Compute SHA-256 hash of text content."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
