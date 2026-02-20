"""Realignment matrix computation for latent space projection.

The realignment matrix M* solves the ridge regression problem:
    M* = argmin_M  || W_out @ M - W_in ||^2  +  lambda * ||M||^2

This projects hidden states (output space) back to embedding space (input space),
enabling the latent reasoning loop where hidden states are re-fed as embeddings.

Behavior varies by model:
- Qwen3-4B/14B (tie_word_embeddings=False): full Ridge Regression, richer projection
- Qwen2.5-1.5B (tie_word_embeddings=True): M* ≈ I, very stable loop
"""

from __future__ import annotations

import torch

from .config import REALIGN_LAMBDA


def compute_realignment_matrix(
    embed_weight: torch.Tensor,
    lm_head_weight: torch.Tensor,
    reg_lambda: float = REALIGN_LAMBDA,
) -> tuple[torch.Tensor, float, float]:
    """Compute the realignment matrix M* via ridge regression.

    Args:
        embed_weight: Input embedding matrix W_in [vocab_size, hidden_dim]
        lm_head_weight: Output head matrix W_out [vocab_size, hidden_dim]
        reg_lambda: Tikhonov regularization parameter

    Returns:
        Tuple of (M [hidden_dim, hidden_dim], target_norm, target_mean_norm)
        where target_norm is the mean L2 norm of input embeddings.
    """
    W_in = embed_weight.detach().float()
    W_out = lm_head_weight.detach().float()

    H = W_in.shape[1]  # hidden_dim

    # Gram matrix: W_out^T @ W_out + lambda * I
    gram = W_out.T @ W_out  # [H, H]
    gram += reg_lambda * torch.eye(H, device=gram.device, dtype=gram.dtype)

    # Target: W_out^T @ W_in
    target = W_out.T @ W_in  # [H, H]

    # Solve: gram @ M = target  =>  M = gram^{-1} @ target
    M = torch.linalg.solve(gram, target)  # [H, H]

    # Compute target embedding statistics for normalization
    with torch.no_grad():
        # Sample a subset for efficiency (first 2000 embeddings)
        sample = W_in[:2000]
        target_norm = sample.norm(dim=1).mean().item()

    return M, target_norm


def apply_realignment(
    hidden_state: torch.Tensor,
    realign_matrix: torch.Tensor,
    target_norm: float,
) -> torch.Tensor:
    """Apply realignment matrix to project hidden states back to embedding space.

    Args:
        hidden_state: Hidden state tensor [batch, 1, hidden_dim] or [batch, seq, hidden_dim]
        realign_matrix: Realignment matrix M [hidden_dim, hidden_dim]
        target_norm: Target L2 norm for the projected embeddings

    Returns:
        Projected embedding tensor with same shape as input, normalized to target_norm.
    """
    original_dtype = hidden_state.dtype
    h = hidden_state.float()

    # Project: h @ M
    projected = h @ realign_matrix  # same shape as input

    # Normalize to match input embedding scale
    norms = projected.norm(dim=-1, keepdim=True).clamp_min(1e-8)
    projected = projected * (target_norm / norms)

    return projected.to(original_dtype)
