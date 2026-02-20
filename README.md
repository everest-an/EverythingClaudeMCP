<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python 3.10+"/>
  <img src="https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.5+"/>
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"/>
  <img src="https://img.shields.io/badge/MCP-v1.12-green" alt="MCP SDK"/>
  <img src="https://img.shields.io/badge/latent-engine-Qwen3-orange" alt="latent-engine"/>
</p>

# Latent-Link Rule Injection Gateway

> Compress thousands of engineering rules into latent space tensors. Query them in < 150 tokens.

**Latent-Link** is an implicit context engine that compiles complex engineering instruction sets (rules, skills, agents) from text space into latent space tensors using [latent-engine](https://github.com/internal/latent-engine). Instead of injecting full Markdown documents into Claude Code's context window, Latent-Link retrieves and decodes compressed neural representations — achieving **96-99% token savings** while preserving semantic fidelity.

---

## Why Latent-Link?

| Problem | Before | After (Latent-Link) |
|---------|--------|---------------------|
| **Token waste** | Inject full Markdown rules (2,000-5,000 tokens each) | Compressed to < 150 token dense prompt |
| **Rule drift** | Rules "forgotten" in long contexts | Latent tensors maintain semantic integrity |
| **Inference latency** | Thousands of rule tokens slow every request | Tensor retrieval + decode in milliseconds |
| **Scaling** | 100+ rules = context overflow | 100+ rules = single index lookup |

---

## How It Works

Latent-Link operates in two phases:

### Phase 1: Offline Compilation (compile once)

```
Markdown Rules ──► Scanner ──► Encoder (Qwen3 forward pass) ──► Tensors (.safetensors) ──► Index
```

The compiler reads engineering rules from Markdown files, runs them through a language model to capture deep hidden state representations, then persists these as compact tensor files.

### Phase 2: Runtime Query (per request)

```
User Intent ──► Intent Encoder ──► Cosine Retrieval ──► Load Tensors (mmap) ──► Decode ──► Dense Prompt
```

When Claude Code calls a tool, the gateway encodes the intent, retrieves matching rule tensors via cosine similarity, and decodes them into a compressed instruction stream.

---

## Architecture

```
┌─────────────┐     stdio/JSON-RPC     ┌──────────────────┐     HTTP/JSON     ┌─────────────────────┐
│ Claude Code  │ ◄──────────────────► │  MCP Server       │ ◄──────────────► │  FastAPI Backend      │
│              │                       │  (Node.js/TS)     │                  │  (Python)             │
│ Calls 3      │                       │                   │                  │                       │
│ MCP Tools    │                       │ architect_consult │                  │ ┌─────────────────┐   │
│              │                       │ skill_injector    │                  │ │ Intent Encoder  │   │
│              │                       │ compliance_verify │                  │ │ Retriever       │   │
└─────────────┘                       └──────────────────┘                  │ │ Decoder         │   │
                                                                            │ └────────┬────────┘   │
                                                                            │          │            │
                                                                            │ ┌────────▼────────┐   │
                                                                            │ │ Qwen3-4B/14B    │   │
                                                                            │ │ (GPU, bfloat16) │   │
                                                                            │ └────────┬────────┘   │
                                                                            │          │            │
                                                                            │ ┌────────▼────────┐   │
                                                                            │ │ Tensor Store    │   │
                                                                            │ │ + Cosine Index  │   │
                                                                            │ └─────────────────┘   │
                                                                            └───────────────────────┘
```

---

## Supported Models

| Model | Hidden Dim | Layers | Weight Tying | Hardware | Memory | Use Case |
|-------|-----------|--------|-------------|----------|--------|----------|
| **Qwen3-4B** (default) | 2560 | 36 | No | GPU (>=8GB VRAM) | ~8GB (bf16) | Best balance of quality vs. cost |
| **Qwen3-14B** | 5120 | 40 | No | GPU (>=24GB VRAM) | ~28GB (bf16) | Highest encoding fidelity |
| **Qwen2.5-Coder-1.5B** | 1536 | 28 | Yes | CPU | ~6GB (fp32) | Lightweight fallback, no GPU needed |

Auto-detection: If CUDA is available, defaults to Qwen3-4B. Otherwise falls back to Qwen2.5-1.5B. Override with `LATENT_LINK_MODEL` env var.

---

## MCP Tools

Latent-Link exposes 3 tools via the [Model Context Protocol](https://modelcontextprotocol.io/):

### `architect_consult`
Extract architecture rules and best practices before designing or refactoring.
```json
{ "intent": "Implement a debounced search input with React hooks" }
→ "【Injected Rules】: 1. Use React Hook conventions; 2. Reference utils/debounce; 3. Follow UI-System rule #4."
```

### `skill_injector`
Pull specific domain knowledge (security audit, TDD workflow, etc.).
```json
{ "skill_id": "skills/security-review" }
→ Decoded boundary conditions and prohibited patterns from the security review skill.
```

### `compliance_verify`
Check code against engineering standards before commit.
```json
{ "code": "function getData() { ... }" }
→ { "compliant": false, "violations": [...], "suggestions": [...] }
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- GPU with >= 8GB VRAM (optional, CPU fallback available)

### 1. Clone & Install

```bash
git clone --recurse-submodules https://github.com/everest-an/EverythingClaudeMCP.git
cd EverythingClaudeMCP

# Python dependencies
pip install -e ".[dev]"

# MCP server dependencies
cd mcp-server && npm install && cd ..
```

### 2. Compile Rules into Tensors

```bash
# Preview what will be compiled (no model loading)
python scripts/compile.py --dry-run

# Full compilation (downloads model on first run)
python scripts/compile.py

# Incremental compilation (only changed files)
python scripts/compile.py --delta

# Use a specific model
LATENT_LINK_MODEL="Qwen/Qwen3-14B" python scripts/compile.py
```

Example output:
```
2026-02-21 10:30:00 [INFO] Scanning vendor/everything-claude-code...
2026-02-21 10:30:01 [INFO] Found 128 modules (13 agents, 43 skills, 12 rules, 31 commands, ...)
2026-02-21 10:30:01 [INFO] Loading model: Qwen/Qwen3-4B (device=cuda, dtype=torch.bfloat16)
2026-02-21 10:30:35 [INFO] Computing realignment matrix: [2560, 2560], target_norm=0.0823
Compiling: 100%|██████████████████████████████| 128/128 [17:42<00:00, 8.30s/module]
2026-02-21 10:48:17 [INFO] Index built: 128 modules, embedding dim=2560
2026-02-21 10:48:17 [INFO] Compilation complete. 128 modules → data/tensors/
```

### 3. Start the Gateway Server

```bash
# Start FastAPI backend (default: http://127.0.0.1:8420)
python scripts/serve.py

# With custom port
python scripts/serve.py --port 9000

# With auto-reload for development
python scripts/serve.py --reload
```

### 4. Build & Run MCP Server

```bash
cd mcp-server
npm run build
npm start
```

### 5. Configure Claude Code

Add to your Claude Code MCP configuration (`~/.config/claude-code/mcp.json` or project-level):

```json
{
  "mcpServers": {
    "latent-link": {
      "command": "node",
      "args": ["path/to/EverythingClaudeMCP/mcp-server/dist/index.js"],
      "env": {
        "LATENT_LINK_API": "http://127.0.0.1:8420"
      }
    }
  }
}
```

---

## Testing

### Run All Unit Tests

```bash
python -m pytest tests/unit/ -v
```

Expected output:
```
tests/unit/test_api.py::test_health_endpoint PASSED
tests/unit/test_api.py::test_modules_list_endpoint PASSED
tests/unit/test_chat_template.py::test_build_rule_encoding_prompt_structure PASSED
tests/unit/test_config.py::test_all_profiles_registered PASSED
tests/unit/test_config.py::test_qwen3_4b_profile PASSED
tests/unit/test_delta.py::test_needs_recompile_first_time PASSED
tests/unit/test_hashing.py::test_content_hash_is_sha256 PASSED
tests/unit/test_indexer.py::test_build_index PASSED
tests/unit/test_indexer.py::test_query_returns_top_k PASSED
tests/unit/test_markdown_parser.py::test_parse_frontmatter_markdown PASSED
tests/unit/test_realignment.py::test_compute_realignment_tied_weights PASSED
tests/unit/test_scanner.py::test_scan_everything_claude_code PASSED
tests/unit/test_session.py::test_create_new_session PASSED
tests/unit/test_tensor_io.py::test_save_and_load_roundtrip PASSED
tests/unit/test_types.py::test_parsed_module_auto_hash PASSED
...
============================= 59 passed ==============================
```

### Run Specific Test Module

```bash
# Only config tests
python -m pytest tests/unit/test_config.py -v

# Only realignment tests
python -m pytest tests/unit/test_realignment.py -v

# Only scanner tests (requires vendor/everything-claude-code submodule)
python -m pytest tests/unit/test_scanner.py -v
```

### Test Coverage Map

| Test File | Module Under Test | Tests |
| --------- | ----------------- | ----- |
| `test_config.py` | `src/adapter/config.py` | Model profiles, auto-detect, device/dtype resolution |
| `test_realignment.py` | `src/adapter/realignment.py` | Tied/untied weights, shape, normalization, batch, dtype |
| `test_chat_template.py` | `src/adapter/chat_template.py` | All 4 prompt builders, structure and content |
| `test_markdown_parser.py` | `src/shared/markdown_parser.py` | Frontmatter, plain MD, hooks.json, empty/missing files |
| `test_types.py` | `src/shared/types.py` | Auto-hash, explicit hash, default metadata |
| `test_hashing.py` | `src/shared/hashing.py` | Determinism, uniqueness, SHA-256 format |
| `test_tensor_io.py` | `src/shared/tensor_io.py` | Save/load roundtrip, directory creation, metadata |
| `test_scanner.py` | `src/compiler/scanner.py` | Full repo scan (128 modules), sort order, missing repo |
| `test_indexer.py` | `src/compiler/indexer.py` | Build, query top-k, type filter, min_score, save/load |
| `test_delta.py` | `src/compiler/delta.py` | First compile, unchanged, changed, deleted modules |
| `test_session.py` | `src/gateway/session.py` | Create, get, record query, TTL expiry, eviction |
| `test_api.py` | `src/api/app.py` | Health endpoint, modules list endpoint |

### Verify Compiled Tensors

After compilation, validate all tensor files:

```bash
python scripts/verify_tensors.py
```

This checks:

- Tensor shapes match model dimensions
- No NaN or Inf values
- Required metadata fields present
- Cross-reference with index manifest

### TypeScript Type Check

```bash
cd mcp-server && npx tsc --noEmit
```

---

## API Reference

### `POST /v1/latent/query`

Unified query endpoint used by all 3 MCP tools.

**Request:**
```json
{
  "intent": "implement debounced search",
  "session_id": "sess_abc123",
  "tool_name": "architect_consult",
  "top_k": 3,
  "module_type_filter": null
}
```

**Response:**
```json
{
  "dense_prompt": "【Injected Rules】: 1. Use React Hook conventions...",
  "latent_id": "a3f8c2d1",
  "session_id": "sess_abc123",
  "metrics": {
    "tokens_saved": 1250,
    "retrieval_time_ms": 0.8,
    "decode_time_ms": 1850.3,
    "total_time_ms": 1920.1,
    "modules_searched": 128,
    "modules_matched": 3
  },
  "matched_modules": [
    {
      "module_id": "skills/coding-standards",
      "name": "Coding Standards",
      "module_type": "skill",
      "score": 0.91
    }
  ]
}
```

### `GET /v1/modules/list`

List all compiled modules and their metadata.

### `GET /v1/health`

Health check endpoint.

### `GET /v1/metrics`

Performance metrics and statistics.

---

## Core Concepts

### Realignment Matrix

The key innovation from latent-engine: a linear projection `M*` that maps model hidden states back to the embedding space, enabling iterative latent reasoning without generating tokens.

```
M* = argmin_M  || W_out @ M - W_in ||²  +  λ||M||²

Solution (Ridge Regression):
M* = (W_outᵀ @ W_out + λI)⁻¹ @ (W_outᵀ @ W_in)
```

- **Qwen3** (`tie_word_embeddings=false`): Full Ridge Regression produces a rich projection matrix. 8-10 latent steps recommended.
- **Qwen2.5** (`tie_word_embeddings=true`): Since W_out ≡ W_in, M* ≈ I (near identity). 5 steps sufficient.

### Latent Reasoning Loop

Each latent step:
1. Forward pass → get last hidden state `h`
2. Project: `e = h @ M*` (hidden → embedding space)
3. Normalize to match embedding distribution
4. Feed `e` as next input embedding (grows KV-cache by 1)

The trajectory `[h₀, h₁, ..., hₙ]` captures progressively deeper semantic representations of the rule.

### Tensor Persistence

Each compiled module produces a `.safetensors` file:

| Tensor | Shape | Purpose |
|--------|-------|---------|
| `mean_embedding` | `[H]` | Cosine similarity retrieval |
| `layer_states` | `[L, H]` | Per-layer hidden states for high-fidelity decoding |
| `latent_trajectory` | `[N, H]` | Full reasoning trajectory for embedding injection |

Where H = hidden_dim (2560/5120/1536), L = num_layers (36/40/28), N = latent_steps.

### Embedding Injection (Decode)

At decode time, retrieved latent trajectories are inserted directly into the embedding sequence of a decode prompt:

```
[<|im_start|>] [system] [You are...] [<|im_end|>]
[<|im_start|>] [user]   [latent₁] [latent₂] ... [latentₙ] [Based on...] [<|im_end|>]
[<|im_start|>] [assistant]
                ↓
         model.generate() → dense prompt (< 150 tokens)
```

---

## Project Structure

```
EverythingClaudeMCP/
├── src/
│   ├── adapter/                 # latent-engine multi-model adaptation
│   │   ├── config.py            # Model profiles, auto hardware detection
│   │   ├── model_wrapper.py     # Core: load, encode, latent steps, decode
│   │   ├── chat_template.py     # ChatML prompt construction
│   │   └── realignment.py       # Realignment matrix computation
│   ├── compiler/                # Offline compilation pipeline
│   │   ├── scanner.py           # Markdown file traversal
│   │   ├── encoder.py           # Hidden state encoding
│   │   ├── persistence.py       # Safetensors read/write
│   │   ├── indexer.py           # Cosine similarity index
│   │   ├── delta.py             # Incremental compilation
│   │   └── cli.py               # CLI entry point
│   ├── gateway/                 # Runtime decode gateway
│   │   ├── intent_encoder.py    # Intent → vector
│   │   ├── retriever.py         # Tensor retrieval
│   │   ├── decoder.py           # Latent → text
│   │   └── session.py           # Session management
│   ├── api/                     # FastAPI backend
│   │   ├── app.py               # Application factory
│   │   ├── routes.py            # Endpoints
│   │   ├── schemas.py           # Pydantic models
│   │   └── middleware.py        # Timing, error handling
│   └── shared/                  # Shared utilities
│       ├── types.py             # Type definitions
│       ├── markdown_parser.py   # YAML frontmatter parser
│       ├── tensor_io.py         # Tensor I/O wrapper
│       └── hashing.py           # Content hashing
├── mcp-server/                  # MCP Server (TypeScript)
│   └── src/
│       ├── index.ts             # Entry + tool registration
│       ├── client.ts            # FastAPI HTTP client
│       └── tools/               # Tool handlers
├── vendor/                      # Git submodules
│   ├── latent-engine/               # Core algorithm
│   └── everything-claude-code/  # Rule source material
├── data/                        # Compiled artifacts (gitignored)
│   ├── tensors/                 # .safetensors files
│   └── index/                   # Embedding index
├── scripts/                     # Convenience scripts
│   ├── compile.py               # Run compiler
│   ├── serve.py                 # Start server
│   └── verify_tensors.py        # Inspect compiled tensors
├── docs/
│   ├── PRD.md                   # Product requirements
│   └── architecture.md          # Technical architecture
├── pyproject.toml
└── LICENSE
```

---

## Performance

### Compilation (offline, one-time)

| Model | Per Module | 100 Modules | Hardware |
|-------|-----------|-------------|----------|
| Qwen3-4B | ~10-28s | ~17-47 min | GPU (bf16) |
| Qwen3-14B | ~15-40s | ~25-67 min | GPU (bf16) |
| Qwen2.5-1.5B | ~30-60s | ~50-100 min | CPU (fp32) |

### Runtime Query

| Model | First Query | Cached Query |
|-------|------------|-------------|
| Qwen3-4B (GPU) | ~1.5-5s | < 100ms |
| Qwen2.5-1.5B (CPU) | ~6-17s | < 100ms |

### Token Savings

| Scenario | Original Tokens | After Compression | Savings |
|----------|----------------|-------------------|---------|
| Single skill injection | 2,000-5,000 | < 150 | 96-97% |
| 3-module architecture consult | 6,000-15,000 | < 150 | 98-99% |
| Compliance check (5 rules) | 10,000-25,000 | < 150 | 99%+ |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LATENT_LINK_MODEL` | Auto-detect | Override model selection (`Qwen/Qwen3-4B`, `Qwen/Qwen3-14B`, `Qwen/Qwen2.5-Coder-1.5B-Instruct`) |
| `LATENT_LINK_API` | `http://127.0.0.1:8420` | FastAPI backend URL (used by MCP server) |

---

## Content Source

Rules are sourced from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code):

| Type | Count | Path Pattern |
|------|-------|-------------|
| Agents | 13 | `agents/*.md` |
| Skills | 43+ | `skills/*/SKILL.md` |
| Rules | 12+ | `rules/{common,ts,py,go}/*.md` |
| Commands | 31+ | `commands/*.md` |
| Hooks | 1 | `hooks/hooks.json` |
| Contexts | 3 | `contexts/*.md` |
| **Total** | **~128** | |

---

## Built On

- **[latent-engine](https://github.com/internal/latent-engine)** — Latent Multi-Agent Search: the core algorithm for latent space reasoning
- **[Qwen3](https://huggingface.co/Qwen/Qwen3-4B)** — Base language model for encoding and decoding
- **[Model Context Protocol](https://modelcontextprotocol.io/)** — Standard protocol for AI tool integration
- **[Safetensors](https://github.com/huggingface/safetensors)** — Safe, fast tensor serialization with mmap support

---

## Authors

- **[everest-an](https://github.com/everest-an)** — Creator & Lead Developer
- **[EdwinHao](https://github.com/edwinhao)** — Co-Creator

## License

This project is licensed under the [Apache License 2.0](LICENSE).

---

<p align="center">
  <sub>Built with latent-engine | Powered by Qwen3 | Integrated via MCP</sub>
</p>
