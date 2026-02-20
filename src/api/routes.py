"""FastAPI route handlers for the Latent-Link API."""

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


@router.post("/latent/query", response_model=LatentQueryResponse)
async def latent_query(body: LatentQueryRequest, request: Request):
    """Main query endpoint. Handles all three MCP tool types:

    - architect_consult: intent-based retrieval across all module types
    - skill_injector: direct skill_id lookup
    - compliance_verify: encode code, match against rules
    """
    t_start = time.perf_counter()

    intent_encoder = request.app.state.intent_encoder
    retriever = request.app.state.retriever
    decoder = request.app.state.decoder
    session_mgr = request.app.state.session_manager

    # Route based on tool type
    if body.tool_name == "skill_injector" and body.skill_id:
        # Direct lookup by skill_id
        t_retrieve = time.perf_counter()
        module = retriever.retrieve_by_id(body.skill_id)
        retrieved = [module] if module else []
        retrieval_ms = (time.perf_counter() - t_retrieve) * 1000
    else:
        # Intent-based retrieval
        query_text = body.code if body.tool_name == "compliance_verify" else body.intent
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

        t_encode = time.perf_counter()
        query_vec = intent_encoder.encode(query_text)
        encode_ms = (time.perf_counter() - t_encode) * 1000
        logger.debug("Intent encoding: %.1fms", encode_ms)

        t_retrieve = time.perf_counter()
        type_filter = body.module_type_filter
        if body.tool_name == "compliance_verify" and not type_filter:
            type_filter = "rule"  # Default to rules for compliance checks

        retrieved = retriever.retrieve(
            query_vec,
            top_k=body.top_k,
            module_type_filter=type_filter,
        )
        retrieval_ms = (time.perf_counter() - t_retrieve) * 1000

    # Decode latent states to dense text
    t_decode = time.perf_counter()
    if retrieved:
        dense_prompt = decoder.decode(retrieved, tool_name=body.tool_name)
    else:
        dense_prompt = "No matching modules found for this query."
    decode_ms = (time.perf_counter() - t_decode) * 1000

    total_ms = (time.perf_counter() - t_start) * 1000

    # Calculate token savings
    original_tokens = sum(m.original_token_count for m in retrieved)
    dense_tokens = request.app.state.wrapper.get_token_count(dense_prompt)
    tokens_saved = max(0, original_tokens - dense_tokens)

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

    return HealthResponse(
        status="ok",
        model_loaded=wrapper.model is not None,
        index_loaded=index.embeddings is not None,
        modules_count=len(index.entries) if index.entries else 0,
    )
