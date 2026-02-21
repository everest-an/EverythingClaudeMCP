#!/usr/bin/env python3
"""End-to-end MCP Server Demo — calls the FastAPI backend with the exact same
payloads that the TypeScript MCP server sends to Claude Code.

Prerequisites:
    1. Compile modules:  python scripts/compile_all.py
    2. Start backend:    python scripts/serve.py          (or with AC_RETRIEVAL_ONLY=true)
    3. Run this demo:    python scripts/demo_mcp_e2e.py

Each step shows:
    - The exact JSON payload sent to the backend
    - The raw JSON response
    - The formatted MCP tool output (what Claude actually sees)
"""

import json
import sys
import textwrap
import time
import urllib.request
import urllib.error

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BACKEND = "http://127.0.0.1:8420"

# ── Terminal colors ──────────────────────────────────────────────────────
class C:
    HEADER  = "\033[95m"
    BLUE    = "\033[94m"
    CYAN    = "\033[96m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    RED     = "\033[91m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    END     = "\033[0m"


def banner(text):
    w = 78
    print(f"\n{C.HEADER}{'=' * w}")
    print(f"  {text}")
    print(f"{'=' * w}{C.END}\n")


def section(num, title, desc=""):
    print(f"\n{C.BOLD}{C.CYAN}{'─' * 78}{C.END}")
    print(f"{C.BOLD}{C.CYAN}  Step {num}: {title}{C.END}")
    if desc:
        print(f"{C.DIM}  {desc}{C.END}")
    print(f"{C.BOLD}{C.CYAN}{'─' * 78}{C.END}\n")


def show_request(method, path, body=None):
    print(f"  {C.YELLOW}>>> {method} {path}{C.END}")
    if body:
        pretty = json.dumps(body, indent=4, ensure_ascii=False)
        for line in pretty.split("\n"):
            print(f"  {C.YELLOW}    {line}{C.END}")
    print()


def show_json(label, data, max_lines=30):
    pretty = json.dumps(data, indent=2, ensure_ascii=False)
    lines = pretty.split("\n")
    print(f"  {C.BLUE}<<< {label} ({len(pretty):,} chars){C.END}")
    for line in lines[:max_lines]:
        print(f"  {C.DIM}    {line}{C.END}")
    if len(lines) > max_lines:
        print(f"  {C.DIM}    ... ({len(lines) - max_lines} more lines){C.END}")
    print()


def show_mcp_output(title, text, max_lines=40):
    """Show the formatted text that Claude Code would receive from the MCP tool."""
    lines = text.strip().split("\n")
    print(f"  {C.GREEN}[MCP Tool Result -> Claude Context] {title}{C.END}")
    print(f"  {C.GREEN}{'.' * 70}{C.END}")
    for line in lines[:max_lines]:
        print(f"  {C.GREEN}  {line}{C.END}")
    if len(lines) > max_lines:
        print(f"  {C.GREEN}  ... ({len(lines) - max_lines} more lines){C.END}")
    print(f"  {C.GREEN}{'.' * 70}{C.END}")
    print()


def show_metrics(metrics):
    print(f"  {C.BOLD}Performance:{C.END}")
    print(f"    Retrieval:       {metrics['retrieval_time_ms']:>8.1f} ms")
    print(f"    Decode:          {metrics['decode_time_ms']:>8.1f} ms")
    print(f"    Total:           {metrics['total_time_ms']:>8.1f} ms")
    print(f"    Modules searched:{metrics['modules_searched']:>8d}")
    print(f"    Modules matched: {metrics['modules_matched']:>8d}")
    print(f"    Tokens saved:    {metrics['tokens_saved']:>8d}")
    print()


def http_get(path):
    url = f"{BACKEND}/v1{path}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def http_post(path, body):
    url = f"{BACKEND}/v1{path}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def pause():
    input(f"  {C.DIM}[Press Enter to continue...]{C.END}")
    print()


# ── MCP tool formatters (mirror TypeScript tool handlers) ────────────────

def format_architect_consult(resp):
    """Mirrors mcp-server/src/tools/architect_consult.ts"""
    module_list = "\n".join(
        f"  - [{m['score']:.2f}] **{m['name']}** ({m['module_type']})"
        for m in resp["matched_modules"]
    )
    return "\n".join([
        "## Architecture Guidance",
        "",
        resp["dense_prompt"],
        "",
        "---",
        "**Matched modules:**",
        module_list,
        f"**Tokens saved:** {resp['metrics']['tokens_saved']} | "
        f"**Time:** {resp['metrics']['total_time_ms']:.0f}ms",
    ])


def format_skill_injector(resp, skill_id):
    """Mirrors mcp-server/src/tools/skill_injector.ts"""
    matched_name = resp["matched_modules"][0]["name"] if resp["matched_modules"] else skill_id
    return "\n".join([
        f"## Skill: {matched_name}",
        "",
        resp["dense_prompt"],
        "",
        "---",
        f"**Tokens saved:** {resp['metrics']['tokens_saved']} | "
        f"**Time:** {resp['metrics']['total_time_ms']:.0f}ms",
    ])


def format_skill_list(resp):
    """Mirrors mcp-server/src/tools/skill_injector.ts (list mode)"""
    lines = [
        f"- **{m['module_id']}**: {m['name']} -- {m['description'][:100]}"
        for m in resp["modules"]
    ]
    return "\n".join([
        f"## Available Skills ({resp['total']})",
        "",
        *lines,
        "",
        "Use any module_id above as the skill_id parameter.",
    ])


def format_compliance_verify(resp):
    """Mirrors mcp-server/src/tools/compliance_verify.ts"""
    rules_list = "\n".join(
        f"  - [{m['score']:.2f}] **{m['name']}**: {m['description'][:80]}"
        for m in resp["matched_modules"]
    )
    return "\n".join([
        "## Compliance Check",
        "",
        resp["dense_prompt"],
        "",
        "---",
        "**Rules matched:**",
        rules_list,
        f"**Tokens saved:** {resp['metrics']['tokens_saved']} | "
        f"**Time:** {resp['metrics']['total_time_ms']:.0f}ms",
    ])


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    banner("AwesomeContext MCP Server -- End-to-End Demo")
    print(f"  Backend: {BACKEND}")
    print(f"  This demo sends the EXACT same HTTP requests that the MCP TypeScript")
    print(f"  server sends, and formats responses the same way Claude Code sees them.\n")

    # ── Step 0: Health Check ──────────────────────────────────────────────
    section(0, "Health Check", "Verify the FastAPI backend is running")

    show_request("GET", "/v1/health")
    try:
        health = http_get("/health")
    except Exception as e:
        print(f"  {C.RED}FAILED: Cannot reach backend at {BACKEND}{C.END}")
        print(f"  {C.RED}{e}{C.END}")
        print(f"\n  {C.YELLOW}Please start the backend first:{C.END}")
        print(f"  {C.YELLOW}  python scripts/serve.py{C.END}")
        print(f"  {C.YELLOW}  (or: AC_RETRIEVAL_ONLY=true python scripts/serve.py){C.END}\n")
        sys.exit(1)

    show_json("Health Response", health)
    mode = "RETRIEVAL-ONLY" if not health.get("model_loaded") else "FULL (with LLM)"
    print(f"  {C.GREEN}Backend is running! Mode: {mode}{C.END}")
    print(f"  {C.GREEN}Index loaded: {health['index_loaded']}, Modules: {health['modules_count']}{C.END}\n")
    pause()

    # ── Step 1: List Modules ──────────────────────────────────────────────
    section(1, "List Available Modules",
            "MCP tool: skill_injector(skill_id='list') -> GET /v1/modules/list")

    show_request("GET", "/v1/modules/list?module_type=skill")
    skills_resp = http_get("/modules/list?module_type=skill")
    show_json("Skill Modules", skills_resp, max_lines=25)

    mcp_text = format_skill_list(skills_resp)
    show_mcp_output("skill_injector('list') -> Claude sees:", mcp_text, max_lines=30)

    # Also show module type breakdown
    all_modules = http_get("/modules/list")
    type_counts = {}
    for m in all_modules["modules"]:
        t = m["module_type"]
        type_counts[t] = type_counts.get(t, 0) + 1
    print(f"  {C.BOLD}All module types:{C.END}")
    for t, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"    {t:12s} : {count:3d} modules")
    print(f"    {'─' * 25}")
    print(f"    {'TOTAL':12s} : {all_modules['total']:3d} modules\n")
    pause()

    # ── Step 2: architect_consult ─────────────────────────────────────────
    section(2, "architect_consult",
            "Scenario: Developer asks 'Design a REST API with JWT authentication'")

    payload = {
        "intent": "Design a REST API with JWT authentication and role-based access control",
        "tool_name": "architect_consult",
        "top_k": 5,
        "session_id": "demo-session-001",
    }
    show_request("POST", "/v1/latent/query", payload)

    t0 = time.perf_counter()
    resp = http_post("/latent/query", payload)
    wall_ms = (time.perf_counter() - t0) * 1000

    show_json("Backend Response (matched_modules + metrics)", {
        "matched_modules": resp["matched_modules"],
        "metrics": resp["metrics"],
        "dense_prompt_length": len(resp["dense_prompt"]),
    })
    show_metrics(resp["metrics"])

    mcp_text = format_architect_consult(resp)
    show_mcp_output("architect_consult -> Claude sees:", mcp_text, max_lines=50)
    print(f"  {C.DIM}Wall clock (including HTTP): {wall_ms:.1f}ms{C.END}\n")
    pause()

    # ── Step 3: skill_injector (specific skill) ───────────────────────────
    section(3, "skill_injector (specific skill)",
            "Scenario: Developer requests 'skills/security-review' for a security audit")

    payload = {
        "skill_id": "skills/security-review",
        "tool_name": "skill_injector",
        "session_id": "demo-session-001",
    }
    show_request("POST", "/v1/latent/query", payload)

    t0 = time.perf_counter()
    resp = http_post("/latent/query", payload)
    wall_ms = (time.perf_counter() - t0) * 1000

    show_json("Backend Response (matched_modules + metrics)", {
        "matched_modules": resp["matched_modules"],
        "metrics": resp["metrics"],
        "dense_prompt_length": len(resp["dense_prompt"]),
    })
    show_metrics(resp["metrics"])

    mcp_text = format_skill_injector(resp, "skills/security-review")
    show_mcp_output("skill_injector('skills/security-review') -> Claude sees:", mcp_text, max_lines=50)
    print(f"  {C.DIM}Wall clock (including HTTP): {wall_ms:.1f}ms{C.END}\n")
    pause()

    # ── Step 4: skill_injector (another skill) ────────────────────────────
    section(4, "skill_injector (TDD workflow)",
            "Scenario: Developer requests 'skills/tdd-workflow' before writing tests")

    payload = {
        "skill_id": "skills/tdd-workflow",
        "tool_name": "skill_injector",
        "session_id": "demo-session-001",
    }
    show_request("POST", "/v1/latent/query", payload)

    t0 = time.perf_counter()
    resp = http_post("/latent/query", payload)
    wall_ms = (time.perf_counter() - t0) * 1000

    show_json("Backend Response", {
        "matched_modules": resp["matched_modules"],
        "metrics": resp["metrics"],
        "dense_prompt_length": len(resp["dense_prompt"]),
    })
    show_metrics(resp["metrics"])

    mcp_text = format_skill_injector(resp, "skills/tdd-workflow")
    show_mcp_output("skill_injector('skills/tdd-workflow') -> Claude sees:", mcp_text, max_lines=50)
    print(f"  {C.DIM}Wall clock (including HTTP): {wall_ms:.1f}ms{C.END}\n")
    pause()

    # ── Step 5: compliance_verify ─────────────────────────────────────────
    section(5, "compliance_verify",
            "Scenario: Check Python code against security & pattern rules")

    # In retrieval-only mode, keyword search works on code identifiers.
    # Use a descriptive intent that overlaps with rule metadata.
    # In full mode (with LLM), raw code gets semantically matched.
    is_retrieval_only = not health.get("model_loaded")

    vulnerable_code = textwrap.dedent("""\
    from django.http import JsonResponse
    from django.db import connection

    def login_view(request):
        username = request.POST['username']
        password = request.POST['password']

        cursor = connection.cursor()
        cursor.execute(
            f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
        )
        user = cursor.fetchone()

        if user:
            return JsonResponse({'token': generate_token(user), 'status': 'ok'})
        return JsonResponse({'error': 'Invalid credentials'}, status=401)
    """)

    print(f"  {C.BOLD}Vulnerable code being checked:{C.END}")
    for line in vulnerable_code.strip().split("\n"):
        print(f"    {C.DIM}{line}{C.END}")
    print()

    # 5a: Send code-based query (works best in full semantic mode)
    payload = {
        "code": vulnerable_code,
        "tool_name": "compliance_verify",
        "module_type_filter": "rule",
        "top_k": 5,
        "session_id": "demo-session-001",
    }
    show_request("POST", "/v1/latent/query", payload)

    t0 = time.perf_counter()
    resp = http_post("/latent/query", payload)
    wall_ms = (time.perf_counter() - t0) * 1000

    show_json("Backend Response", {
        "matched_modules": resp["matched_modules"],
        "metrics": resp["metrics"],
        "dense_prompt_length": len(resp["dense_prompt"]),
    })
    show_metrics(resp["metrics"])

    mcp_text = format_compliance_verify(resp)
    show_mcp_output("compliance_verify(code) -> Claude sees:", mcp_text, max_lines=50)
    print(f"  {C.DIM}Wall clock (including HTTP): {wall_ms:.1f}ms{C.END}\n")

    if is_retrieval_only and resp["metrics"]["modules_matched"] == 0:
        print(f"  {C.YELLOW}Note: In retrieval-only mode, keyword matching on raw code")
        print(f"  can miss rules because code tokens don't overlap with rule metadata.")
        print(f"  In FULL mode (with LLM), semantic embeddings would match:")
        print(f"    - rules/python--security  (SQL injection, secret management)")
        print(f"    - rules/common--security  (input validation, OWASP rules)")
        print(f"    - rules/python--patterns  (ORM patterns, type safety){C.END}")
        print()

        # 5b: Show intent-based compliance query as workaround
        print(f"  {C.BOLD}Workaround: pass intent keywords alongside code for compliance:{C.END}\n")
        payload2 = {
            "intent": "python security patterns testing coding-style",
            "tool_name": "compliance_verify",
            "module_type_filter": "rule",
            "top_k": 5,
            "session_id": "demo-session-001",
        }
        show_request("POST", "/v1/latent/query (intent fallback)", payload2)

        t0 = time.perf_counter()
        resp2 = http_post("/latent/query", payload2)
        wall_ms2 = (time.perf_counter() - t0) * 1000

        show_json("Backend Response (intent-based)", {
            "matched_modules": resp2["matched_modules"],
            "metrics": resp2["metrics"],
            "dense_prompt_length": len(resp2["dense_prompt"]),
        })
        show_metrics(resp2["metrics"])

        mcp_text2 = format_compliance_verify(resp2)
        show_mcp_output("compliance_verify(intent) -> Claude sees:", mcp_text2, max_lines=50)
        print(f"  {C.DIM}Wall clock (including HTTP): {wall_ms2:.1f}ms{C.END}\n")

    pause()

    # ── Step 6: architect_consult (React + state management) ──────────────
    section(6, "architect_consult (React frontend)",
            "Scenario: 'Build a React dashboard with global state management'")

    payload = {
        "intent": "React TypeScript dashboard with global state management and component architecture",
        "tool_name": "architect_consult",
        "top_k": 5,
        "session_id": "demo-session-001",
    }
    show_request("POST", "/v1/latent/query", payload)

    t0 = time.perf_counter()
    resp = http_post("/latent/query", payload)
    wall_ms = (time.perf_counter() - t0) * 1000

    show_json("Backend Response", {
        "matched_modules": resp["matched_modules"],
        "metrics": resp["metrics"],
        "dense_prompt_length": len(resp["dense_prompt"]),
    })
    show_metrics(resp["metrics"])

    mcp_text = format_architect_consult(resp)
    show_mcp_output("architect_consult -> Claude sees:", mcp_text, max_lines=50)
    print(f"  {C.DIM}Wall clock (including HTTP): {wall_ms:.1f}ms{C.END}\n")
    pause()

    # ── Summary ───────────────────────────────────────────────────────────
    banner("Demo Summary")

    print(f"  {C.BOLD}MCP Tool Call Flow:{C.END}\n")
    print(f"    Claude Code (user intent)")
    print(f"        |")
    print(f"        v")
    print(f"    MCP Server (TypeScript, stdio JSON-RPC)")
    print(f"        |  HTTP POST /v1/latent/query")
    print(f"        v")
    print(f"    FastAPI Backend (Python)")
    print(f"        |  intent encoding -> cosine search -> decode")
    print(f"        v")
    print(f"    Compiled Tensor Store (122 modules, safetensors)")
    print(f"        |")
    print(f"        v")
    print(f"    dense_prompt (injected into Claude context)")
    print()

    print(f"  {C.BOLD}Tools Demonstrated:{C.END}")
    print(f"    1. architect_consult  - Architecture rules + design patterns")
    print(f"    2. skill_injector     - Specific skill retrieval (+ list mode)")
    print(f"    3. compliance_verify  - Code compliance checking against rules")
    print()

    print(f"  {C.BOLD}How to connect to Claude Code:{C.END}")
    print(f"    Add to ~/.claude/claude_code_config.json:")
    print(f'    {C.CYAN}{{"mcpServers": {{"awesome-context": {{"command": "node",')
    print(f'     "args": ["mcp-server/dist/index.js"]}}}}}}{C.END}')
    print()

    print(f"  {C.GREEN}All 3 MCP tools working end-to-end!{C.END}\n")


if __name__ == "__main__":
    main()
