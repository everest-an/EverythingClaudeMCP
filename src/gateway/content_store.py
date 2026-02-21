"""Source content store: load and cache original markdown for all modules.

In retrieval-only mode (no LLM decoder), the dense_prompt needs to contain
the actual module content instead of just metadata. This store reads the
original markdown files from the vendor directory at startup and provides
them by module_id at query time.
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class SourceContentStore:
    """Maps module_id → original markdown content."""

    def __init__(self):
        self._content: dict[str, str] = {}

    def load_from_repo(self, repo_root: str | Path) -> int:
        """Scan the vendor repository and cache all module content.

        Uses the same scanner logic as the compiler to ensure module_id
        consistency.

        Returns:
            Number of modules loaded
        """
        from ..compiler.scanner import scan_repository

        root = Path(repo_root)
        if not root.exists():
            logger.warning("Source repository not found: %s", root)
            return 0

        try:
            modules = scan_repository(root)
        except Exception as e:
            logger.error("Failed to scan repository: %s", e)
            return 0

        for m in modules:
            self._content[m.module_id] = m.content

        logger.info("Loaded source content for %d modules from %s", len(self._content), root)
        return len(self._content)

    def get(self, module_id: str) -> str | None:
        """Get the original markdown content for a module."""
        return self._content.get(module_id)

    def __len__(self) -> int:
        return len(self._content)

    def __contains__(self, module_id: str) -> bool:
        return module_id in self._content
