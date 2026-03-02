<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python 3.10+"/>
  <img src="https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.5+"/>
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"/>
  <img src="https://img.shields.io/badge/MCP-v1.12-green" alt="MCP SDK"/>
  <img src="https://img.shields.io/badge/Modules-128+-orange" alt="128+ Modules"/>
</p>

# AwesomeContext

> Give Claude Code the engineering knowledge of a senior team — architecture patterns, coding standards, security audits — injected automatically, without burning your context window.

---

## Get Started in 30 Seconds

```bash
# 1. Install the plugin
claude plugin install awesome-context

# 2. Set your API key (get one free at awesomecontext.awareness.market)
export AC_API_KEY=ac_your_key_here

# 3. Load rules for your project
/awesome-context:rules
```

[![AwesomeContext Website](https://image.thum.io/get/width/1200/https://awesomecontext.awareness.market)](https://awesomecontext.awareness.market)

---

## The Problem

Claude Code is powerful, but it doesn't know your team's rules.

Every time you start a session, you're back to square one: manually pasting coding standards, reminding it about your tech stack, explaining security requirements, copy-pasting architectural guidance. And even when you do, long context windows cause Claude to "forget" rules as the conversation grows.

The result: AI-generated code that works, but violates your conventions, skips security checks, or picks the wrong architecture pattern.

---

## What AwesomeContext Does

**AwesomeContext is an MCP server for Claude Code that auto-injects 128+ engineering rules, patterns, and skills — right when Claude needs them.**

- **On conversation start**: Claude automatically knows your tech stack's coding rules
- **Before designing**: Claude gets architecture patterns and trade-offs
- **When auditing**: Claude applies deep security checklists (OWASP, DeFi, smart contracts)
- **Before committing**: Claude checks your code against team standards

All of this happens in the background. You just write code.

**The key innovation**: Instead of injecting raw Markdown documents (which cost thousands of tokens each), AwesomeContext compresses rules into neural tensors and decodes them on-demand — achieving **96-99% token savings** while maintaining full semantic accuracy.

---

## Who It's For

| User | Pain Point | How AwesomeContext Helps |
|------|-----------|--------------------------|
| **Individual developer** | Claude writes code that doesn't follow your standards | Auto-loads your rules every session |
| **Tech lead** | Team using AI gets inconsistent, non-standard output | One shared rule set, injected for everyone |
| **Security engineer** | Claude doesn't know domain-specific vulnerability patterns | Injects specialized security checklists on demand |
| **Consultant / freelancer** | Different client standards per project | Load project-specific rules per session |

---

## Quick Start (Cloud — Recommended)

No GPU, no Docker, no compilation. Just install and use.

### 1. Get a free API key

Sign up at [awesomecontext.awareness.market](https://awesomecontext.awareness.market) and copy your key.

### 2. Install the plugin

```bash
claude plugin install awesome-context
```

### 3. Set your API key

```bash
export AC_API_KEY=ac_your_key_here
```

### 4. Start using it

Open Claude Code on any project and run:

```bash
/awesome-context:rules      # Auto-detect your stack and load relevant rules
```

That's it. Claude now knows your coding standards, security requirements, and best practices for this session.

---

## The 4 Things You Can Do

### `/awesome-context:rules` — Load your rules

Auto-detects your tech stack (TypeScript, Python, Go, React, Django, etc.) and loads the right coding standards, security guidelines, and patterns.

```
You: /awesome-context:rules
→ Detected: TypeScript + React + Next.js
→ Loaded: TypeScript strict mode rules, React hook conventions,
          Next.js App Router patterns, OWASP web security checklist
→ Claude now knows the rules for this project.
```

### `/awesome-context:architect` — Get architecture guidance before you build

Before writing code for a new feature, ask for architecture patterns. Claude gets production-grade decision frameworks injected, so it can reason through trade-offs properly.

```
You: /awesome-context:architect
You: I need to add real-time notifications to my app.

Claude: Here's the analysis for your Next.js + Postgres stack:
  → WebSocket: Best for bi-directional, many simultaneous connections
  → SSE: Simpler, HTTP-based, good for server-push only (your case)
  → Polling: Only if you need IE11 support
  Recommendation: SSE via Next.js Route Handlers, here's the pattern...
```

### `/awesome-context:review` — Check code before commit

Claude reviews your staged changes against the loaded rules — catching style violations, security issues, and anti-patterns before they hit your repo.

```
You: /awesome-context:review

Claude: Found 2 issues in your staged changes:
  ✗ Line 47: Raw SQL string concatenation — SQL injection risk (OWASP A03)
    Fix: Use parameterized queries → db.query('SELECT * FROM users WHERE id = $1', [id])
  ✗ Line 83: console.log left in production code
    Fix: Use your logger utility instead
  ✓ Everything else looks good.
```

### `/awesome-context:security` — Deep security audit

Injects specialized security knowledge for your domain: OWASP web vulnerabilities, DeFi smart contract exploits, cryptographic pitfalls, access control review.

```
You: /awesome-context:security
You: Audit this Solidity contract for me.

Claude: Running DeFi security checklist:
  ✗ Reentrancy vulnerability on line 34 — update state before external calls
  ✗ Integer overflow on line 67 — use SafeMath or Solidity 0.8+
  ✗ Access control missing on withdrawAll() — add onlyOwner modifier
  ✓ No tx.origin authentication issues found
```

---

## The 4 MCP Tools (Auto-Active)

Beyond slash commands, the plugin registers 4 tools that Claude calls **automatically** based on context — no manual invocation needed:

| Tool | When Claude calls it | What it does |
|------|---------------------|--------------|
| `get_rules` | At conversation start | Loads your project's tech stack rules |
| `architect_consult` | Before design decisions | Injects architecture patterns and trade-offs |
| `skill_injector` | For domain-specific tasks | Pulls security, testing, or infra knowledge |
| `compliance_verify` | When reviewing code | Checks against loaded standards |

> These tools are described in the plugin so Claude knows *when* to call them — you don't have to remember to ask.

---

## Supported Tech Stacks

**Languages**: TypeScript, Python, Go, Java, Rust, C++, Solidity

**Frameworks**: React, Next.js, Django, FastAPI, Spring Boot, Express

**Infrastructure**: Docker, CI/CD, Postgres, ClickHouse

**Domains**: DeFi / Smart Contracts, OWASP Security, REST API Design, TDD, Database Migrations

---

## 128+ Available Modules

| Category | Count | Examples |
|----------|-------|---------|
| Coding Rules | 12+ | TypeScript strict mode, Python style, Go idioms, Java patterns |
| Skills | 43+ | TDD workflow, security review, DeFi audit, API design |
| Agents | 13 | Architecture reviewer, security auditor, code reviewer, test guide |
| Commands | 31+ | Plan, build-fix, e2e, checkpoint, refactor |
| Hooks | 1 | Pre-commit checks |

Browse all modules: `/awesome-context:skills`

---

## Self-Hosting (Advanced)

If you want to run everything locally — your own model, your own rules, no cloud dependency.

### Prerequisites

- Python 3.10+
- Node.js 18+
- GPU with ≥ 8GB VRAM (optional — CPU fallback available)

### 1. Clone & Install

```bash
git clone --recurse-submodules https://github.com/everest-an/AwesomeContext.git
cd AwesomeContext

# Python dependencies
pip install -e ".[dev]"

# MCP server dependencies
cd mcp-server && npm install && cd ..
```

### 2. Compile Rules

This is a one-time step that encodes all 128 rule modules into compressed tensors:

```bash
# Preview what will be compiled (no model loading)
python scripts/compile.py --dry-run

# Full compilation (~17-47 min on GPU, downloads model on first run)
python scripts/compile.py

# Incremental — only recompile changed files
python scripts/compile.py --delta
```

```
Found 128 modules (13 agents, 43 skills, 12 rules, 31 commands, ...)
Loading model: Qwen/Qwen3-4B (device=cuda, dtype=torch.bfloat16)
Compiling: 100%|████████████████| 128/128 [17:42<00:00, 8.30s/module]
Compilation complete. 128 modules → data/tensors/
```

### 3. Start the Backend

```bash
python scripts/serve.py
# Running at http://127.0.0.1:8420
```

### 4. Build & Start MCP Server

```bash
cd mcp-server
npm run build
npm start
```

### 5. Configure Claude Code

Add to `~/.config/claude-code/mcp.json` (or your project's MCP config):

```json
{
  "mcpServers": {
    "awesome-context": {
      "command": "node",
      "args": ["path/to/AwesomeContext/mcp-server/dist/index.js"],
      "env": {
        "AC_API": "http://127.0.0.1:8420"
      }
    }
  }
}
```

---

## How the Compression Works

Standard approach: inject full Markdown rule files into Claude's context — 2,000–5,000 tokens per rule, lost as the conversation grows.

AwesomeContext approach:
1. **Offline**: Run each rule document through a language model (Qwen3). Capture the deep hidden state representations and save them as compact tensor files.
2. **Runtime**: When you query a rule, encode your intent, find the closest matching tensor via cosine similarity, decode it back to a short instruction string — in milliseconds.

Result: the same semantic content delivered in < 150 tokens instead of 5,000+.

```
User Intent → Cosine Search → Load Tensor (mmap) → Decode → Dense Prompt (< 150 tokens)
```

### Supported Models

| Model | Hardware | Memory | Use Case |
|-------|----------|--------|----------|
| **Qwen3-4B** (default) | GPU ≥ 8GB | ~8GB bf16 | Best balance |
| **Qwen3-14B** | GPU ≥ 24GB | ~28GB bf16 | Highest fidelity |
| **Qwen2.5-Coder-1.5B** | CPU | ~6GB fp32 | No GPU needed |

Auto-detection: uses Qwen3-4B if CUDA is available, otherwise falls back to Qwen2.5-1.5B. Override with `AC_MODEL`.

---

## Performance

### Token Savings

| Scenario | Raw Tokens | After AwesomeContext | Savings |
|----------|-----------|----------------------|---------|
| Single skill | 2,000–5,000 | < 150 | 96–97% |
| Architecture consult (3 modules) | 6,000–15,000 | < 150 | 98–99% |
| Compliance check (5 rules) | 10,000–25,000 | < 150 | 99%+ |

### Runtime Speed

| Operation | Time |
|-----------|------|
| First query (model warm-up) | 1.5–5s |
| Cached query | < 100ms |
| Compilation (one-time, per module) | 10–28s on GPU |

---

## API Reference (Self-Hosting)

### `POST /v1/latent/query`

Used by all MCP tools internally.

**Request:**
```json
{
  "intent": "implement debounced search",
  "session_id": "sess_abc123",
  "tool_name": "architect_consult",
  "top_k": 3
}
```

**Response:**
```json
{
  "dense_prompt": "【Injected Rules】: 1. Use React Hook conventions; 2. Reference utils/debounce...",
  "metrics": {
    "tokens_saved": 1250,
    "retrieval_time_ms": 0.8,
    "total_time_ms": 1920.1,
    "modules_matched": 3
  },
  "matched_modules": [
    { "module_id": "skills/coding-standards", "score": 0.91 }
  ]
}
```

### `GET /v1/modules/list` — List all compiled modules
### `GET /v1/health` — Health check
### `GET /v1/metrics` — Performance stats

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AC_API_KEY` | — | Cloud API key (plugin mode) |
| `AC_MODEL` | Auto-detect | Model override (`Qwen/Qwen3-4B`, `Qwen/Qwen3-14B`, `Qwen/Qwen2.5-Coder-1.5B-Instruct`) |
| `AC_API` | `http://127.0.0.1:8420` | Backend URL (self-hosted MCP server) |

---

## Project Structure

```
AwesomeContext/
├── src/
│   ├── adapter/         # Model adaptation (encode, decode, realignment)
│   ├── compiler/        # Offline compilation pipeline
│   ├── gateway/         # Runtime query engine
│   ├── api/             # FastAPI backend
│   └── shared/          # Types, hashing, tensor I/O
├── mcp-server/          # MCP Server (TypeScript/Node.js)
├── vendor/
│   └── everything-claude-code/  # Rule source (128 modules)
├── data/                # Compiled tensors (gitignored)
├── scripts/             # compile.py, serve.py, verify_tensors.py
└── landing/             # Next.js website + dashboard
```

---

## Testing

```bash
# All unit tests
python -m pytest tests/unit/ -v

# TypeScript type check
cd mcp-server && npx tsc --noEmit

# Verify compiled tensors
python scripts/verify_tensors.py
```

---

## Built On

- **[Qwen3](https://huggingface.co/Qwen/Qwen3-4B)** — Language model for encoding and decoding
- **[Model Context Protocol](https://modelcontextprotocol.io/)** — AI tool integration standard
- **[Safetensors](https://github.com/huggingface/safetensors)** — Fast, safe tensor serialization

---

## Authors

- **[everest-an](https://github.com/everest-an)** — Creator & Lead Developer
- **[EdwinHao](https://github.com/edwinhao)** — Co-Creator & Architect

## License

[Apache License 2.0](LICENSE)

---

<p align="center">
  <a href="https://awesomecontext.awareness.market">awesomecontext.awareness.market</a> · Powered by Qwen3 · Integrated via MCP
</p>
