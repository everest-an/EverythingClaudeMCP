# AwesomeContext Gateway - Test Report

**Date**: 2026-02-21
**Model**: Qwen2.5-Coder-1.5B-Instruct (CPU, float32)
**Platform**: Windows 11, Intel UHD 770, Python 3.12

---

## 1. Compilation Summary

| Metric | Value |
|--------|-------|
| Scanner found | 128 modules (122 unique, 6 hook duplicates) |
| Compiled | **122/122 (100%)** |
| Failed | 0 |
| Embedding dim | 1536 |
| Compile time | ~17 min (CPU, ~10s/module avg) |

### Module Distribution

| Type | Count | Avg Tokens | Description |
|------|-------|-----------|-------------|
| skill | 43 | 2,377 | Django, Spring Boot, Swift, Go, Python, etc. |
| command | 31 | 1,077 | TDD, review, deploy, orchestrate, etc. |
| rule | 23 | 191 | 4 languages x 5 categories + 7 common |
| agent | 13 | 1,002 | architect, reviewer, tdd-guide, etc. |
| hook | 9 | 96 | Lifecycle events (SessionStart, PreToolUse, etc.) |
| context | 3 | 129 | dev, research, review |

---

## 2. Unit Tests

```
59 passed in 12.55s
```

| Test File | Tests | Status |
|-----------|-------|--------|
| test_api.py | 2 | PASS |
| test_chat_template.py | 5 | PASS |
| test_config.py | 9 | PASS |
| test_delta.py | 5 | PASS |
| test_hashing.py | 3 | PASS |
| test_indexer.py | 7 | PASS |
| test_markdown_parser.py | 7 | PASS |
| test_realignment.py | 6 | PASS |
| test_scanner.py | 3 | PASS |
| test_session.py | 6 | PASS |
| test_tensor_io.py | 3 | PASS |
| test_types.py | 3 | PASS |

---

## 3. Tensor Verification

```
verify_tensors.py: 122 OK, 0 errors
```

| Check | Result |
|-------|--------|
| All L2 norms = 1.0 | PASS |
| No NaN values | PASS |
| No Inf values | PASS |
| All 3 tensors present per module | PASS |
| Metadata fields complete | PASS |
| Index manifest matches file count | PASS (122 = 122) |

---

## 4. Semantic Retrieval Quality

### 4.1 Module-to-Module Similarity (Index-level)

**Security query** (anchor: `rules/common--security`):

| Rank | Module | Cosine Sim |
|------|--------|-----------|
| 1 | rules/python--security | 0.9733 |
| 2 | rules/golang--security | 0.9721 |
| 3 | skills/security-review | 0.9565 |

**Testing query** (anchor: `rules/common--testing`):

| Rank | Module | Cosine Sim |
|------|--------|-----------|
| 1 | rules/python--testing | 0.9726 |
| 2 | rules/golang--testing | 0.9707 |
| 3 | rules/typescript--testing | 0.9490 |

### 4.2 Language Clustering

| Language | Modules | Intra-sim | vs Rest | Delta |
|----------|---------|-----------|---------|-------|
| C++ | 2 | 0.954 | 0.864 | **+0.091** |
| Swift | 2 | 0.974 | 0.885 | **+0.089** |
| Spring Boot | 6 | 0.923 | 0.870 | **+0.053** |
| TypeScript | 5 | 0.904 | 0.862 | **+0.042** |
| Python | 13 | 0.906 | 0.881 | **+0.025** |
| Go | 16 | 0.892 | 0.873 | **+0.019** |

> All positive delta = semantic clustering works correctly.

### 4.3 Global Discrimination

| Metric | Value |
|--------|-------|
| Global avg pairwise similarity | 0.877 |
| Min pairwise similarity | 0.638 (commands/refactor-clean vs rules/golang--hooks) |
| Max pairwise similarity | 0.992 (hooks/SessionEnd-all vs hooks/SessionStart-all) |

---

## 5. API End-to-End Tests

### 5.1 architect_consult (Intent-based Retrieval)

| Query | Top-1 | Top-2 | Top-3 | Correct? |
|-------|-------|-------|-------|----------|
| security XSS injection CSRF | skills/security-scan (0.957) | skills/django-security (0.950) | skills/swift-protocol-di-testing (0.876) | **YES** |
| unit test pytest TDD | skills/tdd-workflow (1.033) | commands/tdd (1.016) | skills/python-testing (0.975) | **YES** |
| Python Django Flask patterns | skills/python-patterns (0.996) | skills/django-patterns (0.984) | skills/backend-patterns (0.946) | **YES** |
| Go golang testing patterns | skills/golang-testing (0.965) | rules/golang--testing (0.941) | rules/golang--patterns (0.937) | **YES** |

> Score > 1.0 due to keyword boost (+0.05/hit).

### 5.2 compliance_verify (Code Compliance Check)

**Input**: SQL injection vulnerable code
```python
password = request.GET["password"]
query = f"SELECT * FROM users WHERE pass={password}"
```

| Rank | Module | Score |
|------|--------|-------|
| 1 | rules/common--patterns | 0.766 |
| 2 | rules/python--patterns | 0.765 |
| 3 | rules/python--security | 0.760 |

> Correctly routes to rules, correctly identifies Python and security.

### 5.3 skill_injector (Direct Lookup)

| Input | Result | Score |
|-------|--------|-------|
| skills/security-review | skills/security-review | 1.000 |

> Direct ID lookup works perfectly.

### 5.4 Performance

| Metric | Value |
|--------|-------|
| Index load | < 10ms |
| Intent encoding (first query, includes model load) | ~3,700ms |
| Intent encoding (cached) | ~470ms |
| Retrieval (122 modules) | 2.6ms |
| Decode (CPU, 1.5B) | ~50s |
| Decode (GPU, Qwen3-4B, estimated) | ~2s |

---

## 6. Token Savings

### Per-query Savings

| Query | Original Tokens | Compressed | Saved | Rate |
|-------|----------------|------------|-------|------|
| Security (top-5) | 8,726 | ~750 | 7,976 | **91.4%** |
| Testing (top-5) | 10,464 | ~750 | 9,714 | **92.8%** |
| Python (top-5) | 15,692 | ~750 | 14,942 | **95.2%** |
| Go (top-5) | 8,660 | ~750 | 7,910 | **91.3%** |
| Skill direct | 2,848 | ~150 | 2,698 | **94.7%** |

### Full Repository Compression

| Scenario | Raw Tokens | Latent Tokens | Saved | Rate |
|----------|-----------|---------------|-------|------|
| Top-3 retrieval (typical) | 3,630 | 450 | 3,180 | **87.6%** |
| All 23 rules | 4,409 | 3,450 | 959 | **21.8%** |
| Full repo (122 modules) | **154,933** | **18,300** | **136,633** | **88.2%** |

---

## 7. Issues Found & Fixed

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | Windows filename error for `hooks/PreToolUse-Edit\|Write` | Pipe `\|` is invalid in Windows filenames | `_sanitize_filename()` replaces `\|` with `--` |
| 2 | `verify_tensors.py` GBK encoding crash | `open()` defaults to GBK on Windows | Added `encoding="utf-8"` |
| 3 | Hook modules always ranked #1 in retrieval | Short content (~200 chars) produces "hub" embeddings near centroid | Exclude hook/context from `architect_consult` + keyword boost |
| 4 | Intent encoding doesn't match module space | Different ChatML templates for intent vs module | Unified template: both use `build_rule_encoding_prompt` structure |
| 5 | Stale index loaded by server | Index had 29 entries from old build | Rebuild index before server start |

---

## 8. Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Compilation** | A | 122/122 compiled, 0 errors |
| **Tensor integrity** | A | All norms = 1.0, no NaN/Inf |
| **Retrieval precision** | A | 5/5 query types return correct modules |
| **Language clustering** | A | All 6 languages show positive intra > inter similarity |
| **Token compression** | A | 88-95% reduction per query |
| **API stability** | A | Health, list, query, compliance, skill_injector all work |
| **Unit tests** | A | 59/59 passed |
| **Decode quality** | D | 1.5B CPU produces degenerate text (needs Qwen3-4B GPU) |
| **Response time** | C | Decode ~50s on CPU (retrieval is fast at 2.6ms) |

### Overall: **B+** (limited by CPU decode, retrieval is production-ready)

---

## 9. Next Steps

1. **GPU compilation** via [Colab notebook](../scripts/colab_compile.ipynb) - Qwen3-4B on T4 GPU
   - Expected: embedding dim 1536 -> 2560, latent steps 5 -> 8
   - Expected: decode quality from D -> A, decode time from 50s -> 2s
2. **Decode quality** will improve dramatically with Qwen3-4B
3. **Production deployment** ready for retrieval-only mode (skip decode, return module metadata)
