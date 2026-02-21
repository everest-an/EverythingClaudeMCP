#!/usr/bin/env python3
"""Demo: Realistic development workflow showing AwesomeContext content injection.

Simulates a developer building a Django REST API user authentication feature,
going through: architecture planning → code creation → security review →
TDD testing → compliance check → bug fix cycle.

Each step shows EXACTLY what content would be injected into the Claude context.
"""

import json
import os
import sys
import textwrap
from pathlib import Path

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Ensure project root is in path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Colors for terminal output
class C:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    END = "\033[0m"

def banner(text, color=C.HEADER):
    width = 80
    print(f"\n{color}{'=' * width}")
    print(f"  {text}")
    print(f"{'=' * width}{C.END}\n")

def step(num, title, description):
    print(f"{C.BOLD}{C.CYAN}━━━ Step {num}: {title} ━━━{C.END}")
    print(f"{C.DIM}{description}{C.END}\n")

def show_query(tool_name, **kwargs):
    print(f"{C.YELLOW}  📡 API Call: POST /v1/latent/query{C.END}")
    print(f"{C.YELLOW}  tool_name: {tool_name}{C.END}")
    for k, v in kwargs.items():
        val = v if len(str(v)) < 60 else str(v)[:57] + "..."
        print(f"{C.YELLOW}  {k}: {val}{C.END}")
    print()

def show_match(rank, module_id, module_type, score, tokens, desc=""):
    bar = "█" * int(score * 20) + "░" * (20 - int(score * 20))
    print(f"  {C.GREEN}#{rank}{C.END} [{module_type:6s}] {C.BOLD}{module_id}{C.END}")
    print(f"     Score: {bar} {score:.3f}  |  Tokens: {tokens:,}")
    if desc:
        print(f"     {C.DIM}{desc[:80]}{C.END}")
    print()

def show_content(title, content, max_lines=25):
    lines = content.strip().split("\n")
    print(f"  {C.BLUE}┌─ {title} ({len(lines)} lines, ~{len(content):,} chars) ─┐{C.END}")
    for i, line in enumerate(lines[:max_lines]):
        print(f"  {C.BLUE}│{C.END} {line}")
    if len(lines) > max_lines:
        print(f"  {C.BLUE}│{C.END} {C.DIM}... ({len(lines) - max_lines} more lines){C.END}")
    print(f"  {C.BLUE}└{'─' * 60}┘{C.END}")
    print()

def show_savings(original_tokens, injected_chars):
    injected_tokens = int(injected_chars * 0.3)  # rough: ~3.3 chars per token
    saved = original_tokens - injected_tokens
    rate = (saved / original_tokens * 100) if original_tokens > 0 else 0
    print(f"  {C.GREEN}💾 Token Savings:{C.END}")
    print(f"     Original:  {original_tokens:>6,} tokens (full markdown)")
    print(f"     Injected:  {injected_tokens:>6,} tokens (dense prompt)")
    print(f"     Saved:     {saved:>6,} tokens ({rate:.0f}% reduction)")
    print()

def pause():
    input(f"{C.DIM}  [Press Enter to continue...]{C.END}")
    print()


# ============================================================================
# Load source modules
# ============================================================================

VENDOR = project_root / "vendor" / "everything-claude-code" / ".cursor"

def load_module(rel_path):
    path = VENDOR / rel_path
    if path.exists():
        return path.read_text(encoding="utf-8")
    return f"(Module not found: {rel_path})"


def main():
    banner("AwesomeContext Gateway — 真实开发工作流演示")
    print(f"  Scenario: 开发者正在用 Django 构建一个 REST API 用户认证功能")
    print(f"  Goal: 展示每个开发阶段 Claude 上下文中实际注入的完整内容\n")
    print(f"  {C.DIM}Module source: vendor/everything-claude-code/.cursor/{C.END}")
    print(f"  {C.DIM}Compiled tensors: data/tensors/ (122 modules){C.END}")
    print()
    pause()

    # ================================================================
    # STEP 1: Architecture Planning
    # ================================================================
    step(1, "架构规划 (architect_consult)",
         "开发者说: '我需要设计一个 Django REST API 的用户认证系统'")

    show_query("architect_consult",
               intent="Django REST API user authentication architecture design",
               top_k=3)

    modules = [
        ("skills/django-patterns/SKILL.md", "skills/django-patterns", "skill", 0.984, 4323,
         "Django architecture patterns, REST API design with DRF, ORM best practices"),
        ("agents/architect.md", "agents/architect", "agent", 0.952, 1305,
         "Software architecture specialist for system design and scalability"),
        ("skills/django-security/SKILL.md", "skills/django-security", "skill", 0.950, 3590,
         "Django security best practices, authentication, authorization"),
    ]

    print(f"  {C.BOLD}📋 检索结果 (cosine similarity + keyword boost):{C.END}\n")
    for i, (path, mid, mtype, score, tokens, desc) in enumerate(modules, 1):
        show_match(i, mid, mtype, score, tokens, desc)

    total_tokens = sum(m[4] for m in modules)
    print(f"  {C.BOLD}🔍 注入到 Claude 上下文的完整内容:{C.END}\n")

    # Show first module content
    content1 = load_module("skills/django-patterns/SKILL.md")
    show_content("skills/django-patterns (Top-1)", content1, max_lines=30)
    pause()

    content2 = load_module("agents/architect.md")
    show_content("agents/architect (Top-2)", content2, max_lines=20)

    content3 = load_module("skills/django-security/SKILL.md")
    show_content("skills/django-security (Top-3)", content3, max_lines=20)

    show_savings(total_tokens, len(content1) + len(content2) + len(content3))
    pause()

    # ================================================================
    # STEP 2: Developer writes code with potential vulnerability
    # ================================================================
    step(2, "开发者写了带漏洞的代码 (compliance_verify)",
         "开发者提交了以下代码，系统自动进行合规检查")

    vulnerable_code = textwrap.dedent("""\
    # apps/users/views.py
    from django.http import JsonResponse
    from django.contrib.auth import authenticate

    def login_view(request):
        username = request.POST['username']
        password = request.POST['password']

        # SQL injection vulnerability!
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute(
            f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
        )
        user = cursor.fetchone()

        if user:
            return JsonResponse({'token': generate_token(user), 'status': 'ok'})
        return JsonResponse({'error': 'Invalid credentials'}, status=401)
    """)

    show_content("开发者提交的代码", vulnerable_code, max_lines=20)

    show_query("compliance_verify",
               code="(above code)",
               module_type_filter="rule",
               top_k=3)

    rules = [
        ("rules/python-security.md", "rules/python--security", "rule", 0.760, 252,
         "Python security: dotenv secret management, bandit static analysis"),
        ("rules/python-patterns.md", "rules/python--patterns", "rule", 0.765, 180,
         "Python patterns: Protocol duck typing, dataclass DTOs"),
        ("rules/common-security.md", "rules/common--security", "rule", 0.740, 0,
         "Common security rules across all languages"),
    ]

    print(f"  {C.BOLD}📋 合规检查命中的规则:{C.END}\n")
    for i, (path, mid, mtype, score, tokens, desc) in enumerate(rules, 1):
        show_match(i, mid, mtype, score, tokens, desc)

    print(f"  {C.BOLD}🔍 注入的安全规则内容:{C.END}\n")
    rule_content = load_module("rules/python-security.md")
    show_content("rules/python--security", rule_content, max_lines=15)

    django_sec = load_module("skills/django-security/SKILL.md")
    # Show the SQL injection section specifically
    sql_section_start = django_sec.find("## SQL Injection Prevention")
    sql_section_end = django_sec.find("## XSS Prevention")
    if sql_section_start > 0 and sql_section_end > 0:
        sql_section = django_sec[sql_section_start:sql_section_end]
        show_content("skills/django-security → SQL Injection Prevention 章节", sql_section, max_lines=25)

    print(f"  {C.RED}⚠️  Claude 会基于以上规则识别出:{C.END}")
    print(f"  {C.RED}  1. SQL 注入漏洞 (string interpolation in raw SQL){C.END}")
    print(f"  {C.RED}  2. 明文密码比较 (should use Django ORM + set_password){C.END}")
    print(f"  {C.RED}  3. 缺少 CSRF 保护{C.END}")
    print(f"  {C.RED}  4. 缺少 rate limiting{C.END}")
    print()
    pause()

    # ================================================================
    # STEP 3: Security Review
    # ================================================================
    step(3, "安全审查 (skill_injector: security-review)",
         "触发完整的安全审查技能，注入详细的安全检查清单")

    show_query("skill_injector",
               skill_id="skills/security-review",
               top_k=1)

    show_match(1, "skills/security-review", "skill", 1.000, 2998,
               "Comprehensive security checklist: secrets, input validation, SQL injection, XSS, CSRF")

    sec_content = load_module("skills/security-review/SKILL.md")
    show_content("skills/security-review (完整注入)", sec_content, max_lines=40)
    show_savings(2998, len(sec_content))
    pause()

    # ================================================================
    # STEP 4: TDD - Fix the vulnerability
    # ================================================================
    step(4, "TDD 修复 (architect_consult + skill_injector)",
         "开发者说: '用 TDD 方法修复这个认证功能'")

    show_query("architect_consult",
               intent="Python Django TDD test-driven development pytest",
               top_k=3)

    tdd_modules = [
        ("skills/tdd-workflow/SKILL.md", "skills/tdd-workflow", "skill", 1.033, 2440,
         "TDD workflow with 80%+ coverage, unit/integration/E2E tests"),
        ("commands/tdd.md", "commands/tdd", "command", 1.016, 1935,
         "TDD command: RED → GREEN → REFACTOR cycle"),
        ("rules/python-testing.md", "rules/python--testing", "rule", 0.975, 214,
         "Python testing: pytest framework, coverage reporting"),
    ]

    print(f"  {C.BOLD}📋 检索到的 TDD 模块:{C.END}\n")
    for i, (path, mid, mtype, score, tokens, desc) in enumerate(tdd_modules, 1):
        show_match(i, mid, mtype, score, tokens, desc)

    print(f"  {C.BOLD}🔍 注入的 TDD 指导内容:{C.END}\n")

    tdd_content = load_module("skills/tdd-workflow/SKILL.md")
    show_content("skills/tdd-workflow (Top-1)", tdd_content, max_lines=30)
    pause()

    tdd_cmd = load_module("commands/tdd.md")
    show_content("commands/tdd (Top-2)", tdd_cmd, max_lines=25)

    pytest_rule = load_module("rules/python-testing.md")
    show_content("rules/python--testing (Top-3)", pytest_rule, max_lines=15)

    total_tdd = sum(m[4] for m in tdd_modules)
    show_savings(total_tdd, len(tdd_content) + len(tdd_cmd) + len(pytest_rule))
    pause()

    # ================================================================
    # STEP 5: Fixed code
    # ================================================================
    step(5, "修复后的代码",
         "Claude 基于注入的规则生成了安全的实现")

    fixed_code = textwrap.dedent("""\
    # apps/users/views.py — 修复后
    from rest_framework import status
    from rest_framework.decorators import api_view, throttle_classes
    from rest_framework.response import Response
    from rest_framework.throttling import AnonRateThrottle
    from django.contrib.auth import authenticate
    from .serializers import LoginSerializer

    class LoginRateThrottle(AnonRateThrottle):
        rate = '5/min'  # ← rate limiting (from security-review)

    @api_view(['POST'])
    @throttle_classes([LoginRateThrottle])
    def login_view(request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # ← input validation (from security-review)

        user = authenticate(  # ← Django ORM, no raw SQL (from django-security)
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},  # ← generic error (from security-review §8)
                status=status.HTTP_401_UNAUTHORIZED
            )

        token = Token.objects.get_or_create(user=user)[0]
        return Response({'token': token.key})
    """)

    show_content("修复后的安全代码", fixed_code, max_lines=30)

    print(f"  {C.GREEN}✅ 修复点 (来源于注入的规则):{C.END}")
    print(f"  {C.GREEN}  1. ORM 替代原生 SQL        ← django-security §SQL Injection Prevention{C.END}")
    print(f"  {C.GREEN}  2. Input validation (Zod)   ← security-review §2 Input Validation{C.END}")
    print(f"  {C.GREEN}  3. Rate limiting            ← security-review §7 Rate Limiting{C.END}")
    print(f"  {C.GREEN}  4. Generic error messages   ← security-review §8 Sensitive Data Exposure{C.END}")
    print(f"  {C.GREEN}  5. authenticate() 自动处理密码哈希  ← django-security §Authentication{C.END}")
    print()
    pause()

    # ================================================================
    # SUMMARY
    # ================================================================
    banner("📊 工作流总结")

    print(f"  {C.BOLD}开发阶段          注入模块                       Tokens{C.END}")
    print(f"  {'─' * 70}")
    print(f"  1. 架构规划       django-patterns + architect       {4323 + 1305 + 3590:>6,}")
    print(f"  2. 合规检查       python-security + django-security {252 + 180:>6,}")
    print(f"  3. 安全审查       security-review (完整)            {2998:>6,}")
    print(f"  4. TDD 修复       tdd-workflow + tdd + python-testing{2440 + 1935 + 214:>6,}")
    print(f"  {'─' * 70}")
    total = 4323 + 1305 + 3590 + 252 + 180 + 2998 + 2440 + 1935 + 214
    print(f"  {C.BOLD}  Total injected:                               {total:>6,} tokens{C.END}")
    print(f"  {C.BOLD}  Full repo (122 modules):                     154,933 tokens{C.END}")
    print(f"  {C.BOLD}  Savings:                                  {154933 - total:>6,} tokens ({(154933 - total) / 154933 * 100:.0f}%){C.END}")
    print()
    print(f"  {C.GREEN}✅ 每次查询只注入 3-5 个最相关的模块 (~5,000-10,000 tokens)")
    print(f"  ✅ 而不是注入全部 122 个模块 (154,933 tokens)")
    print(f"  ✅ 节省 88-95% 的 token 开销，且内容精确匹配开发场景{C.END}")
    print()

    banner("🏁 演示结束")
    print(f"  {C.DIM}Run: python scripts/demo_workflow.py{C.END}")
    print()


if __name__ == "__main__":
    main()
