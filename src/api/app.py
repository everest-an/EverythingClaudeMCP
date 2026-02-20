"""FastAPI application factory for Latent-Link Gateway."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from ..adapter.config import FASTAPI_HOST, FASTAPI_PORT
from ..adapter.model_wrapper import AdaptedModelWrapper
from ..compiler.indexer import NumpyIndex
from ..gateway.decoder import LatentDecoder
from ..gateway.intent_encoder import IntentEncoder
from ..gateway.retriever import LatentRetriever
from ..gateway.session import SessionManager
from .middleware import add_middleware
from .routes import router

logger = logging.getLogger(__name__)


class LazyModelWrapper:
    """Lazy-loading wrapper: defers model loading until first use.

    This allows the FastAPI server to start instantly (~100ms) and only
    incur the ~30-60s model load when the first actual query arrives.
    """

    def __init__(self, model_name: str | None = None):
        self._wrapper: AdaptedModelWrapper | None = None
        self._model_name = model_name

    @property
    def model(self):
        self._ensure_loaded()
        return self._wrapper.model

    @property
    def tokenizer(self):
        self._ensure_loaded()
        return self._wrapper.tokenizer

    @property
    def realign_matrix(self):
        self._ensure_loaded()
        return self._wrapper.realign_matrix

    @property
    def target_norm(self):
        self._ensure_loaded()
        return self._wrapper.target_norm

    def _ensure_loaded(self):
        if self._wrapper is None:
            logger.info("Lazy-loading model (first query)...")
            kwargs = {}
            if self._model_name:
                kwargs["model_name"] = self._model_name
            self._wrapper = AdaptedModelWrapper(**kwargs)
            logger.info("Model loaded successfully.")

    def get_token_count(self, text: str) -> int:
        self._ensure_loaded()
        return self._wrapper.get_token_count(text)

    def encode_text(self, messages):
        self._ensure_loaded()
        return self._wrapper.encode_text(messages)

    def generate_latent_steps(self, messages, n_steps=5):
        self._ensure_loaded()
        return self._wrapper.generate_latent_steps(messages, n_steps)

    def decode_from_latent(self, latent_embeddings, decode_messages, **kwargs):
        self._ensure_loaded()
        return self._wrapper.decode_from_latent(latent_embeddings, decode_messages, **kwargs)

    def tokenize_chat(self, messages, add_generation_prompt=True):
        self._ensure_loaded()
        return self._wrapper.tokenize_chat(messages, add_generation_prompt)

    def cleanup(self):
        if self._wrapper:
            self._wrapper.cleanup()
            self._wrapper = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: load index on startup, cleanup on shutdown."""
    logger.info("Starting Latent-Link Gateway...")

    # Load index (lightweight, milliseconds)
    index = NumpyIndex()
    try:
        index.load("data/index")
        logger.info("Index loaded: %d modules", len(index.entries))
    except Exception as e:
        logger.warning("Failed to load index: %s (compile first?)", e)

    # Create lazy model wrapper (defers actual load)
    wrapper = LazyModelWrapper()

    # Wire up components
    retriever = LatentRetriever(index, "data/tensors")
    intent_encoder = IntentEncoder(wrapper)
    decoder = LatentDecoder(wrapper)
    session_manager = SessionManager()

    app.state.wrapper = wrapper
    app.state.retriever = retriever
    app.state.intent_encoder = intent_encoder
    app.state.decoder = decoder
    app.state.session_manager = session_manager

    yield

    # Cleanup
    wrapper.cleanup()
    logger.info("Latent-Link Gateway stopped.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Latent-Link Rule Injection Gateway",
        description="Compress engineering rules into latent space tensors via LatentMAS",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.include_router(router, prefix="/v1")
    add_middleware(app)

    return app


# For uvicorn direct invocation: uvicorn src.api.app:app
app = create_app()
