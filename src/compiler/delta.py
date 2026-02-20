"""Delta compilation: only recompile modules whose content has changed.

Uses SHA-256 content hashes to detect changes. Stores hashes in a JSON cache file.
"""

from __future__ import annotations

import json
import logging
import os

from ..shared.types import ParsedModule

logger = logging.getLogger(__name__)

DEFAULT_HASH_FILE = "data/cache/content_hashes.json"


class DeltaCompiler:
    """Track content hashes for incremental recompilation."""

    def __init__(self, hash_file: str = DEFAULT_HASH_FILE):
        self.hash_file = hash_file
        self.old_hashes: dict[str, str] = {}
        self.new_hashes: dict[str, str] = {}

    def load_previous_hashes(self) -> None:
        """Load hash file from previous compilation."""
        if os.path.exists(self.hash_file):
            try:
                with open(self.hash_file, "r", encoding="utf-8") as f:
                    self.old_hashes = json.load(f)
                logger.info("Loaded %d previous hashes", len(self.old_hashes))
            except Exception as e:
                logger.warning("Failed to load hash file: %s", e)
                self.old_hashes = {}

    def needs_recompile(self, module: ParsedModule) -> bool:
        """Check if a module needs recompilation based on content hash.

        Also records the current hash for later saving.
        """
        current_hash = module.content_hash
        self.new_hashes[module.module_id] = current_hash
        old_hash = self.old_hashes.get(module.module_id)
        return old_hash != current_hash

    def get_deleted_modules(self, current_modules: list[ParsedModule]) -> list[str]:
        """Find module IDs that existed in the previous compilation but are now absent."""
        current_ids = {m.module_id for m in current_modules}
        return [mid for mid in self.old_hashes if mid not in current_ids]

    def save_hashes(self) -> None:
        """Persist current hashes after successful compilation."""
        os.makedirs(os.path.dirname(self.hash_file), exist_ok=True)
        with open(self.hash_file, "w", encoding="utf-8") as f:
            json.dump(self.new_hashes, f, indent=2)
        logger.info("Saved %d content hashes", len(self.new_hashes))
