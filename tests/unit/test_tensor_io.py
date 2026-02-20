"""Tests for safetensors I/O operations."""

import os
import tempfile

import torch

from src.shared.tensor_io import load_all_tensors, load_metadata, load_tensor, save_tensors


def test_save_and_load_roundtrip():
    """Save tensors and load them back; values should match."""
    with tempfile.TemporaryDirectory() as tmpdir:
        path = os.path.join(tmpdir, "test.safetensors")
        tensors = {
            "embedding": torch.randn(256),
            "states": torch.randn(4, 256),
        }
        metadata = {"module_id": "test/module", "name": "Test"}

        save_tensors(tensors, path, metadata=metadata)
        assert os.path.exists(path)

        # Load single tensor
        emb = load_tensor(path, "embedding")
        assert emb.shape == (256,)
        assert torch.allclose(emb, tensors["embedding"])

        # Load all tensors
        loaded = load_all_tensors(path)
        assert set(loaded.keys()) == {"embedding", "states"}
        assert torch.allclose(loaded["states"], tensors["states"])

        # Load metadata
        meta = load_metadata(path)
        assert meta["module_id"] == "test/module"
        assert meta["name"] == "Test"


def test_save_creates_directories():
    """save_tensors should create parent directories."""
    with tempfile.TemporaryDirectory() as tmpdir:
        path = os.path.join(tmpdir, "nested", "deep", "test.safetensors")
        save_tensors({"t": torch.zeros(10)}, path)
        assert os.path.exists(path)


def test_load_metadata_empty():
    """File without metadata should return empty dict."""
    with tempfile.TemporaryDirectory() as tmpdir:
        path = os.path.join(tmpdir, "no_meta.safetensors")
        save_tensors({"t": torch.zeros(5)}, path)
        meta = load_metadata(path)
        assert isinstance(meta, dict)
