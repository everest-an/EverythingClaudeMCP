"""Safetensors persistence for compiled latent modules.

Each module gets its own .safetensors file containing:
- mean_embedding [hidden_dim]: for similarity search
- layer_states [n_layers, hidden_dim]: per-layer hidden states
- latent_trajectory [latent_steps, hidden_dim]: reasoning trajectory

Metadata stored as safetensors string metadata:
- module_id, module_type, name, description, content_hash, token_count
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from ..shared.tensor_io import load_all_tensors, load_metadata, load_tensor, save_tensors
from ..shared.types import EncodedModule

logger = logging.getLogger(__name__)


def _sanitize_filename(module_id: str) -> str:
    """Sanitize module_id for use as a filename on all platforms.

    Replaces characters invalid on Windows (|, <, >, :, ", ?, *) with '--'.
    """
    for ch in ('|', '<', '>', ':', '"', '?', '*'):
        module_id = module_id.replace(ch, '--')
    return module_id


def save_encoded_module(encoded: EncodedModule, base_dir: str) -> str:
    """Save an encoded module to a .safetensors file.

    Args:
        encoded: The encoded module with tensors
        base_dir: Base directory for tensor storage (e.g., 'data/tensors')

    Returns:
        The file path where the module was saved
    """
    tensors = {
        "mean_embedding": encoded.mean_embedding,
        "layer_states": encoded.layer_states,
        "latent_trajectory": encoded.latent_trajectory,
    }

    metadata = {
        "module_id": encoded.module_id,
        "module_type": encoded.module_type,
        "name": encoded.name,
        "description": encoded.description[:500],  # Truncate long descriptions
        "content_hash": encoded.content_hash,
        "token_count": str(encoded.token_count),
    }

    # Build file path: base_dir/{type}s/{id}.safetensors
    # module_id like "agents/architect" → "agents/architect.safetensors"
    # module_id like "rules/common--coding-style" → "rules/common--coding-style.safetensors"
    safe_id = _sanitize_filename(encoded.module_id)
    filename = safe_id.replace("/", os.sep) + ".safetensors"
    filepath = os.path.join(base_dir, filename)

    save_tensors(tensors, filepath, metadata=metadata)

    logger.info("Saved %s → %s", encoded.module_id, filepath)
    return filepath


def load_module_tensor(base_dir: str, module_id: str, tensor_name: str):
    """Load a single tensor from a module's safetensors file via mmap.

    Args:
        base_dir: Base directory for tensor storage
        module_id: Module identifier (e.g., "skills/security-review")
        tensor_name: Name of tensor to load (e.g., "mean_embedding")

    Returns:
        The loaded tensor
    """
    filepath = _module_filepath(base_dir, module_id)
    return load_tensor(filepath, tensor_name)


def load_module_all(base_dir: str, module_id: str):
    """Load all tensors from a module's safetensors file.

    Returns:
        Dict of tensor_name -> tensor
    """
    filepath = _module_filepath(base_dir, module_id)
    return load_all_tensors(filepath)


def load_module_metadata(base_dir: str, module_id: str) -> dict[str, str]:
    """Load metadata from a module's safetensors file without loading tensors."""
    filepath = _module_filepath(base_dir, module_id)
    return load_metadata(filepath)


def delete_module(base_dir: str, module_id: str) -> bool:
    """Delete a module's safetensors file.

    Returns:
        True if the file was deleted, False if it didn't exist.
    """
    filepath = _module_filepath(base_dir, module_id)
    if os.path.exists(filepath):
        os.remove(filepath)
        logger.info("Deleted %s", filepath)
        return True
    return False


def list_compiled_modules(base_dir: str) -> list[str]:
    """List all compiled module IDs in the tensor directory.

    Returns:
        List of module_id strings
    """
    base = Path(base_dir)
    if not base.exists():
        return []

    module_ids = []
    for safetensor_file in base.rglob("*.safetensors"):
        # Convert path back to module_id
        relative = safetensor_file.relative_to(base)
        module_id = str(relative.with_suffix("")).replace(os.sep, "/")
        module_ids.append(module_id)

    return sorted(module_ids)


def _module_filepath(base_dir: str, module_id: str) -> str:
    """Convert module_id to filesystem path."""
    safe_id = _sanitize_filename(module_id)
    filename = safe_id.replace("/", os.sep) + ".safetensors"
    return os.path.join(base_dir, filename)
