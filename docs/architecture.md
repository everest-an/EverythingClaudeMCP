# AwesomeContext 技术架构文档

> **版本**: v1.0
> **日期**: 2026-02-20

---

## 1. 系统拓扑

```
                          ┌─────────────────────────────────────────────────────┐
                          │                  AwesomeContext Gateway               │
                          │                                                     │
  ┌──────────┐  stdio     │  ┌───────────┐  HTTP POST     ┌────────────────┐   │
  │Claude    │◄──────────►│  │MCP Server │◄──────────────►│ FastAPI        │   │
  │Code      │  JSON-RPC  │  │(Node.js)  │  /v1/latent/   │ Backend        │   │
  │          │            │  │           │  query          │ (Python)       │   │
  └──────────┘            │  │ 3 Tools:  │                │                │   │
                          │  │ architect │                │ ┌────────────┐ │   │
                          │  │ skill     │                │ │IntentEnc.  │ │   │
                          │  │ comply    │                │ │Retriever   │ │   │
                          │  └───────────┘                │ │Decoder     │ │   │
                          │                               │ └─────┬──────┘ │   │
                          │                               │       │        │   │
                          │                               │ ┌─────▼──────┐ │   │
                          │                               │ │Qwen3-4B/14B│ │   │
                          │                               │ │(GPU/bf16)  │ │   │
                          │                               │ └─────┬──────┘ │   │
                          │                               │       │        │   │
                          │  ┌────────────────────────────┼───────▼──────┐ │   │
                          │  │           Data Layer        │             │ │   │
                          │  │                             │             │ │   │
                          │  │  data/tensors/*.safetensors │ (mmap)      │ │   │
                          │  │  data/index/embeddings.npy  │             │ │   │
                          │  │  data/index/manifest.json   │             │ │   │
                          │  └─────────────────────────────┴─────────────┘ │   │
                          └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────┐
  │         Offline Compilation              │
  │                                         │
  │  vendor/everything-claude-code/         │
  │  ├── agents/*.md                        │
  │  ├── skills/*/SKILL.md     ──► Scanner  │
  │  ├── rules/**/*.md              │       │
  │  ├── hooks/hooks.json           ▼       │
  │  ├── commands/*.md          Encoder     │
  │  └── contexts/*.md              │       │
  │                                 ▼       │
  │                          Persistence    │
  │                              │          │
  │                              ▼          │
  │                           Indexer       │
  └─────────────────────────────────────────┘
```

---

## 2. 模块详细设计

### 2.1 latent-engine 适配层 (`src/adapter/`)

#### 支持模型架构对比

latent-engine 原生支持 Qwen3-4B/14B（默认），同时兼容 Qwen2.5-Coder-1.5B 作为轻量降级方案。三者关键架构差异：

| 差异点 | Qwen3-4B (默认) | Qwen3-14B | Qwen2.5-Coder-1.5B (轻量备选) |
|--------|-----------------|-----------|-------------------------------|
| 模型架构 | Qwen3ForCausalLM | Qwen3ForCausalLM | Qwen2ForCausalLM |
| Hidden Dim | 2560 | 5120 | 1536 |
| 层数 | 36 | 40 | 28 |
| 聊天模板 | ChatML + `<think>` 支持 | ChatML + `<think>` 支持 | 纯 ChatML (`<\|im_start\|>`, `<\|im_end\|>`) |
| 权重绑定 | `tie_word_embeddings: false` | `tie_word_embeddings: false` | `tie_word_embeddings: true` |
| 精度 | bfloat16 (GPU) | bfloat16 (GPU) | float32 (CPU) |
| KV Head 数 | 4 (GQA) | 8 (GQA) | 2 (GQA) |
| Realignment 特性 | 完整 Ridge Regression | 完整 Ridge Regression | M* ≈ I（近单位矩阵） |
| 推荐 Latent Steps | 8-10 | 8-10 | 5 |

> **设计原则**：`AdaptedModelWrapper` 使用 `AutoModelForCausalLM` + `AutoTokenizer` 通用加载，不依赖硬编码架构常量。模型切换仅需修改 `model_name` 参数，Realignment Matrix 从实际模型权重动态计算。

#### `model_wrapper.py` — 核心类

```python
class AdaptedModelWrapper:
    """
    基于 latent-engine ModelWrapper 适配，支持多模型动态加载。

    关键方法：
    - __init__(model_name): 加载指定模型（默认 Qwen3-4B），自动构建 realignment matrix
    - generate_latent_steps(): 执行 N 步隐空间推理，返回 hidden states
    - decode_from_latent(): 将 latent embeddings 插入提示词，解码文本
    - encode_text(): 单次 forward pass 获取文本的隐空间表示

    模型切换仅需传入不同的 model_name，无需修改任何其他代码。
    """
```

#### Realignment Matrix 数学原理

目标：构建线性投影 M，将模型输出空间（hidden state）映射回输入空间（embedding）。

```
M* = argmin_M  || W_out @ M - W_in ||²  +  λ||M||²

其中：
  W_in  = model.model.embed_tokens.weight   [V, H]  (输入嵌入, V=vocab_size, H=hidden_dim)
  W_out = model.lm_head.weight               [V, H]  (输出头)
  λ     = 1e-4  (Tikhonov 正则化)

  Qwen3-4B:  V=151936, H=2560
  Qwen3-14B: V=151936, H=5120
  Qwen2.5-1.5B: V=151936, H=1536
```

解析解（Ridge Regression）：
```
M* = (W_out^T @ W_out + λI)^{-1} @ (W_out^T @ W_in)
```

**Qwen3 (默认)**：`tie_word_embeddings=false`，W_out 与 W_in 为独立训练的权重矩阵，M* 通过完整 Ridge Regression 求解。Realignment 投影包含更丰富的语义映射信息，隐空间表达力更强，但建议 8-10 步 latent steps 以充分收敛。Qwen3 还支持 `<think>` token，可在编码阶段利用思维链提升隐空间轨迹质量。

**Qwen2.5 特殊性**：由于 `tie_word_embeddings=true`，`W_out ≡ W_in`，所以：
```
M* ≈ (W^T @ W + λI)^{-1} @ (W^T @ W) ≈ I - λ(W^T@W + λI)^{-1}
```
M* 接近单位矩阵，隐空间循环极其稳定，5 步即可收敛，但表达力弱于 Qwen3。

#### 隐空间推理循环

```
Input: token_ids → embed_tokens → [B, seq_len, H]    (H = hidden_dim, 随模型变化)
                                        │
                                        ▼
                              Transformer Layers (×L)  (L = 36/40/28)
                                        │
                                        ▼
                              hidden_state[-1][:, -1, :] = h₀  [B, 1, H]
                                        │
                    ┌───────────────────┤
                    │                   │
               Step 1:              Step N:
            h₀ @ M* → e₁         h_{N-1} @ M* → eₙ
            normalize(e₁)         normalize(eₙ)
                 │                      │
                 ▼                      ▼
            model(inputs_embeds=e₁)  model(inputs_embeds=eₙ)
                 │                      │
                 ▼                      ▼
            h₁ [B, 1, H]           hₙ [B, 1, H]
                 │                      │
                 └──────────────────────┘
                           │
                           ▼
              latent_trajectory = [h₀, h₁, ..., hₙ]
              mean_embedding = mean(latent_trajectory)
```

---

### 2.2 编译管线 (`src/compiler/`)

#### 数据流

```
                  ┌──────────────────────────────────────────┐
                  │  scanner.scan_repository()                │
                  │                                          │
                  │  输入: vendor/everything-claude-code/     │
                  │  输出: List[ParsedModule]  (~100 个)      │
                  └─────────────┬────────────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────────────────────┐
                  │  encoder.encode_module(module)            │
                  │                                          │
                  │  1. build_rule_encoding_prompt()          │
                  │  2. tokenizer.apply_chat_template()       │
                  │  3. model.forward(output_hidden_states=T) │
                  │  4. generate_latent_steps(n=5)           │
                  │                                          │
                  │  输出: EncodedModule                      │
                  │    .mean_embedding    [H]                 │
                  │    .layer_states      [L, H]              │
                  │    .latent_trajectory [N, H]              │
                  └─────────────┬────────────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────────────────────┐
                  │  persistence.save_encoded_module()        │
                  │                                          │
                  │  data/tensors/{type}/{id}.safetensors     │
                  │  含 metadata: module_id, name, hash, etc  │
                  └─────────────┬────────────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────────────────────┐
                  │  indexer.build()                          │
                  │                                          │
                  │  data/index/embeddings.npy [N, H]        │
                  │  data/index/manifest.json                 │
                  │  L2 归一化 + NumPy cosine similarity      │
                  └──────────────────────────────────────────┘
```

#### 模块类型映射

| 源路径模式 | module_type | module_id 示例 |
|-----------|-------------|----------------|
| `agents/architect.md` | agent | `agents/architect` |
| `skills/security-review/SKILL.md` | skill | `skills/security-review` |
| `rules/common/coding-style.md` | rule | `rules/common--coding-style` |
| `rules/typescript/patterns.md` | rule | `rules/typescript--patterns` |
| `hooks/hooks.json` [entry] | hook | `hooks/PreToolUse-Bash` |
| `commands/plan.md` | command | `commands/plan` |
| `contexts/dev.md` | context | `contexts/dev` |

#### Safetensors 文件结构

每个 `.safetensors` 文件包含：

```
文件: data/tensors/skills/security-review.safetensors

张量 (维度随模型变化, H=hidden_dim, L=层数, N=latent_steps):
  "mean_embedding"    : float32/bfloat16 [H]       ← 检索用 (Qwen3-4B: 2560, Qwen3-14B: 5120)
  "layer_states"      : float32/bfloat16 [L, H]    ← 高保真解码用 (L: 36/40)
  "latent_trajectory" : float32/bfloat16 [N, H]    ← 推理轨迹 (N: 8-10 for Qwen3)

元数据 (字符串):
  "module_id"    : "skills/security-review"
  "module_type"  : "skill"
  "name"         : "Security Review"
  "description"  : "OWASP Top 10 vulnerability detection..."
  "content_hash" : "a3f8c2d1..."
  "token_count"  : "2847"
```

---

### 2.3 运行时网关 (`src/gateway/`)

#### 查询流程（以 `architect_consult` 为例）

```
1. Claude Code 调用: architect_consult(intent="实现带防抖的搜索输入框")
                                │
2. MCP Server 转发:            ▼
   POST /v1/latent/query { intent: "...", tool_name: "architect_consult" }
                                │
3. Intent Encoding:             ▼
   intent_encoder.encode("实现带防抖的搜索输入框")
   → query_vec [H]  (单次 forward pass, ~0.5-1s on GPU)
                                │
4. Retrieval:                   ▼
   retriever.retrieve(query_vec, top_k=3)
   → cosine similarity with data/index/embeddings.npy
   → 匹配: [skills/coding-standards (0.91), rules/common--patterns (0.87), agents/architect (0.83)]
                                │
5. Tensor Loading:              ▼
   safe_open("data/tensors/skills/coding-standards.safetensors")
   → load latent_trajectory (mmap, 仅读取需要的张量)
                                │
6. Latent Decoding:             ▼
   decoder.decode(retrieved_modules)
   → 构建解码提示词 (ChatML)
   → 将 latent_trajectory 插入 embedding 序列
   → model.generate(max_new_tokens=150)
   → dense_prompt: "【注入规则】：1. 使用 React Hook 规范；2. 引用 utils/debounce..."
                                │
7. Response:                    ▼
   { dense_prompt: "...", metrics: { tokens_saved: 1250 } }
```

#### Latent Embedding 插入策略

```
原始 embedding 序列:
  [<|im_start|>] [system] [\n] [You are...] [<|im_end|>] [\n]
  [<|im_start|>] [user]   [\n] [Based on...] [<|im_end|>] [\n]
  [<|im_start|>] [assistant] [\n]
                                    ↑
                              插入点: user 消息之后

插入后:
  [<|im_start|>] [system] [\n] [You are...] [<|im_end|>] [\n]
  [<|im_start|>] [user]   [\n] [latent₁] [latent₂] ... [latentₙ] [Based on...] [<|im_end|>] [\n]
  [<|im_start|>] [assistant] [\n]
```

---

### 2.4 FastAPI 后端 (`src/api/`)

#### 端点设计

| Method | Path | 功能 |
|--------|------|------|
| POST | `/v1/latent/query` | 统一查询接口（3 种工具共用） |
| GET | `/v1/modules/list` | 列出所有已编译模块 |
| GET | `/v1/health` | 健康检查 |
| GET | `/v1/metrics` | 性能指标 |

#### 生命周期管理

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动: 加载索引（轻量，毫秒级）
    app.state.index = NumpyIndex.load("data/index")

    # 模型延迟加载（首次查询时才加载，~30-60s）
    app.state.model = LazyModelWrapper()

    yield

    # 关闭: 释放资源
    del app.state.model
```

---

### 2.5 MCP Server (`mcp-server/`)

#### 工具注册

```typescript
// 3 个 MCP Tools
server.registerTool("architect_consult", {
  title: "Architecture Consultation",
  description: "在设计或重构前调用，提取架构规则和最佳实践",
  inputSchema: { intent: z.string(), session_id: z.string().optional() }
}, handler);

server.registerTool("skill_injector", {
  title: "Skill Context Injector",
  description: "精确拉取特定领域技能知识",
  inputSchema: { skill_id: z.string(), session_id: z.string().optional() }
}, handler);

server.registerTool("compliance_verify", {
  title: "Code Compliance Verifier",
  description: "代码提交前检查是否违背编码规范",
  inputSchema: { code: z.string(), rules_filter: z.string().optional() }
}, handler);
```

#### 传输协议

```
Claude Code ◄──stdio──► MCP Server (Node.js)
                │
                │  JSON-RPC 2.0 over stdin/stdout
                │  消息格式:
                │  → {"jsonrpc":"2.0","method":"tools/call","params":{...}}
                │  ← {"jsonrpc":"2.0","result":{"content":[{"type":"text","text":"..."}]}}
```

---

## 3. 目录结构

```
e:\AwesomeContext\
├── docs/
│   ├── PRD.md                          ← 本文件
│   └── architecture.md                 ← 本文件
├── vendor/                             ← Git 子模块
│   ├── latent-engine/
│   └── everything-claude-code/
├── src/
│   ├── adapter/                        ← latent-engine 多模型适配 (Qwen3/Qwen2.5)
│   │   ├── __init__.py
│   │   ├── config.py                   ← 模型常量
│   │   ├── model_wrapper.py            ← 核心: 模型加载/隐状态/解码
│   │   ├── chat_template.py            ← ChatML 提示词构建
│   │   └── realignment.py              ← Realignment Matrix
│   ├── compiler/                       ← 离线编译管线
│   │   ├── __init__.py
│   │   ├── scanner.py                  ← Markdown 文件遍历
│   │   ├── encoder.py                  ← 隐状态编码
│   │   ├── persistence.py              ← Safetensors 读写
│   │   ├── indexer.py                  ← 相似度索引
│   │   ├── delta.py                    ← 增量编译
│   │   └── cli.py                      ← CLI 入口
│   ├── gateway/                        ← 运行时解码网关
│   │   ├── __init__.py
│   │   ├── intent_encoder.py           ← Intent → 向量
│   │   ├── retriever.py                ← 张量检索
│   │   ├── decoder.py                  ← 隐状态 → 文本
│   │   └── session.py                  ← 会话管理
│   ├── api/                            ← FastAPI 后端
│   │   ├── __init__.py
│   │   ├── app.py                      ← 应用工厂
│   │   ├── routes.py                   ← 路由
│   │   ├── schemas.py                  ← Pydantic 模型
│   │   └── middleware.py               ← 中间件
│   └── shared/                         ← 共享工具
│       ├── __init__.py
│       ├── markdown_parser.py          ← YAML frontmatter 解析
│       ├── tensor_io.py                ← 张量 I/O 封装
│       ├── hashing.py                  ← 内容哈希
│       └── types.py                    ← 类型定义
├── mcp-server/                         ← MCP Server (TypeScript)
│   ├── src/
│   │   ├── index.ts                    ← 入口 + 工具注册
│   │   ├── client.ts                   ← FastAPI HTTP 客户端
│   │   ├── types.ts                    ← 类型定义
│   │   └── tools/
│   │       ├── architect_consult.ts
│   │       ├── skill_injector.ts
│   │       └── compliance_verify.ts
│   ├── package.json
│   └── tsconfig.json
├── data/                               ← 运行时数据（编译产物）
│   ├── tensors/{agents,skills,rules,hooks}/
│   ├── index/
│   └── cache/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── compile.py
│   ├── serve.py
│   ├── verify_tensors.py
│   └── benchmark.py
├── pyproject.toml
├── .gitignore
└── .gitmodules
```

---

## 4. 性能预估

### 离线编译 — Qwen3-4B (GPU, bfloat16) 【默认】

| 操作 | 单次耗时 | 总计 (~100 模块) |
|------|----------|-----------------|
| Forward pass (4B, seq~512) | ~1-3s | ~100-300s |
| Latent steps (×8) | ~8-24s | ~800-2400s |
| Safetensors 写入 | < 0.1s | < 10s |
| 索引构建 | < 1s | < 1s |
| **总计** | ~10-28s/模块 | **~17-47 分钟** |

### 离线编译 — Qwen2.5-1.5B (CPU, float32) 【轻量备选】

| 操作 | 单次耗时 | 总计 (~100 模块) |
|------|----------|-----------------|
| Forward pass (1.5B, seq~512) | ~5-10s | ~500-1000s |
| Latent steps (×5) | ~25-50s | ~2500-5000s |
| Safetensors 写入 | < 0.1s | < 10s |
| 索引构建 | < 1s | < 1s |
| **总计** | ~30-60s/模块 | **~50-100 分钟** |

### 运行时查询 — Qwen3-4B (GPU, bfloat16) 【默认】

| 操作 | 耗时 |
|------|------|
| Intent encoding (单次 forward) | ~0.3-0.8s |
| Index cosine search (100 模块) | < 1ms |
| Safetensors mmap 加载 | < 10ms |
| Latent decode (generate 150 tokens) | ~1-4s |
| **总计** | **~1.5-5s** (首次) |
| **缓存命中** | **< 100ms** |

### 运行时查询 — Qwen2.5-1.5B (CPU, float32) 【轻量备选】

| 操作 | 耗时 |
|------|------|
| Intent encoding (单次 forward) | ~1-2s |
| Index cosine search (100 模块) | < 1ms |
| Safetensors mmap 加载 | < 10ms |
| Latent decode (generate 150 tokens) | ~5-15s |
| **总计** | **~6-17s** (首次) |
| **缓存命中** | **< 100ms** |

### Token 节省

| 场景 | 原始 Token | 压缩后 | 节省率 |
|------|-----------|--------|--------|
| 单个 Skill 注入 | ~2000-5000 | < 150 | 96-97% |
| 3 模块架构咨询 | ~6000-15000 | < 150 | 98-99% |
| 合规检查 (5 规则) | ~10000-25000 | < 150 | 99%+ |
