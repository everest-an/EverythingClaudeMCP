"""Safetensors I/O wrappers for latent tensor persistence."""

from __future__ import annotations

import logging
import os
from typing import Any

try:
    import torch
    from safetensors.torch import save_file
    _HAS_TORCH = True
except ImportError:
    torch = None  # type: ignore[assignment]
    _HAS_TORCH = False

from safetensors import safe_open

logger = logging.getLogger(__name__)

_FRAMEWORK = "pt" if _HAS_TORCH else "np"


def save_tensors(
    tensors: dict[str, Any],
    filepath: str,
    metadata: dict[str, str] | None = None,
) -> None:
    """Save tensors to a safetensors file with optional metadata."""
    if not _HAS_TORCH:
        raise RuntimeError("torch is required for save_tensors")
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    save_file(tensors, filepath, metadata=metadata)
    logger.debug("Saved tensors to %s (%d tensors)", filepath, len(tensors))


def load_tensor(filepath: str, tensor_name: str) -> Any:
    """Load a single tensor from a safetensors file using mmap."""
    with safe_open(filepath, framework=_FRAMEWORK, device="cpu") as f:
        return f.get_tensor(tensor_name)


def load_all_tensors(filepath: str) -> dict[str, Any]:
    """Load all tensors from a safetensors file."""
    with safe_open(filepath, framework=_FRAMEWORK, device="cpu") as f:
        return {key: f.get_tensor(key) for key in f.keys()}


def load_metadata(filepath: str) -> dict[str, str]:
    """Load metadata from a safetensors file without loading tensors."""
    with safe_open(filepath, framework=_FRAMEWORK, device="cpu") as f:
        return dict(f.metadata()) if f.metadata() else {}
