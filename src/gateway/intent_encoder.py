"""Intent encoder: convert user intent to a latent query vector for retrieval.

Uses a single forward pass through the model (no latent steps) to produce
a [hidden_dim] vector that can be compared with stored module embeddings.
"""

from __future__ import annotations

import logging
from functools import lru_cache

import numpy as np

from ..adapter.chat_template import build_intent_query_prompt
from ..adapter.model_wrapper import AdaptedModelWrapper

logger = logging.getLogger(__name__)


class IntentEncoder:
    """Encode user intents into latent query vectors."""

    def __init__(self, model_wrapper: AdaptedModelWrapper, cache_size: int = 128):
        self.wrapper = model_wrapper
        self._cache: dict[str, np.ndarray] = {}
        self._cache_size = cache_size

    def encode(self, intent: str) -> np.ndarray:
        """Encode an intent string into a [hidden_dim] query vector.

        Uses LRU cache for repeated intents within a session.

        Args:
            intent: Natural language intent or code snippet

        Returns:
            L2-normalized numpy array of shape [hidden_dim]
        """
        # Check cache
        cache_key = intent.strip()
        if cache_key in self._cache:
            logger.debug("Cache hit for intent: %s...", cache_key[:50])
            return self._cache[cache_key]

        # Build ChatML prompt
        messages = build_intent_query_prompt(intent)

        # Single forward pass to get mean-pooled hidden state
        mean_embedding, _ = self.wrapper.encode_text(messages)

        # Convert to numpy and L2 normalize
        vec = mean_embedding.numpy().astype(np.float32)
        norm = np.linalg.norm(vec)
        if norm > 1e-8:
            vec = vec / norm

        # Update cache (simple LRU via dict ordering)
        self._cache[cache_key] = vec
        if len(self._cache) > self._cache_size:
            # Remove oldest entry
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]

        return vec

    def clear_cache(self) -> None:
        """Clear the intent encoding cache."""
        self._cache.clear()
