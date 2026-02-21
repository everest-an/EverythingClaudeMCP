"""Multi-model configuration for AwesomeContext Gateway.

Supports:
- Qwen3-4B (default) — latent-engine native, GPU bfloat16
- Qwen3-14B — highest quality, GPU bfloat16
- Qwen2.5-Coder-1.5B-Instruct — lightweight CPU fallback
"""

from __future__ import annotations

import os
from dataclasses import dataclass

try:
    import torch
except ImportError:
    torch = None  # type: ignore[assignment]


# ---------------------------------------------------------------------------
# Model profiles
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ModelProfile:
    """Architecture profile for a supported model."""

    model_name: str
    model_type: str
    hidden_size: int
    num_hidden_layers: int
    num_attention_heads: int
    num_key_value_heads: int
    intermediate_size: int
    vocab_size: int
    max_position_embeddings: int
    tie_word_embeddings: bool
    recommended_dtype: str  # "bfloat16" or "float32"
    recommended_device: str  # "cuda" or "cpu"
    latent_steps_compile: int
    latent_steps_runtime: int


MODEL_PROFILES: dict[str, ModelProfile] = {
    "Qwen/Qwen3-4B": ModelProfile(
        model_name="Qwen/Qwen3-4B",
        model_type="qwen3",
        hidden_size=2560,
        num_hidden_layers=36,
        num_attention_heads=32,
        num_key_value_heads=4,
        intermediate_size=9216,
        vocab_size=151936,
        max_position_embeddings=40960,
        tie_word_embeddings=False,
        recommended_dtype="bfloat16",
        recommended_device="cuda",
        latent_steps_compile=8,
        latent_steps_runtime=5,
    ),
    "Qwen/Qwen3-14B": ModelProfile(
        model_name="Qwen/Qwen3-14B",
        model_type="qwen3",
        hidden_size=5120,
        num_hidden_layers=40,
        num_attention_heads=40,
        num_key_value_heads=8,
        intermediate_size=17408,
        vocab_size=151936,
        max_position_embeddings=40960,
        tie_word_embeddings=False,
        recommended_dtype="bfloat16",
        recommended_device="cuda",
        latent_steps_compile=10,
        latent_steps_runtime=5,
    ),
    "Qwen/Qwen2.5-Coder-1.5B-Instruct": ModelProfile(
        model_name="Qwen/Qwen2.5-Coder-1.5B-Instruct",
        model_type="qwen2",
        hidden_size=1536,
        num_hidden_layers=28,
        num_attention_heads=12,
        num_key_value_heads=2,
        intermediate_size=8960,
        vocab_size=151936,
        max_position_embeddings=32768,
        tie_word_embeddings=True,
        recommended_dtype="float32",
        recommended_device="cpu",
        latent_steps_compile=5,
        latent_steps_runtime=3,
    ),
}


# ---------------------------------------------------------------------------
# Active model selection
# ---------------------------------------------------------------------------

def _resolve_default_model() -> str:
    """Determine the default model based on environment and hardware.

    Priority:
    1. AC_MODEL env var (explicit override)
    2. Qwen3-4B if CUDA is available
    3. Qwen2.5-Coder-1.5B-Instruct as CPU fallback
    """
    env_model = os.environ.get("AC_MODEL")
    if env_model and env_model in MODEL_PROFILES:
        return env_model

    if torch is not None and torch.cuda.is_available():
        return "Qwen/Qwen3-4B"

    return "Qwen/Qwen2.5-Coder-1.5B-Instruct"


def get_profile(model_name: str | None = None) -> ModelProfile:
    """Get the model profile for the given model name (or default)."""
    name = model_name or _resolve_default_model()
    if name not in MODEL_PROFILES:
        raise ValueError(
            f"Unknown model: {name}. "
            f"Supported: {', '.join(MODEL_PROFILES.keys())}"
        )
    return MODEL_PROFILES[name]


def resolve_device(profile: ModelProfile) -> str:
    """Resolve the actual device to use based on profile and hardware."""
    if torch is not None and profile.recommended_device == "cuda" and torch.cuda.is_available():
        return "cuda"
    return "cpu"


def resolve_dtype(profile: ModelProfile, device: str):
    """Resolve the actual torch dtype based on profile and device."""
    if torch is None:
        return None
    if device == "cuda" and profile.recommended_dtype == "bfloat16":
        return torch.bfloat16
    return torch.float32


# ---------------------------------------------------------------------------
# Default active profile (for backward compatibility)
# ---------------------------------------------------------------------------

DEFAULT_MODEL_NAME = _resolve_default_model()
_default_profile = get_profile(DEFAULT_MODEL_NAME)

# Expose commonly used values at module level for backward compat
MODEL_NAME = _default_profile.model_name
MODEL_TYPE = _default_profile.model_type
HIDDEN_SIZE = _default_profile.hidden_size
NUM_HIDDEN_LAYERS = _default_profile.num_hidden_layers
VOCAB_SIZE = _default_profile.vocab_size
TIE_WORD_EMBEDDINGS = _default_profile.tie_word_embeddings

# ChatML special tokens (shared across Qwen2.5 and Qwen3)
IM_START = "<|im_start|>"
IM_END = "<|im_end|>"
ENDOFTEXT = "<|endoftext|>"

# Realignment hyperparameters
REALIGN_LAMBDA = 1e-4  # Tikhonov regularization for ridge regression

# Latent step defaults (from active profile)
LATENT_STEPS_COMPILE = _default_profile.latent_steps_compile
LATENT_STEPS_RUNTIME = _default_profile.latent_steps_runtime

# Decode parameters
MAX_DECODE_TOKENS = 150  # Maximum tokens for dense prompt output
DECODE_TEMPERATURE = 0.3  # Low temperature for deterministic output
DECODE_TOP_P = 0.9

# Index parameters
DEFAULT_TOP_K = 3  # Default number of modules to retrieve
MIN_SIMILARITY_SCORE = 0.3  # Minimum cosine similarity threshold

# Server configuration
FASTAPI_HOST = os.environ.get("HOST", os.environ.get("FASTAPI_HOST", "127.0.0.1"))
FASTAPI_PORT = int(os.environ.get("PORT", os.environ.get("FASTAPI_PORT", "8420")))

# Retrieval-only mode: skip model loading and decode, return module metadata only.
# Ideal for cloud deployment where you only need semantic search (~5ms per query).
RETRIEVAL_ONLY = os.environ.get("AC_RETRIEVAL_ONLY", "").lower() in ("1", "true", "yes")
