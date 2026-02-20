"""Safetensors I/O wrappers for latent tensor persistence."""

from __future__ import annotations

import logging
import os
from typing import Any

import torch
from safetensors import safe_open
from safetensors.torch import save_file

logger = logging.getLogger(__name__)


def save_tensors(
    tensors: dict[str, torch.Tensor],
    filepath: str,
    metadata: dict[str, str] | None = None,
) -> None:
    """Save tensors to a safetensors file with optional metadata.

    Args:
        tensors: Dict of tensor_name -> tensor
        filepath: Output file path
        metadata: Optional string-valued metadata dict
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    save_file(tensors, filepath, metadata=metadata)
    logger.debug("Saved tensors to %s (%d tensors)", filepath, len(tensors))


def load_tensor(filepath: str, tensor_name: str) -> torch.Tensor:
    """Load a single tensor from a safetensors file using mmap.

    Uses safe_open which employs mmap internally, loading only the
    requested tensor without reading the entire file into RAM.
    """
    with safe_open(filepath, framework="pt", device="cpu") as f:
        return f.get_tensor(tensor_name)


def load_all_tensors(filepath: str) -> dict[str, torch.Tensor]:
    """Load all tensors from a safetensors file."""
    with safe_open(filepath, framework="pt", device="cpu") as f:
        return {key: f.get_tensor(key) for key in f.keys()}


def load_metadata(filepath: str) -> dict[str, str]:
    """Load metadata from a safetensors file without loading tensors."""
    with safe_open(filepath, framework="pt", device="cpu") as f:
        return dict(f.metadata()) if f.metadata() else {}
