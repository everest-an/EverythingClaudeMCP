# AwesomeContext Gateway — 使用指南

> 将 122 个工程规则压缩为潜空间张量，通过 MCP 协议为 Claude Code 提供毫秒级的上下文注入。

---

## 目录

1. [快速开始](#1-快速开始)
2. [与 Claude Code 集成](#2-与-claude-code-集成)
3. [三个 MCP 工具](#3-三个-mcp-工具)
4. [API 直接调用](#4-api-直接调用)
5. [编译自定义规则](#5-编译自定义规则)
6. [云端部署](#6-云端部署)
7. [Colab GPU 编译](#7-colab-gpu-编译)
8. [故障排除](#8-故障排除)

---

## 1. 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+ (MCP server)
- 已编译的张量数据（项目自带 122 个模块）

### 安装

```bash
# 克隆项目
git clone --recursive <repo-url>
cd AwesomeContext

# 安装 Python 依赖
pip install -e .

# 安装 MCP server 依赖
cd mcp-server && npm install && npm run build && cd ..
```

### 一键启动

```bash
# 方式 1: 全功能模式（需要 ~6GB 内存，首次查询加载模型 ~30s）
python scripts/serve.py

# 方式 2: 检索模式（推荐，~8MB 内存，1ms 响应，无需 GPU）
AC_RETRIEVAL_ONLY=true python scripts/serve.py

# 方式 3: Docker
docker compose up
```

### 验证

```bash
# 健康检查
curl http://localhost:8420/v1/health

# 查看模块列表
curl http://localhost:8420/v1/modules/list | python -m json.tool

# 测试查询
curl -X POST http://localhost:8420/v1/latent/query \
  -H "Content-Type: application/json" \
  -d '{"tool_name":"architect_consult","intent":"Django REST API security","top_k":3}'
```

---

## 2. 与 Claude Code 集成

### 配置 MCP Server

在你的 Claude Code 配置文件中添加（`~/.claude/claude_desktop_config.json` 或项目级 `.mcp.json`）：

```json
{
  "mcpServers": {
    "awesome-context": {
      "command": "node",
      "args": ["<path-to>/AwesomeContext/mcp-server/dist/index.js"],
      "env": {
        "AC_BACKEND_URL": "http://127.0.0.1:8420"
      }
    }
  }
}
```

### 使用流程

```
                     Claude Code
                         │
                    ┌────┴────┐
                    │ MCP 协议 │
                    └────┬────┘
                         │ stdio (JSON-RPC)
              ┌──────────┼──────────┐
              │          │          │
    architect_consult  skill_injector  compliance_verify
              │          │          │
              └──────────┼──────────┘
                         │ HTTP POST
                    ┌────┴────┐
                    │ FastAPI  │ :8420
                    │ Gateway  │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
        Intent Encoder  Retriever   Decoder
        (Qwen model)   (NumPy)   (Qwen model)
              │          │          │
              └──────────┼──────────┘
                         │
                    ┌────┴────┐
                    │ Tensors  │ data/tensors/
                    │ + Index  │ data/index/
                    └─────────┘
```

启动顺序：
1. 先启动 FastAPI 后端：`python scripts/serve.py`
2. Claude Code 自动启动 MCP server（通过配置文件）
3. 在 Claude Code 中正常对话，工具会被自动调用

---

## 3. 三个 MCP 工具

### 3.1 architect_consult — 架构咨询

**用途**：设计功能、重构代码、做技术决策前，获取相关的架构模式和最佳实践。

**触发场景**：
- "设计一个 Django REST API 的用户认证系统"
- "React 状态管理方案选择"
- "Go 微服务架构设计"

**参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| intent | string (必填) | 架构意图描述 |
| session_id | string (可选) | 会话 ID，跨查询保持上下文 |

**返回内容**：匹配的 skill/agent/rule 模块内容（Top-3），包含代码示例和最佳实践。

**示例**：
```
Claude Code 中对话：
> 帮我设计一个 Django REST API 的用户认证系统

Claude 自动调用 architect_consult：
  → 返回: django-patterns (DRF ViewSet/Serializer 模式)
  → 返回: django-security (认证/授权/CSRF 配置)
  → 返回: architect (架构决策清单)

Claude 基于这些内容给出架构设计方案。
```

### 3.2 skill_injector — 技能注入

**用途**：直接加载特定技能的完整知识，如安全审查、TDD 工作流、部署模式等。

**触发场景**：
- 代码审查时加载 `security-review`
- 写测试时加载 `tdd-workflow`
- 部署时加载 `deployment-patterns`

**参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| skill_id | string (必填) | 技能 ID（如 `skills/security-review`）或 `list` 查看所有 |
| session_id | string (可选) | 会话 ID |

**可用技能（43 个）**：

| 类别 | 技能 |
|------|------|
| **安全** | security-review, security-scan, django-security, springboot-security |
| **测试** | tdd-workflow, python-testing, golang-testing, cpp-testing, e2e-testing |
| **框架** | django-patterns, springboot-patterns, frontend-patterns, backend-patterns |
| **语言** | python-patterns, golang-patterns, typescript-patterns, swift-*, cpp-* |
| **DevOps** | deployment-patterns, docker-patterns, database-migrations |
| **其他** | coding-standards, api-design, postgres-patterns, jpa-patterns |

**示例**：
```
> 帮我审查这段代码的安全性

Claude 调用 skill_injector(skill_id="skills/security-review")
  → 注入完整的 10 项安全检查清单（secrets, XSS, CSRF, SQL injection...）
  → Claude 逐项检查代码并报告问题
```

### 3.3 compliance_verify — 合规检查

**用途**：提交代码前，自动检查是否符合项目的编码规则。

**触发场景**：
- 提交代码前的自动检查
- 检查代码是否有安全漏洞
- 验证是否遵循项目编码风格

**参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| code | string (必填) | 要检查的代码片段 |
| rules_filter | string (可选) | 规则过滤：`common`, `python`, `typescript`, `golang` |
| session_id | string (可选) | 会话 ID |

**示例**：
```
> 检查这段代码是否合规：
> query = f"SELECT * FROM users WHERE name='{name}'"

Claude 调用 compliance_verify(code=..., rules_filter="python")
  → 匹配规则: python-security, python-patterns
  → 报告: SQL 注入漏洞，应使用参数化查询
```

---

## 4. API 直接调用

不通过 MCP，也可以直接调用 REST API。

### POST /v1/latent/query

主查询端点，支持三种工具类型：

```bash
# architect_consult: 意图检索
curl -X POST http://localhost:8420/v1/latent/query \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "architect_consult",
    "intent": "Go microservice testing patterns",
    "top_k": 5
  }'

# skill_injector: 直接查找
curl -X POST http://localhost:8420/v1/latent/query \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "skill_injector",
    "skill_id": "skills/tdd-workflow"
  }'

# compliance_verify: 代码合规
curl -X POST http://localhost:8420/v1/latent/query \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "compliance_verify",
    "code": "password = request.GET[\"pwd\"]",
    "module_type_filter": "rule"
  }'
```

**响应格式**：
```json
{
  "dense_prompt": "（压缩后的指令文本或模块元数据）",
  "latent_id": "uuid",
  "session_id": "uuid",
  "metrics": {
    "tokens_saved": 8726,
    "retrieval_time_ms": 2.6,
    "decode_time_ms": 0.0,
    "total_time_ms": 2.8,
    "modules_searched": 122,
    "modules_matched": 3
  },
  "matched_modules": [
    {
      "module_id": "skills/django-security",
      "name": "django-security",
      "module_type": "skill",
      "score": 0.957,
      "description": "Django security best practices..."
    }
  ]
}
```

### GET /v1/modules/list

```bash
# 所有模块
curl http://localhost:8420/v1/modules/list

# 按类型过滤
curl "http://localhost:8420/v1/modules/list?module_type=skill"
curl "http://localhost:8420/v1/modules/list?module_type=rule"
curl "http://localhost:8420/v1/modules/list?module_type=agent"
```

### GET /v1/health

```bash
curl http://localhost:8420/v1/health
# {"status":"ok","model_loaded":false,"index_loaded":true,"modules_count":122}
```

---

## 5. 编译自定义规则

### 添加自己的规则

在 `vendor/everything-claude-code/.cursor/` 下创建 markdown 文件：

```markdown
---
name: my-custom-rule
description: 我的自定义编码规则
---

# 自定义规则内容

## 规则 1
...
```

### 运行编译

```bash
# 增量编译（仅编译新增/修改的模块）
python scripts/compile.py --delta

# 全量编译
python scripts/compile.py

# 干跑模式（不实际编译，查看将编译的模块）
python scripts/compile.py --dry-run

# 指定模型
python scripts/compile.py --model-name Qwen/Qwen3-4B
```

### 验证编译结果

```bash
# 验证张量完整性
python scripts/verify_tensors.py

# 指定目录
python scripts/verify_tensors.py --tensor-dir data/tensors --index-dir data/index
```

---

## 6. 云端部署

### 方式 A: Railway（最简单）

```bash
# 1. 推送代码到 GitHub
git push origin main

# 2. 在 Railway 创建项目 → 连接 GitHub 仓库
# Railway 自动读取 railway.toml，构建 retrieval-only 镜像
# 自动分配 HTTPS 域名
```

环境变量（Railway 自动设置 PORT）：
```
AC_RETRIEVAL_ONLY=true
```

### 方式 B: Docker

```bash
# 构建 retrieval-only 镜像（~200MB，无 GPU）
docker build --target retrieval -t awesome-context .

# 运行
docker run -p 8080:8080 awesome-context

# 或使用 docker compose
docker compose up
```

### 方式 C: Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/PROJECT/awesome-context
gcloud run deploy awesome-context \
  --image gcr.io/PROJECT/awesome-context \
  --port 8080 \
  --set-env-vars "AC_RETRIEVAL_ONLY=true"
```

### 两种运行模式对比

| | Retrieval-Only | Full |
|--|----------------|------|
| **内存** | ~8 MB | ~6 GB |
| **响应时间** | 1ms | 500ms (编码) + 50s (解码, CPU) |
| **GPU** | 不需要 | 推荐 |
| **检索方式** | 关键词匹配 | 语义嵌入 (cosine similarity) |
| **返回内容** | 模块元数据 | 解码后的压缩指令 |
| **适用场景** | 云端部署、模块发现 | 本地开发、完整语义搜索 |
| **环境变量** | `AC_RETRIEVAL_ONLY=true` | （默认） |

---

## 7. Colab GPU 编译

本机无 NVIDIA GPU 时，可用 Google Colab 免费 T4 编译 Qwen3-4B 版本。

### 步骤

1. 打开 `scripts/colab_compile.ipynb`
2. 上传到 Google Colab
3. 选择 T4 GPU 运行时
4. 按顺序执行 8 个步骤
5. 下载编译后的 `tensors-qwen3-4b.tar.gz`

### 使用 GPU 编译结果

```bash
# 解压
tar xzf tensors-qwen3-4b.tar.gz

# 启动服务（指定 GPU 编译的张量目录）
python scripts/serve.py \
  --tensor-dir data/tensors-qwen3-4b \
  --index-dir data/index-qwen3-4b
```

### CPU vs GPU 编译对比

| | Qwen2.5-1.5B (CPU) | Qwen3-4B (GPU) |
|--|---------------------|-----------------|
| **嵌入维度** | 1536 | 2560 |
| **潜空间步数** | 5 | 8 |
| **编译时间** | ~17 min | ~5 min (T4) |
| **解码质量** | D (退化文本) | A (流畅指令) |
| **检索精度** | A (cosine search 正常) | A+ (更细粒度) |

---

## 8. 故障排除

### 常见问题

**Q: 服务启动后 modules_count 为 0**
```bash
# 需要先编译，或确认 data/index/manifest.json 存在
python scripts/compile.py
# 然后重启服务
```

**Q: Windows 上编译失败，文件名包含 `|`**
```
已修复：persistence.py 中的 _sanitize_filename() 自动替换非法字符。
```

**Q: 查询总是返回 hooks 模块**
```
已修复：architect_consult 自动排除 hook/context 类型模块，
并通过关键词增强提高检索精度。
```

**Q: 解码结果是乱码**
```
Qwen2.5-1.5B 在 CPU 上的解码质量较差（评级 D）。
解决方案：
1. 使用 retrieval-only 模式（跳过解码）
2. 用 Colab 编译 Qwen3-4B 版本
```

**Q: 如何查看所有可用模块？**
```bash
curl http://localhost:8420/v1/modules/list | python -c "
import sys, json
for m in json.load(sys.stdin)['modules']:
    print(f'  [{m[\"module_type\"]:8s}] {m[\"module_id\"]}')"
```

### 环境变量一览

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `HOST` | 127.0.0.1 | 服务绑定地址 |
| `PORT` | 8420 | 服务端口 |
| `AC_RETRIEVAL_ONLY` | false | 检索模式（无模型） |
| `AC_TENSOR_DIR` | data/tensors | 张量文件目录 |
| `AC_INDEX_DIR` | data/index | 索引文件目录 |
| `AC_MODEL` | (自动) | 模型名称 |
| `AC_BACKEND_URL` | http://127.0.0.1:8420 | MCP→后端连接地址 |

### 运行测试

```bash
# 单元测试
python -m pytest tests/ -v

# 张量验证
python scripts/verify_tensors.py

# 开发工作流演示
python scripts/demo_workflow.py
```

---

## 项目统计

| 指标 | 值 |
|------|------|
| Python 源码 | 2,913 行 / 28 文件 |
| TypeScript MCP | 344 行 / 6 文件 |
| 单元测试 | 59/59 通过 |
| 编译模块 | 122 个 (43 skill, 31 command, 23 rule, 13 agent, 9 hook, 3 context) |
| 检索延迟 | 1.1ms (keep-alive) |
| Token 压缩率 | 88-95% |
| QPS | ~909 queries/sec |
