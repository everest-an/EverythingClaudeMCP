"""Session management for latent queries.

Tracks per-session state: query history, retrieved modules, and token savings.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from uuid import uuid4


@dataclass
class SessionState:
    """State for a single query session."""

    session_id: str
    created_at: float = field(default_factory=time.time)
    query_history: list[str] = field(default_factory=list)
    retrieved_modules: list[str] = field(default_factory=list)
    total_tokens_saved: int = 0
    query_count: int = 0


class SessionManager:
    """Manage per-session state with TTL-based expiration."""

    def __init__(self, max_sessions: int = 100, ttl_seconds: int = 3600):
        self._sessions: dict[str, SessionState] = {}
        self._max_sessions = max_sessions
        self._ttl = ttl_seconds

    def get_or_create(self, session_id: str | None = None) -> SessionState:
        """Get existing session or create a new one."""
        if session_id and session_id in self._sessions:
            session = self._sessions[session_id]
            # Check TTL
            if time.time() - session.created_at > self._ttl:
                del self._sessions[session_id]
            else:
                return session

        # Create new session
        sid = session_id or str(uuid4())
        session = SessionState(session_id=sid)
        self._sessions[sid] = session

        # Evict oldest if over capacity
        self._evict_if_needed()

        return session

    def record_query(
        self,
        session_id: str,
        query: str,
        module_ids: list[str],
        tokens_saved: int,
    ) -> None:
        """Record a query in the session."""
        session = self.get_or_create(session_id)
        session.query_history.append(query)
        session.retrieved_modules.extend(module_ids)
        session.total_tokens_saved += tokens_saved
        session.query_count += 1

    def _evict_if_needed(self) -> None:
        """Remove oldest sessions if over capacity."""
        while len(self._sessions) > self._max_sessions:
            oldest_id = min(
                self._sessions, key=lambda k: self._sessions[k].created_at
            )
            del self._sessions[oldest_id]
