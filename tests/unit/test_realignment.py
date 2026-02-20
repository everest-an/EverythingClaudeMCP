"""Tests for realignment matrix computation."""

import torch

from src.adapter.realignment import apply_realignment, compute_realignment_matrix


def test_compute_realignment_tied_weights():
    """When W_in == W_out (tied weights), M* should be near identity."""
    V, H = 100, 32
    W = torch.randn(V, H)
    M, target_norm = compute_realignment_matrix(W, W)

    assert M.shape == (H, H)
    identity = torch.eye(H)
    # M should be close to I when weights are tied
    diff = (M - identity).abs().mean().item()
    assert diff < 0.1, f"M too far from identity for tied weights: mean diff = {diff}"
    assert target_norm > 0


def test_compute_realignment_untied_weights():
    """When W_in != W_out (untied weights), M* should not be identity."""
    V, H = 100, 32
    W_in = torch.randn(V, H)
    W_out = torch.randn(V, H)
    M, target_norm = compute_realignment_matrix(W_in, W_out)

    assert M.shape == (H, H)
    identity = torch.eye(H)
    diff = (M - identity).abs().mean().item()
    assert diff > 0.05, f"M should differ from identity for untied weights: mean diff = {diff}"
    assert target_norm > 0


def test_apply_realignment_shape_preserved():
    """Output shape should match input shape."""
    H = 32
    hidden = torch.randn(1, 1, H)
    M = torch.eye(H)
    target_norm = 1.0

    out = apply_realignment(hidden, M, target_norm)
    assert out.shape == hidden.shape


def test_apply_realignment_normalization():
    """Output should be normalized to target_norm."""
    H = 32
    hidden = torch.randn(1, 1, H)
    M = torch.eye(H)
    target_norm = 2.5

    out = apply_realignment(hidden, M, target_norm)
    actual_norm = out[0, 0].norm().item()
    assert abs(actual_norm - target_norm) < 0.01


def test_apply_realignment_batch():
    """Should work with batched input."""
    B, S, H = 2, 3, 32
    hidden = torch.randn(B, S, H)
    M = torch.randn(H, H)
    target_norm = 1.0

    out = apply_realignment(hidden, M, target_norm)
    assert out.shape == (B, S, H)


def test_apply_realignment_dtype_preserved():
    """Output dtype should match input dtype."""
    H = 32
    hidden = torch.randn(1, 1, H, dtype=torch.float32)
    M = torch.eye(H)

    out = apply_realignment(hidden, M, target_norm=1.0)
    assert out.dtype == torch.float32
