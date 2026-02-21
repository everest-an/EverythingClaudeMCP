"""Latent tensor retriever: find and load relevant modules from the compiled store.

Two retrieval modes:
1. Similarity-based: encode intent → cosine search → load top-K tensors
2. Direct lookup: retrieve a specific module by ID (for skill_injector)
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

from ..compiler.indexer import NumpyIndex
from ..compiler.persistence import load_module_metadata, load_module_tensor
from ..shared.types import RetrievedModule

logger = logging.getLogger(__name__)


class LatentRetriever:
    """Retrieve relevant latent tensors from the compiled store."""

    def __init__(self, index: NumpyIndex, tensor_dir: str):
        self.index = index
        self.tensor_dir = tensor_dir

    def retrieve(
        self,
        query_embedding: np.ndarray,
        top_k: int = 3,
        module_type_filter: str | None = None,
        min_score: float = 0.3,
        query_text: str | None = None,
        exclude_types: set[str] | None = None,
    ) -> list[RetrievedModule]:
        """Find and load the top-K most relevant modules.

        Args:
            query_embedding: L2-normalized query vector [hidden_dim]
            top_k: Number of modules to retrieve
            module_type_filter: Optional filter by module type
            min_score: Minimum cosine similarity threshold
            query_text: Original query for keyword boosting
            exclude_types: Module types to exclude from results

        Returns:
            List of RetrievedModule with loaded tensors, sorted by score
        """
        results = self.index.query(
            query_embedding,
            top_k=top_k,
            module_type_filter=module_type_filter,
            min_score=min_score,
            query_text=query_text,
            exclude_types=exclude_types,
        )

        retrieved = []
        for entry, score in results:
            try:
                layer_states = load_module_tensor(
                    self.tensor_dir, entry.module_id, "layer_states"
                )
                latent_trajectory = load_module_tensor(
                    self.tensor_dir, entry.module_id, "latent_trajectory"
                )

                retrieved.append(RetrievedModule(
                    module_id=entry.module_id,
                    name=entry.name,
                    module_type=entry.module_type,
                    description=entry.description,
                    score=score,
                    layer_states=layer_states,
                    latent_trajectory=latent_trajectory,
                    original_token_count=entry.token_count,
                ))
            except Exception as e:
                logger.warning(
                    "Failed to load tensors for %s: %s", entry.module_id, e
                )

        return retrieved

    def retrieve_by_id(self, module_id: str) -> RetrievedModule | None:
        """Retrieve a specific module by its ID.

        Args:
            module_id: Module identifier (e.g., "skills/security-review")

        Returns:
            RetrievedModule or None if not found
        """
        entry = self.index.get_by_id(module_id)
        if entry is None:
            # Try with common prefix variations
            for prefix in ["skills/", "agents/", "rules/", "commands/"]:
                if not module_id.startswith(prefix):
                    candidate = prefix + module_id
                    entry = self.index.get_by_id(candidate)
                    if entry:
                        break

        if entry is None:
            logger.warning("Module not found: %s", module_id)
            return None

        try:
            layer_states = load_module_tensor(
                self.tensor_dir, entry.module_id, "layer_states"
            )
            latent_trajectory = load_module_tensor(
                self.tensor_dir, entry.module_id, "latent_trajectory"
            )

            return RetrievedModule(
                module_id=entry.module_id,
                name=entry.name,
                module_type=entry.module_type,
                description=entry.description,
                score=1.0,  # Direct lookup = perfect match
                layer_states=layer_states,
                latent_trajectory=latent_trajectory,
                original_token_count=entry.token_count,
            )
        except Exception as e:
            logger.error("Failed to load tensors for %s: %s", module_id, e)
            return None

    def retrieve_by_keywords(
        self,
        query_text: str,
        top_k: int = 3,
        module_type_filter: str | None = None,
        exclude_types: set[str] | None = None,
    ) -> list[RetrievedModule]:
        """Keyword-based retrieval without embeddings (retrieval-only mode).

        Scores modules by keyword overlap with query text. Used when no LLM
        model is loaded (cloud retrieval-only deployment).
        """
        # Extract meaningful keywords (skip very short tokens and code punctuation)
        raw_tokens = query_text.lower().replace("'", " ").replace('"', " ").split()
        keywords = {t for t in raw_tokens if len(t) >= 3 and t.isalpha()}
        scored = []

        for entry in self.index.entries:
            if module_type_filter and entry.module_type != module_type_filter:
                continue
            if exclude_types and entry.module_type in exclude_types:
                continue

            # Build match text from ID (split on / and --), name, and description
            id_parts = entry.module_id.replace("/", " ").replace("--", " ")
            match_text = f"{id_parts} {entry.name} {entry.description}".lower()
            hits = sum(1 for kw in keywords if kw in match_text)
            if hits > 0:
                score = hits / max(len(keywords), 1)
                scored.append((entry, score))

        scored.sort(key=lambda x: x[1], reverse=True)

        # In keyword mode (retrieval-only), skip tensor loading — only metadata needed
        return [
            RetrievedModule(
                module_id=entry.module_id,
                name=entry.name,
                module_type=entry.module_type,
                description=entry.description,
                score=score,
                layer_states=None,
                latent_trajectory=None,
                original_token_count=entry.token_count,
            )
            for entry, score in scored[:top_k]
        ]

    def list_modules(
        self, module_type_filter: str | None = None
    ) -> list[dict]:
        """List all available modules in the index.

        Returns:
            List of dicts with module_id, name, module_type, description
        """
        results = []
        for entry in self.index.entries:
            if module_type_filter and entry.module_type != module_type_filter:
                continue
            results.append({
                "module_id": entry.module_id,
                "name": entry.name,
                "module_type": entry.module_type,
                "description": entry.description,
                "token_count": entry.token_count,
            })
        return results
