"""Tests for session management."""

import time

from src.gateway.session import SessionManager, SessionState


def test_create_new_session():
    sm = SessionManager()
    s = sm.get_or_create()
    assert isinstance(s, SessionState)
    assert s.session_id != ""
    assert s.query_count == 0


def test_create_with_specific_id():
    sm = SessionManager()
    s = sm.get_or_create("my-session-123")
    assert s.session_id == "my-session-123"


def test_get_existing_session():
    sm = SessionManager()
    s1 = sm.get_or_create("sess-1")
    s2 = sm.get_or_create("sess-1")
    assert s1 is s2


def test_record_query():
    sm = SessionManager()
    sm.get_or_create("s1")
    sm.record_query("s1", "test intent", ["skills/a", "rules/b"], 500)

    s = sm.get_or_create("s1")
    assert s.query_count == 1
    assert s.total_tokens_saved == 500
    assert "test intent" in s.query_history
    assert "skills/a" in s.retrieved_modules


def test_session_ttl_expiry():
    sm = SessionManager(ttl_seconds=0)  # Instant expiry
    s1 = sm.get_or_create("sess-ttl")
    s1.created_at = time.time() - 1  # Force expiry

    s2 = sm.get_or_create("sess-ttl")
    assert s2.query_count == 0  # Fresh session


def test_session_capacity_eviction():
    sm = SessionManager(max_sessions=2)
    sm.get_or_create("s1")
    sm.get_or_create("s2")
    sm.get_or_create("s3")  # Should evict s1

    assert sm.get_or_create("s3").session_id == "s3"
