"""Latent decoder: convert retrieved latent tensors into dense text instructions.

The decoder takes latent trajectories from retrieved modules, inserts them
as virtual embeddings into a decode prompt, and generates compressed text
instructions (< 150 tokens) via the model's LM head.
"""

from __future__ import annotations

import logging
from collections import OrderedDict

import torch

from ..adapter.chat_template import build_compliance_decode_prompt, build_decode_prompt
from ..adapter.config import MAX_DECODE_TOKENS
from ..adapter.model_wrapper import AdaptedModelWrapper
from ..shared.types import RetrievedModule

logger = logging.getLogger(__name__)


class LatentDecoder:
    """Decode latent tensors into dense text instructions."""

    def __init__(
        self,
        model_wrapper: AdaptedModelWrapper,
        max_tokens: int = MAX_DECODE_TOKENS,
        cache_size: int = 256,
    ):
        self.wrapper = model_wrapper
        self.max_tokens = max_tokens
        # LRU cache: frozenset(module_ids) + tool_name → decoded text
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._cache_size = cache_size

    def decode(
        self,
        retrieved_modules: list[RetrievedModule],
        tool_name: str = "architect_consult",
    ) -> str:
        """Decode retrieved latent states into a dense instruction prompt.

        Args:
            retrieved_modules: List of retrieved modules with loaded tensors
            tool_name: Which MCP tool triggered this decode

        Returns:
            Dense text instructions (< max_tokens tokens)
        """
        if not retrieved_modules:
            return "No relevant rules or patterns found for this query."

        # Check cache
        cache_key = self._make_cache_key(retrieved_modules, tool_name)
        if cache_key in self._cache:
            self._cache.move_to_end(cache_key)
            logger.debug("Decode cache hit")
            return self._cache[cache_key]

        # Concatenate latent trajectories from all retrieved modules
        trajectories = [m.latent_trajectory for m in retrieved_modules]
        combined_latent = torch.cat(trajectories, dim=0)  # [total_steps, H]

        # Build decode prompt based on tool type
        if tool_name == "compliance_verify":
            messages = build_compliance_decode_prompt()
        else:
            # For architect_consult and skill_injector
            module_names = ", ".join(m.name for m in retrieved_modules)
            module_type = retrieved_modules[0].module_type
            messages = build_decode_prompt(module_type, module_names)

        # Decode: insert latent embeddings and generate text
        dense_text = self.wrapper.decode_from_latent(
            latent_embeddings=combined_latent,
            decode_messages=messages,
            max_new_tokens=self.max_tokens,
        )

        # Update cache
        self._cache[cache_key] = dense_text
        if len(self._cache) > self._cache_size:
            self._cache.popitem(last=False)

        logger.debug(
            "Decoded %d modules → %d chars",
            len(retrieved_modules),
            len(dense_text),
        )

        return dense_text

    def _make_cache_key(
        self, modules: list[RetrievedModule], tool_name: str
    ) -> str:
        """Create a cache key from module IDs and tool name."""
        ids = sorted(m.module_id for m in modules)
        return f"{tool_name}::{','.join(ids)}"

    def clear_cache(self) -> None:
        """Clear the decode cache."""
        self._cache.clear()
