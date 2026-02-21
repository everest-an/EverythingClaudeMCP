"""FastAPI route handlers for the AwesomeContext API."""

from __future__ import annotations

import logging
import time
from uuid import uuid4

from fastapi import APIRouter, Request

from .schemas import (
    HealthResponse,
    LatentQueryRequest,
    LatentQueryResponse,
    MatchedModule,
    ModuleListItem,
    ModuleListResponse,
    QueryMetrics,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _build_metadata_prompt(retrieved, tool_name: str) -> str:
    """Build a structured text response from module metadata (fallback when no content)."""
    lines = [f"# Matched Modules ({tool_name})\n"]
    for i, m in enumerate(retrieved, 1):
        lines.append(f"## {i}. {m.name} [{m.module_type}] (score: {m.score:.3f})")
        lines.append(f"ID: {m.module_id}")
        lines.append(f"Description: {m.description}")
        lines.append(f"Original tokens: {m.original_token_count}")
        lines.append("")
    return "\n".join(lines)


def _build_source_prompt(retrieved, tool_name: str, content_store) -> str:
    """Build a rich prompt with actual source markdown content from the content store."""
    sections = []
    for i, m in enumerate(retrieved, 1):
        source = content_store.get(m.module_id)
        if source:
            sections.append(
                f"# [{m.module_type}] {m.name} (score: {m.score:.3f})\n\n{source}"
            )
        else:
            sections.append(
                f"# [{m.module_type}] {m.name} (score: {m.score:.3f})\n"
                f"ID: {m.module_id}\n"
                f"Description: {m.description}\n"
                f"Original tokens: {m.original_token_count}"
            )
    return "\n\n---\n\n".join(sections)


@router.post("/latent/query", response_model=LatentQueryResponse)
async def latent_query(body: LatentQueryRequest, request: Request):
    """Main query endpoint. Handles all three MCP tool types:

    - architect_consult: intent-based retrieval across all module types
    - skill_injector: direct skill_id lookup
    - compliance_verify: encode code, match against rules
    """
    t_start = time.perf_counter()

    retriever = request.app.state.retriever
    session_mgr = request.app.state.session_manager
    retrieval_only = getattr(request.app.state, "retrieval_only", False)
    intent_encoder = request.app.state.intent_encoder if not retrieval_only else None
    decoder = request.app.state.decoder if not retrieval_only else None

    # Route based on tool type
    if body.tool_name == "skill_injector" and body.skill_id:
        # Direct lookup by skill_id
        t_retrieve = time.perf_counter()
        module = retriever.retrieve_by_id(body.skill_id)
        retrieved = [module] if module else []
        retrieval_ms = (time.perf_counter() - t_retrieve) * 1000
    else:
        # Intent-based retrieval
        # compliance_verify prefers code, but falls back to intent for keyword mode
        query_text = (body.code or body.intent) if body.tool_name == "compliance_verify" else body.intent
        if not query_text:
            return LatentQueryResponse(
                dense_prompt="Error: no intent or code provided for query.",
                latent_id=str(uuid4()),
                session_id=body.session_id,
                metrics=QueryMetrics(
                    tokens_saved=0,
                    retrieval_time_ms=0,
                    decode_time_ms=0,
                    total_time_ms=0,
                    modules_searched=0,
                    modules_matched=0,
                ),
                matched_modules=[],
            )

        t_retrieve = time.perf_counter()
        type_filter = body.module_type_filter
        if body.tool_name == "compliance_verify" and not type_filter:
            type_filter = "rule"  # Default to rules for compliance checks

        # Exclude hooks/contexts from intent queries (they're lifecycle events,
        # not knowledge modules, and their short content causes hub bias)
        exclude = None
        if body.tool_name == "architect_consult" and not type_filter:
            exclude = {"hook", "context"}

        if intent_encoder:
            # Full mode: encode intent → cosine search
            t_encode = time.perf_counter()
            query_vec = intent_encoder.encode(query_text)
            encode_ms = (time.perf_counter() - t_encode) * 1000
            logger.debug("Intent encoding: %.1fms", encode_ms)

            retrieved = retriever.retrieve(
                query_vec,
                top_k=body.top_k,
                module_type_filter=type_filter,
                query_text=query_text,
                exclude_types=exclude,
            )
        else:
            # Retrieval-only mode: keyword-based search on index metadata
            retrieved = retriever.retrieve_by_keywords(
                query_text=query_text,
                top_k=body.top_k,
                module_type_filter=type_filter,
                exclude_types=exclude,
            )
        retrieval_ms = (time.perf_counter() - t_retrieve) * 1000

    # Decode latent states to dense text (or return source content)
    t_decode = time.perf_counter()
    content_store = getattr(request.app.state, "content_store", None)
    if not retrieved:
        dense_prompt = "No matching modules found for this query."
    elif decoder:
        dense_prompt = decoder.decode(retrieved, tool_name=body.tool_name)
    elif content_store and len(content_store) > 0:
        # Retrieval-only with content store: return actual source markdown
        dense_prompt = _build_source_prompt(retrieved, body.tool_name, content_store)
    else:
        # Fallback: metadata-only response
        dense_prompt = _build_metadata_prompt(retrieved, body.tool_name)
    decode_ms = (time.perf_counter() - t_decode) * 1000

    total_ms = (time.perf_counter() - t_start) * 1000

    # Calculate token savings
    original_tokens = sum(m.original_token_count for m in retrieved)
    wrapper = request.app.state.wrapper
    if wrapper:
        dense_tokens = wrapper.get_token_count(dense_prompt)
    else:
        dense_tokens = len(dense_prompt.split()) * 1.3  # rough estimate
    tokens_saved = max(0, int(original_tokens - dense_tokens))

    # Update session
    query_text = body.intent or body.code or body.skill_id or ""
    session_mgr.record_query(
        session_id=body.session_id,
        query=query_text,
        module_ids=[m.module_id for m in retrieved],
        tokens_saved=tokens_saved,
    )

    logger.info(
        "Query [%s]: %d modules matched, %d tokens saved, %.0fms total",
        body.tool_name,
        len(retrieved),
        tokens_saved,
        total_ms,
    )

    return LatentQueryResponse(
        dense_prompt=dense_prompt,
        latent_id=str(uuid4()),
        session_id=body.session_id,
        metrics=QueryMetrics(
            tokens_saved=tokens_saved,
            retrieval_time_ms=round(retrieval_ms, 1),
            decode_time_ms=round(decode_ms, 1),
            total_time_ms=round(total_ms, 1),
            modules_searched=len(retriever.index.entries),
            modules_matched=len(retrieved),
        ),
        matched_modules=[
            MatchedModule(
                module_id=m.module_id,
                name=m.name,
                module_type=m.module_type,
                score=round(m.score, 4),
                description=m.description,
            )
            for m in retrieved
        ],
    )


@router.get("/modules/list", response_model=ModuleListResponse)
async def list_modules(
    request: Request,
    module_type: str | None = None,
):
    """List all compiled modules available for querying."""
    retriever = request.app.state.retriever
    modules = retriever.list_modules(module_type_filter=module_type)

    return ModuleListResponse(
        modules=[ModuleListItem(**m) for m in modules],
        total=len(modules),
    )


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """Health check endpoint."""
    wrapper = request.app.state.wrapper
    index = request.app.state.retriever.index
    retrieval_only = getattr(request.app.state, "retrieval_only", False)

    if retrieval_only:
        model_loaded = False  # No model in retrieval-only mode (by design)
    else:
        # Check without triggering lazy load (avoid loading model on health check)
        model_loaded = wrapper is not None and wrapper._wrapper is not None

    return HealthResponse(
        status="ok",
        model_loaded=model_loaded,
        index_loaded=index.embeddings is not None,
        modules_count=len(index.entries) if index.entries else 0,
    )
