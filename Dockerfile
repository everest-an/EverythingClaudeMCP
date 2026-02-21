# ============================================================================
# AwesomeContext Gateway - Docker Image
# ============================================================================
# Build targets:
#   1. "retrieval" (default) — Python backend only, retrieval-only (no LLM)
#   2. "full"      — Python backend with PyTorch + Qwen model
#   3. "cloud"     — All-in-one: MCP HTTP server + Python backend
#      Users connect via URL, no local install needed.
#
# Usage:
#   docker build -t awesome-context .                          # retrieval-only
#   docker build --target full -t awesome-context:full .       # full with model
#   docker build --target cloud -t awesome-context:cloud .     # cloud MCP service
# ============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Base dependencies
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./

# ---------------------------------------------------------------------------
# Stage 2: Retrieval-only (default) — no torch, no transformers
# ---------------------------------------------------------------------------
FROM base AS retrieval

RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    "uvicorn[standard]>=0.27.0" \
    pydantic>=2.5.0 \
    numpy>=1.24.0 \
    pyyaml>=6.0 \
    safetensors>=0.4.0 \
    python-frontmatter>=1.0.0 \
    tqdm>=4.65.0

COPY src/ src/
COPY scripts/serve.py scripts/serve.py
COPY data/tensors/ data/tensors/
COPY data/index/ data/index/
COPY vendor/everything-claude-code/ vendor/everything-claude-code/

ENV HOST=0.0.0.0
ENV PORT=8080
ENV AC_RETRIEVAL_ONLY=true
ENV AC_TENSOR_DIR=data/tensors
ENV AC_INDEX_DIR=data/index
ENV AC_SOURCE_REPO=vendor/everything-claude-code
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/v1/health')" || exit 1

CMD ["python", "scripts/serve.py"]

# ---------------------------------------------------------------------------
# Stage 3: Full mode — includes PyTorch + model for encode/decode
# ---------------------------------------------------------------------------
FROM base AS full

RUN pip install --no-cache-dir \
    torch>=2.1.0 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir \
    transformers>=4.44.0 \
    fastapi>=0.110.0 \
    "uvicorn[standard]>=0.27.0" \
    pydantic>=2.5.0 \
    numpy>=1.24.0 \
    pyyaml>=6.0 \
    safetensors>=0.4.0 \
    python-frontmatter>=1.0.0 \
    httpx>=0.27.0 \
    tqdm>=4.65.0

COPY src/ src/
COPY scripts/serve.py scripts/serve.py
COPY data/tensors/ data/tensors/
COPY data/index/ data/index/
COPY vendor/everything-claude-code/ vendor/everything-claude-code/

ENV HOST=0.0.0.0
ENV PORT=8080
ENV AC_TENSOR_DIR=data/tensors
ENV AC_INDEX_DIR=data/index
ENV AC_SOURCE_REPO=vendor/everything-claude-code
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/v1/health')" || exit 1

CMD ["python", "scripts/serve.py"]

# ---------------------------------------------------------------------------
# Stage 4: Cloud — All-in-one MCP HTTP server + Python backend
# Users only need a URL to connect. No local install required.
# ---------------------------------------------------------------------------

# 4a: Build MCP TypeScript → JavaScript
FROM node:20-slim AS cloud-mcp-build

WORKDIR /mcp
COPY mcp-server/package.json mcp-server/package-lock.json* ./
RUN npm ci --production=false
COPY mcp-server/tsconfig.json ./
COPY mcp-server/src/ src/
RUN npx tsc

# 4b: Final cloud image
FROM python:3.12-slim AS cloud

WORKDIR /app

# Install Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Python deps (retrieval-only)
RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    "uvicorn[standard]>=0.27.0" \
    pydantic>=2.5.0 \
    numpy>=1.24.0 \
    pyyaml>=6.0 \
    safetensors>=0.4.0 \
    python-frontmatter>=1.0.0 \
    tqdm>=4.65.0

# Python app
COPY src/ src/
COPY scripts/serve.py scripts/serve.py

# Compiled data + source content
COPY data/tensors/ data/tensors/
COPY data/index/ data/index/
COPY vendor/everything-claude-code/ vendor/everything-claude-code/

# MCP server (compiled JS + deps)
COPY --from=cloud-mcp-build /mcp/dist/ mcp-server/dist/
COPY --from=cloud-mcp-build /mcp/node_modules/ mcp-server/node_modules/
COPY mcp-server/package.json mcp-server/

# Startup script
COPY scripts/cloud-start.sh scripts/cloud-start.sh
RUN chmod +x scripts/cloud-start.sh

ENV HOST=0.0.0.0
ENV BACKEND_PORT=8420
ENV MCP_PORT=3000
ENV AC_RETRIEVAL_ONLY=true
ENV AC_TENSOR_DIR=data/tensors
ENV AC_INDEX_DIR=data/index
ENV AC_SOURCE_REPO=vendor/everything-claude-code
ENV AC_BACKEND_URL=http://127.0.0.1:8420
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -sf http://localhost:3000/health || exit 1

CMD ["scripts/cloud-start.sh"]
