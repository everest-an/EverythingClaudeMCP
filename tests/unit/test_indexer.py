"""Tests for cosine similarity index."""

import os
import tempfile

import numpy as np
import torch

from src.compiler.indexer import NumpyIndex
from src.shared.types import EncodedModule


def _make_encoded(module_id: str, embedding: torch.Tensor) -> EncodedModule:
    """Helper to create an EncodedModule with a specific embedding."""
    return EncodedModule(
        module_id=module_id,
        module_type="skill",
        name=module_id.split("/")[-1],
        description="test",
        mean_embedding=embedding,
        layer_states=torch.zeros(4, embedding.shape[0]),
        latent_trajectory=torch.zeros(5, embedding.shape[0]),
        content_hash="abc123",
        token_count=100,
    )


def test_build_index():
    H = 32
    modules = [
        _make_encoded("skills/a", torch.randn(H)),
        _make_encoded("skills/b", torch.randn(H)),
        _make_encoded("rules/c", torch.randn(H)),
    ]
    index = NumpyIndex()
    index.build(modules)

    assert index.embeddings is not None
    assert index.embeddings.shape == (3, H)
    assert len(index.entries) == 3


def test_query_returns_top_k():
    H = 32
    # Create known vectors: one aligned with query, others random
    query = np.ones(H, dtype=np.float32)
    modules = [
        _make_encoded("skills/aligned", torch.ones(H)),  # Cosine sim = 1.0
        _make_encoded("skills/random1", torch.randn(H)),
        _make_encoded("skills/random2", torch.randn(H)),
    ]
    index = NumpyIndex()
    index.build(modules)

    results = index.query(query, top_k=2, min_score=-1.0)
    assert len(results) <= 2
    # First result should be the aligned vector
    assert results[0][0].module_id == "skills/aligned"
    assert results[0][1] > 0.99


def test_query_module_type_filter():
    H = 32
    # Use known vectors so the rule entry is highly similar to query
    rule_vec = torch.ones(H)
    skill_vec = -torch.ones(H)

    modules = [
        _make_encoded("skills/a", skill_vec),
        EncodedModule(
            module_id="rules/b", module_type="rule", name="b", description="",
            mean_embedding=rule_vec, layer_states=torch.zeros(4, H),
            latent_trajectory=torch.zeros(5, H), content_hash="x", token_count=50,
        ),
    ]
    index = NumpyIndex()
    index.build(modules)

    query = np.ones(H, dtype=np.float32)
    # min_score=0.0 filters out entries whose score was set to -1.0 by the type filter
    results = index.query(query, top_k=5, module_type_filter="rule", min_score=0.0)
    assert len(results) >= 1
    for entry, score in results:
        assert entry.module_type == "rule"


def test_query_min_score_filter():
    H = 32
    modules = [_make_encoded("skills/x", torch.randn(H)) for _ in range(5)]
    index = NumpyIndex()
    index.build(modules)

    results_low = index.query(np.random.randn(H).astype(np.float32), top_k=5, min_score=-1.0)
    results_high = index.query(np.random.randn(H).astype(np.float32), top_k=5, min_score=0.99)
    assert len(results_low) >= len(results_high)


def test_get_by_id():
    H = 32
    modules = [
        _make_encoded("skills/target", torch.randn(H)),
        _make_encoded("skills/other", torch.randn(H)),
    ]
    index = NumpyIndex()
    index.build(modules)

    found = index.get_by_id("skills/target")
    assert found is not None
    assert found.module_id == "skills/target"

    assert index.get_by_id("nonexistent") is None


def test_save_and_load():
    H = 32
    modules = [_make_encoded(f"skills/{i}", torch.randn(H)) for i in range(5)]
    index = NumpyIndex()
    index.build(modules)

    with tempfile.TemporaryDirectory() as tmpdir:
        index.save(tmpdir)
        assert os.path.exists(os.path.join(tmpdir, "embeddings.npy"))
        assert os.path.exists(os.path.join(tmpdir, "manifest.json"))

        loaded = NumpyIndex()
        loaded.load(tmpdir)
        assert loaded.embeddings.shape == (5, H)
        assert len(loaded.entries) == 5


def test_empty_index_query():
    index = NumpyIndex()
    results = index.query(np.zeros(32, dtype=np.float32))
    assert results == []
