"""Adapted ModelWrapper with multi-model support (Qwen3-4B/14B, Qwen2.5-1.5B).

Adapted from LatentMAS ModelWrapper (Gen-Verse/LatentMAS/models.py).
Key changes:
- Multi-model: Qwen3-4B (default, GPU), Qwen3-14B, Qwen2.5-1.5B (CPU fallback)
- Auto hardware: resolves device/dtype from model profile and available hardware
- Single model: no dual-model configuration
- Purpose-built: encode → latent steps → decode pipeline (not multi-agent debate)
"""

from __future__ import annotations

import gc
import logging
from typing import Any

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from .config import (
    DECODE_TEMPERATURE,
    DECODE_TOP_P,
    MAX_DECODE_TOKENS,
    MODEL_NAME,
    get_profile,
    resolve_device,
    resolve_dtype,
)
from .realignment import apply_realignment, compute_realignment_matrix

logger = logging.getLogger(__name__)


class AdaptedModelWrapper:
    """Model wrapper with multi-model support and latent space operations.

    Supports Qwen3-4B (default), Qwen3-14B, and Qwen2.5-Coder-1.5B.
    Automatically resolves device (GPU/CPU) and dtype (bfloat16/float32)
    based on the model profile and available hardware.

    Provides three core operations:
    1. encode_text() - Single forward pass to get hidden state representation
    2. generate_latent_steps() - Run N latent reasoning steps, capture trajectory
    3. decode_from_latent() - Insert latent embeddings and generate text
    """

    def __init__(
        self,
        model_name: str = MODEL_NAME,
        device: str | None = None,
        load_model: bool = True,
    ):
        self.profile = get_profile(model_name)
        self.model_name = self.profile.model_name

        # Auto-resolve device and dtype from profile if not overridden
        if device is not None:
            self.device = torch.device(device)
        else:
            self.device = torch.device(resolve_device(self.profile))
        self.dtype = resolve_dtype(self.profile, str(self.device))

        self.model = None
        self.tokenizer = None
        self.realign_matrix = None
        self.target_norm = None

        if load_model:
            self._load_model()

    def _load_model(self) -> None:
        """Load model and tokenizer, compute realignment matrix."""
        logger.info("Loading tokenizer: %s", self.model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_name,
            trust_remote_code=True,
            padding_side="left",
        )
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        logger.info(
            "Loading model: %s (device=%s, dtype=%s)",
            self.model_name, self.device, self.dtype,
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=self.dtype,
            device_map=str(self.device),
            low_cpu_mem_usage=True,
            trust_remote_code=True,
        )
        self.model.eval()

        logger.info("Computing realignment matrix...")
        W_in = self.model.get_input_embeddings().weight
        W_out = self.model.get_output_embeddings().weight
        self.realign_matrix, self.target_norm = compute_realignment_matrix(W_in, W_out)
        self.realign_matrix = self.realign_matrix.to(self.device)
        logger.info(
            "Realignment matrix computed: [%d, %d], target_norm=%.4f",
            self.realign_matrix.shape[0],
            self.realign_matrix.shape[1],
            self.target_norm,
        )

    def tokenize_chat(
        self,
        messages: list[dict[str, str]],
        add_generation_prompt: bool = True,
    ) -> dict[str, torch.Tensor]:
        """Tokenize a ChatML message list using the model's chat template.

        Returns dict with 'input_ids' and 'attention_mask' tensors.
        """
        text = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=add_generation_prompt
        )
        encoded = self.tokenizer(
            text, return_tensors="pt", padding=True, truncation=True
        )
        return {k: v.to(self.device) for k, v in encoded.items()}

    def get_token_count(self, text: str) -> int:
        """Count tokens in a text string."""
        return len(self.tokenizer.encode(text))

    @torch.no_grad()
    def encode_text(
        self, messages: list[dict[str, str]]
    ) -> tuple[torch.Tensor, torch.Tensor]:
        """Single forward pass to get hidden state representation.

        Args:
            messages: ChatML message list

        Returns:
            Tuple of:
            - mean_embedding [hidden_dim]: mean-pooled last-layer hidden state
            - layer_states [n_layers, hidden_dim]: per-layer last-token hidden states
        """
        inputs = self.tokenize_chat(messages, add_generation_prompt=False)

        outputs = self.model(
            **inputs,
            output_hidden_states=True,
            use_cache=False,
        )

        # Extract per-layer hidden states at the last non-padding token
        attention_mask = inputs["attention_mask"]
        # Find the index of the last real token for each batch item
        seq_lengths = attention_mask.sum(dim=1) - 1  # [batch]

        all_hidden = outputs.hidden_states  # tuple of (n_layers+1) x [batch, seq, hidden]

        # Collect last-token hidden state from each layer (skip layer 0 = embeddings)
        layer_states = []
        for layer_idx in range(1, len(all_hidden)):
            # [batch, hidden_dim] for each layer
            h = all_hidden[layer_idx]
            last_token_h = h[0, seq_lengths[0], :]  # [hidden_dim]
            layer_states.append(last_token_h)

        layer_states = torch.stack(layer_states)  # [n_layers, hidden_dim]

        # Mean-pooled embedding from the last layer across all non-padding tokens
        last_layer = all_hidden[-1][0]  # [seq_len, hidden_dim]
        mask = attention_mask[0].unsqueeze(-1).float()  # [seq_len, 1]
        mean_embedding = (last_layer * mask).sum(dim=0) / mask.sum()  # [hidden_dim]

        return mean_embedding, layer_states

    @torch.no_grad()
    def generate_latent_steps(
        self,
        messages: list[dict[str, str]],
        n_steps: int | None = None,
    ) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor, Any]:
        """Run N steps of latent reasoning without generating tokens.

        At each step:
        1. Forward pass to get hidden states
        2. Take last hidden state at final position
        3. Apply realignment matrix to project back to embedding space
        4. Normalize to match embedding distribution
        5. Use as input embedding for next step (grows KV-cache by 1)

        Args:
            messages: ChatML message list
            n_steps: Number of latent reasoning steps

        Returns:
            Tuple of:
            - mean_embedding [hidden_dim]: mean of trajectory for index search
            - layer_states [n_layers, hidden_dim]: per-layer states from initial pass
            - latent_trajectory [n_steps, hidden_dim]: hidden state at each step
            - past_key_values: accumulated KV-cache (for decoding)
        """
        if n_steps is None:
            n_steps = self.profile.latent_steps_compile

        inputs = self.tokenize_chat(messages, add_generation_prompt=True)
        input_ids = inputs["input_ids"]
        attention_mask = inputs["attention_mask"]

        trajectory = []

        # Initial forward pass with token inputs
        outputs = self.model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
            use_cache=True,
        )

        all_hidden = outputs.hidden_states
        last_hidden = all_hidden[-1][:, -1:, :]  # [B, 1, H]
        trajectory.append(last_hidden.squeeze(0).squeeze(0))  # [H]

        # Collect per-layer states from initial pass
        layer_states = torch.stack([
            all_hidden[i][0, -1, :] for i in range(1, len(all_hidden))
        ])  # [n_layers, H]

        past_key_values = outputs.past_key_values

        # Latent reasoning loop
        for _ in range(n_steps - 1):
            # Realign: project hidden → embedding space
            realigned = apply_realignment(
                last_hidden, self.realign_matrix, self.target_norm
            )  # [B, 1, H]

            # Extend attention mask for the new position
            attention_mask = torch.cat([
                attention_mask,
                torch.ones((attention_mask.shape[0], 1), device=self.device, dtype=attention_mask.dtype),
            ], dim=1)

            # Forward pass with embeddings (not token IDs)
            outputs = self.model(
                inputs_embeds=realigned,
                attention_mask=attention_mask,
                past_key_values=past_key_values,
                output_hidden_states=True,
                use_cache=True,
            )

            last_hidden = outputs.hidden_states[-1][:, -1:, :]  # [B, 1, H]
            trajectory.append(last_hidden.squeeze(0).squeeze(0))  # [H]
            past_key_values = outputs.past_key_values

        latent_trajectory = torch.stack(trajectory)  # [n_steps, H]
        mean_embedding = latent_trajectory.mean(dim=0)  # [H]

        return mean_embedding, layer_states, latent_trajectory, past_key_values

    @torch.no_grad()
    def decode_from_latent(
        self,
        latent_embeddings: torch.Tensor,
        decode_messages: list[dict[str, str]],
        max_new_tokens: int = MAX_DECODE_TOKENS,
        temperature: float = DECODE_TEMPERATURE,
        top_p: float = DECODE_TOP_P,
    ) -> str:
        """Decode latent embeddings into text by inserting them into a prompt.

        Process:
        1. Tokenize the decode prompt
        2. Convert tokens to embeddings via embed_tokens
        3. Insert latent embeddings after the user role token
        4. Generate text using the combined embedding sequence

        Args:
            latent_embeddings: Latent tensors to inject [n_latent, hidden_dim]
            decode_messages: ChatML messages for the decode prompt
            max_new_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Top-p sampling parameter

        Returns:
            Generated text string (the dense prompt).
        """
        inputs = self.tokenize_chat(decode_messages, add_generation_prompt=True)
        input_ids = inputs["input_ids"]  # [1, seq_len]
        attention_mask = inputs["attention_mask"]  # [1, seq_len]

        # Convert input tokens to embeddings
        embed_layer = self.model.get_input_embeddings()
        prompt_embeds = embed_layer(input_ids)  # [1, seq_len, H]

        # Realign latent embeddings to embedding space
        latent_2d = latent_embeddings.unsqueeze(0)  # [1, n_latent, H]
        realigned = apply_realignment(
            latent_2d, self.realign_matrix, self.target_norm
        )  # [1, n_latent, H]

        # Find insertion point: after '<|im_start|>user\n' (second occurrence of im_start)
        insert_idx = self._find_user_insert_position(input_ids[0])

        # Insert latent embeddings into the prompt embedding sequence
        left = prompt_embeds[:, :insert_idx, :]
        right = prompt_embeds[:, insert_idx:, :]
        combined_embeds = torch.cat([left, realigned, right], dim=1)  # [1, seq+n_latent, H]

        # Update attention mask
        latent_mask = torch.ones(
            (1, realigned.shape[1]), device=self.device, dtype=attention_mask.dtype
        )
        combined_mask = torch.cat([
            attention_mask[:, :insert_idx],
            latent_mask,
            attention_mask[:, insert_idx:],
        ], dim=1)

        # Generate text
        # We need to use model.generate with inputs_embeds
        # Build position_ids manually since we're using inputs_embeds
        seq_len = combined_embeds.shape[1]

        generated_ids = self._generate_with_embeds(
            combined_embeds, combined_mask, max_new_tokens, temperature, top_p
        )

        # Decode generated token IDs to text
        text = self.tokenizer.decode(generated_ids, skip_special_tokens=True)
        return text.strip()

    def _find_user_insert_position(self, input_ids: torch.Tensor) -> int:
        """Find the position after '<|im_start|>user\\n' for latent insertion.

        Looks for the second occurrence of im_start token (first is system, second is user),
        then advances past 'user' and newline tokens.
        """
        im_start_id = self.tokenizer.encode(
            "<|im_start|>", add_special_tokens=False
        )
        if not im_start_id:
            return input_ids.shape[0] // 2  # Fallback: middle

        im_start_token = im_start_id[0]
        positions = (input_ids == im_start_token).nonzero(as_tuple=True)[0]

        if len(positions) >= 2:
            # After '<|im_start|>user\n' — typically 3 tokens after im_start
            return min(positions[1].item() + 3, input_ids.shape[0])
        elif len(positions) >= 1:
            return min(positions[0].item() + 3, input_ids.shape[0])
        else:
            return input_ids.shape[0] // 2

    @torch.no_grad()
    def _generate_with_embeds(
        self,
        inputs_embeds: torch.Tensor,
        attention_mask: torch.Tensor,
        max_new_tokens: int,
        temperature: float,
        top_p: float,
    ) -> list[int]:
        """Generate tokens autoregressively from embedding inputs.

        Uses a manual generation loop since model.generate() with inputs_embeds
        can have compatibility issues across different transformers versions.
        """
        generated_ids: list[int] = []
        past_key_values = None
        current_embeds = inputs_embeds
        current_mask = attention_mask

        eos_token_id = self.tokenizer.eos_token_id
        im_end_ids = self.tokenizer.encode("<|im_end|>", add_special_tokens=False)
        stop_ids = {eos_token_id}
        if im_end_ids:
            stop_ids.add(im_end_ids[0])

        embed_layer = self.model.get_input_embeddings()

        for _ in range(max_new_tokens):
            outputs = self.model(
                inputs_embeds=current_embeds,
                attention_mask=current_mask,
                past_key_values=past_key_values,
                use_cache=True,
            )

            logits = outputs.logits[:, -1, :]  # [1, vocab_size]
            past_key_values = outputs.past_key_values

            # Apply temperature
            if temperature > 0:
                logits = logits / temperature
                # Top-p filtering
                sorted_logits, sorted_indices = torch.sort(logits, descending=True)
                cumulative_probs = torch.cumsum(torch.softmax(sorted_logits, dim=-1), dim=-1)
                sorted_mask = cumulative_probs - torch.softmax(sorted_logits, dim=-1) >= top_p
                sorted_logits[sorted_mask] = float("-inf")
                probs = torch.softmax(sorted_logits, dim=-1)
                next_token_idx = torch.multinomial(probs, num_samples=1)
                next_token_id = sorted_indices[0, next_token_idx[0, 0]].item()
            else:
                next_token_id = logits.argmax(dim=-1).item()

            if next_token_id in stop_ids:
                break

            generated_ids.append(next_token_id)

            # Prepare next step input
            next_embed = embed_layer(
                torch.tensor([[next_token_id]], device=self.device)
            )  # [1, 1, H]
            current_embeds = next_embed
            current_mask = torch.cat([
                current_mask,
                torch.ones((1, 1), device=self.device, dtype=current_mask.dtype),
            ], dim=1)

        return generated_ids

    def cleanup(self) -> None:
        """Release model from memory."""
        if self.model is not None:
            del self.model
            self.model = None
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
        self.realign_matrix = None
        gc.collect()
        logger.info("Model resources released.")
