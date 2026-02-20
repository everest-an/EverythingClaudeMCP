"""Latent encoder: transforms parsed modules into tensor representations.

For each markdown module, the encoder:
1. Builds a ChatML prompt that frames the rule/skill as internalized knowledge
2. Runs a forward pass through the base model (Qwen3-4B by default) to capture hidden states
3. Executes N latent reasoning steps to deepen the representation
4. Returns tensors suitable for persistence and retrieval
"""

from __future__ import annotations

import gc
import logging

from ..adapter.chat_template import build_rule_encoding_prompt
from ..adapter.model_wrapper import AdaptedModelWrapper
from ..shared.types import EncodedModule, ParsedModule

logger = logging.getLogger(__name__)


class LatentEncoder:
    """Encodes parsed markdown modules into latent tensor representations."""

    def __init__(self, model_wrapper: AdaptedModelWrapper):
        self.wrapper = model_wrapper

    def encode_module(
        self, module: ParsedModule, latent_steps: int | None = None
    ) -> EncodedModule:
        """Encode a single module into latent tensors.

        Args:
            module: Parsed markdown module to encode
            latent_steps: Number of latent reasoning steps

        Returns:
            EncodedModule with mean_embedding, layer_states, and latent_trajectory
        """
        logger.debug("Encoding module: %s (%s)", module.module_id, module.module_type)

        # Count original tokens for savings calculation
        token_count = self.wrapper.get_token_count(module.content)

        # Build ChatML prompt for rule internalization
        messages = build_rule_encoding_prompt(
            module_type=module.module_type,
            module_name=module.name,
            content=module.content,
        )

        # Run latent steps to capture deep representation
        mean_embedding, layer_states, latent_trajectory, _ = (
            self.wrapper.generate_latent_steps(
                messages=messages,
                n_steps=latent_steps,
            )
        )

        # Detach and move to CPU for storage
        encoded = EncodedModule(
            module_id=module.module_id,
            module_type=module.module_type,
            name=module.name,
            description=module.description,
            mean_embedding=mean_embedding.detach().cpu(),
            layer_states=layer_states.detach().cpu(),
            latent_trajectory=latent_trajectory.detach().cpu(),
            content_hash=module.content_hash,
            token_count=token_count,
            metadata=module.metadata,
        )

        # Free intermediate tensors
        gc.collect()

        logger.debug(
            "Encoded %s: %d tokens → tensors [mean=%s, layers=%s, trajectory=%s]",
            module.module_id,
            token_count,
            list(mean_embedding.shape),
            list(layer_states.shape),
            list(latent_trajectory.shape),
        )

        return encoded
