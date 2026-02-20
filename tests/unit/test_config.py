"""Tests for multi-model configuration."""

from src.adapter.config import (
    MODEL_PROFILES,
    ModelProfile,
    get_profile,
    resolve_device,
    resolve_dtype,
)


def test_all_profiles_registered():
    assert "Qwen/Qwen3-4B" in MODEL_PROFILES
    assert "Qwen/Qwen3-14B" in MODEL_PROFILES
    assert "Qwen/Qwen2.5-Coder-1.5B-Instruct" in MODEL_PROFILES


def test_qwen3_4b_profile():
    p = MODEL_PROFILES["Qwen/Qwen3-4B"]
    assert p.hidden_size == 2560
    assert p.num_hidden_layers == 36
    assert p.tie_word_embeddings is False
    assert p.recommended_dtype == "bfloat16"
    assert p.recommended_device == "cuda"
    assert p.latent_steps_compile == 8


def test_qwen3_14b_profile():
    p = MODEL_PROFILES["Qwen/Qwen3-14B"]
    assert p.hidden_size == 5120
    assert p.num_hidden_layers == 40
    assert p.tie_word_embeddings is False
    assert p.latent_steps_compile == 10


def test_qwen25_profile():
    p = MODEL_PROFILES["Qwen/Qwen2.5-Coder-1.5B-Instruct"]
    assert p.hidden_size == 1536
    assert p.num_hidden_layers == 28
    assert p.tie_word_embeddings is True
    assert p.recommended_dtype == "float32"
    assert p.recommended_device == "cpu"
    assert p.latent_steps_compile == 5


def test_get_profile_default():
    p = get_profile()
    assert isinstance(p, ModelProfile)
    assert p.model_name in MODEL_PROFILES


def test_get_profile_explicit():
    p = get_profile("Qwen/Qwen3-14B")
    assert p.model_name == "Qwen/Qwen3-14B"


def test_get_profile_unknown_raises():
    try:
        get_profile("Unknown/Model")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Unknown model" in str(e)


def test_resolve_device_cpu_fallback():
    """CPU profile should always resolve to cpu."""
    p = MODEL_PROFILES["Qwen/Qwen2.5-Coder-1.5B-Instruct"]
    assert resolve_device(p) == "cpu"


def test_resolve_dtype_cpu():
    """CPU should always use float32."""
    import torch
    p = MODEL_PROFILES["Qwen/Qwen2.5-Coder-1.5B-Instruct"]
    assert resolve_dtype(p, "cpu") == torch.float32
