"""Shared type definitions for AwesomeContext Gateway."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ParsedModule:
    """A parsed markdown module from everything-claude-code."""

    module_id: str  # e.g., "agents/architect" or "skills/security-review"
    module_type: str  # "agent", "skill", "rule", "hook", "command", "context"
    name: str  # From YAML frontmatter 'name' field, or derived from filename
    description: str  # From YAML frontmatter 'description' field
    content: str  # Full markdown body (post-frontmatter)
    source_path: str  # Absolute path to source file
    metadata: dict[str, Any] = field(default_factory=dict)  # All YAML frontmatter fields
    content_hash: str = ""  # SHA-256 of content

    def __post_init__(self):
        if not self.content_hash and self.content:
            self.content_hash = hashlib.sha256(self.content.encode()).hexdigest()


@dataclass
class EncodedModule:
    """A module that has been encoded into latent tensors."""

    module_id: str
    module_type: str
    name: str
    description: str
    mean_embedding: Any  # torch.Tensor [hidden_dim]
    layer_states: Any  # torch.Tensor [n_layers, hidden_dim]
    latent_trajectory: Any  # torch.Tensor [latent_steps, hidden_dim]
    content_hash: str
    token_count: int  # Original token count of source markdown
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class RetrievedModule:
    """A module retrieved from the tensor store with loaded tensors."""

    module_id: str
    name: str
    module_type: str
    description: str
    score: float
    layer_states: Any  # torch.Tensor [n_layers, hidden_dim]
    latent_trajectory: Any  # torch.Tensor [latent_steps, hidden_dim]
    original_token_count: int = 0
