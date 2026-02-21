"""Similarity index for latent module retrieval.

Builds a NumPy-based cosine similarity index from compiled module embeddings.
For ~100 modules, NumPy is sufficient (no FAISS needed). Dimension varies by model
(Qwen3-4B: 2560, Qwen3-14B: 5120, Qwen2.5-1.5B: 1536).
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict, dataclass

import numpy as np

from ..shared.types import EncodedModule

logger = logging.getLogger(__name__)


@dataclass
class IndexEntry:
    """Metadata for a single indexed module."""

    module_id: str
    name: str
    module_type: str
    description: str
    token_count: int
    content_hash: str


class NumpyIndex:
    """Cosine similarity index backed by NumPy arrays.

    Stores L2-normalized embeddings for fast cosine similarity via dot product.
    """

    def __init__(self):
        self.embeddings: np.ndarray | None = None  # [N, hidden_dim], mean-centered + L2-normed
        self._centroid: np.ndarray | None = None    # [hidden_dim], mean vector for centering queries
        self.entries: list[IndexEntry] = []

    def build(self, encoded_modules: list[EncodedModule]) -> None:
        """Build index from a list of encoded modules.

        Args:
            encoded_modules: List of EncodedModule with mean_embedding tensors
        """
        if not encoded_modules:
            logger.warning("No modules to index")
            return

        # Stack embeddings into matrix
        embeddings_list = [m.mean_embedding.numpy() for m in encoded_modules]
        self.embeddings = np.stack(embeddings_list).astype(np.float32)  # [N, H]

        # L2 normalize for cosine similarity via dot product
        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        self.embeddings = self.embeddings / np.maximum(norms, 1e-8)

        # Build entry list
        self.entries = [
            IndexEntry(
                module_id=m.module_id,
                name=m.name,
                module_type=m.module_type,
                description=m.description[:200],
                token_count=m.token_count,
                content_hash=m.content_hash,
            )
            for m in encoded_modules
        ]

        logger.info(
            "Built index: %d modules, embedding dim=%d",
            len(self.entries),
            self.embeddings.shape[1],
        )

    def query(
        self,
        query_embedding: np.ndarray,
        top_k: int = 3,
        module_type_filter: str | None = None,
        min_score: float = 0.3,
        query_text: str | None = None,
        exclude_types: set[str] | None = None,
    ) -> list[tuple[IndexEntry, float]]:
        """Find top_k most similar modules by cosine similarity + keyword boosting.

        Args:
            query_embedding: Query vector [hidden_dim]
            top_k: Number of results to return
            module_type_filter: Optional filter by module_type
            min_score: Minimum similarity threshold
            query_text: Original query text for keyword boosting
            exclude_types: Module types to exclude (e.g., {"hook", "context"})

        Returns:
            List of (IndexEntry, score) tuples sorted by descending score
        """
        if self.embeddings is None or len(self.entries) == 0:
            return []

        # L2 normalize query
        query_norm = query_embedding / max(np.linalg.norm(query_embedding), 1e-8)
        query_norm = query_norm.astype(np.float32)

        # Cosine similarity via dot product (both vectors are L2-normalized)
        scores = self.embeddings @ query_norm  # [N]

        # Keyword boost: match query words against module_id, name, description
        if query_text:
            keywords = set(query_text.lower().split())
            for i, entry in enumerate(self.entries):
                match_text = f"{entry.module_id} {entry.name} {entry.description}".lower()
                hits = sum(1 for kw in keywords if kw in match_text)
                if hits > 0:
                    scores[i] += 0.05 * hits  # Small boost per keyword match

        # Apply module type filter (include only)
        if module_type_filter:
            mask = np.array([
                e.module_type == module_type_filter for e in self.entries
            ])
            scores = np.where(mask, scores, -1.0)

        # Apply module type exclusion
        if exclude_types:
            mask = np.array([
                e.module_type not in exclude_types for e in self.entries
            ])
            scores = np.where(mask, scores, -1.0)

        # Get top-k indices
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score >= min_score:
                results.append((self.entries[idx], score))

        return results

    def get_by_id(self, module_id: str) -> IndexEntry | None:
        """Look up a module by ID."""
        for entry in self.entries:
            if entry.module_id == module_id:
                return entry
        return None

    def save(self, index_dir: str) -> None:
        """Persist index to disk.

        Saves:
        - embeddings.npy: the embedding matrix
        - manifest.json: module metadata
        """
        os.makedirs(index_dir, exist_ok=True)

        if self.embeddings is not None:
            np.save(os.path.join(index_dir, "embeddings.npy"), self.embeddings)
        if self._centroid is not None:
            np.save(os.path.join(index_dir, "centroid.npy"), self._centroid)

        manifest = {
            "version": 1,
            "count": len(self.entries),
            "embedding_dim": self.embeddings.shape[1] if self.embeddings is not None else 0,
            "entries": [asdict(e) for e in self.entries],
        }
        with open(os.path.join(index_dir, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        logger.info("Saved index: %d entries → %s", len(self.entries), index_dir)

    def load(self, index_dir: str) -> None:
        """Load index from disk."""
        embeddings_path = os.path.join(index_dir, "embeddings.npy")
        manifest_path = os.path.join(index_dir, "manifest.json")

        if not os.path.exists(embeddings_path) or not os.path.exists(manifest_path):
            logger.warning("Index files not found in %s", index_dir)
            return

        self.embeddings = np.load(embeddings_path)

        centroid_path = os.path.join(index_dir, "centroid.npy")
        if os.path.exists(centroid_path):
            self._centroid = np.load(centroid_path)

        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        self.entries = [
            IndexEntry(**entry) for entry in manifest["entries"]
        ]

        logger.info(
            "Loaded index: %d entries, dim=%d",
            len(self.entries),
            self.embeddings.shape[1] if self.embeddings is not None else 0,
        )
