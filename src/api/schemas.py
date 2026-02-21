"""Pydantic request/response models for the AwesomeContext API."""

from __future__ import annotations

from uuid import uuid4

from pydantic import BaseModel, Field


class LatentQueryRequest(BaseModel):
    """Request body for POST /v1/latent/query."""

    intent: str | None = Field(default=None, description="User intent (architect_consult)")
    session_id: str = Field(default_factory=lambda: str(uuid4()), description="Session ID")
    memory_partition: str = Field(default="default", description="Retrieval partition namespace")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of modules to retrieve")
    module_type_filter: str | None = Field(default=None, description="Filter: agent/skill/rule/...")
    tool_name: str = Field(..., description="MCP tool that invoked this query")
    skill_id: str | None = Field(default=None, description="Direct skill ID (skill_injector)")
    code: str | None = Field(default=None, description="Code to check (compliance_verify)")


class MatchedModule(BaseModel):
    """A module matched during retrieval."""

    module_id: str
    name: str
    module_type: str
    score: float
    description: str


class QueryMetrics(BaseModel):
    """Performance metrics for a query."""

    tokens_saved: int = Field(description="Tokens saved vs. injecting full markdown")
    retrieval_time_ms: float
    decode_time_ms: float
    total_time_ms: float
    modules_searched: int
    modules_matched: int


class LatentQueryResponse(BaseModel):
    """Response body for POST /v1/latent/query."""

    dense_prompt: str = Field(description="High-density compressed instructions (< 150 tokens)")
    latent_id: str
    session_id: str
    metrics: QueryMetrics
    matched_modules: list[MatchedModule]


class ModuleListItem(BaseModel):
    """An item in the module listing."""

    module_id: str
    name: str
    module_type: str
    description: str
    token_count: int


class ModuleListResponse(BaseModel):
    """Response for GET /v1/modules/list."""

    modules: list[ModuleListItem]
    total: int


class HealthResponse(BaseModel):
    """Response for GET /v1/health."""

    status: str
    model_loaded: bool
    index_loaded: bool
    modules_count: int
