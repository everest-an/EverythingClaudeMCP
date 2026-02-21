# 产品需求文档 (PRD)：AwesomeContext 规则注入网关

> **版本**: v1.0
> **日期**: 2026-02-20
> **状态**: 实施中

---

## 1. 项目愿景 (System Objective)

构建一个基于 latent-engine 的**隐式上下文引擎**。通过将复杂的工程指令集（Rules/Skills）从"文本空间"压缩至"隐空间张量"，解决 Claude Code 在长上下文下的：

| 痛点 | 现状 | 目标 |
|------|------|------|
| Token 损耗 | 每次注入完整 Markdown 规则（数千 Token） | 压缩至 < 150 Token 的高密度指令流 |
| 规则漂移 | 长上下文中规则被逐渐"遗忘" | 隐空间张量保持规则语义完整性 |
| 推理延迟 | 大量规则文本增加推理时间 | 张量检索 + 解码在毫秒级完成 |

---

## 2. 核心技术选型 (Technical Stack)

| 维度 | 规格要求 | 备注 |
|------|----------|------|
| 基座模型 | 多模型支持（见下表） | 默认 Qwen3-4B，可选 Qwen3-14B / Qwen2.5-Coder-1.5B |
| 核心算法 | latent-engine (Gen-Verse) | 隐层张量拦截、对齐与映射。原生支持 Qwen3，兼容 Qwen2.5 |
| 持久化格式 | Safetensors | 工业级张量序列化，支持 mmap 零拷贝加载 |
| 通讯协议 | MCP (Model Context Protocol) | 适配 Claude Code 官方工具链 |
| 后端框架 | FastAPI (Python 3.10+) | 处理张量计算逻辑 |
| MCP Server | Node.js + TypeScript | stdio 传输，@modelcontextprotocol/sdk |
| 运行环境 | GPU (bfloat16) / CPU (float32) | Qwen3 系列推荐 GPU；Qwen2.5-1.5B 可纯 CPU |

### 2.1 支持模型矩阵

| 模型 | Hidden Dim | 层数 | 权重绑定 | 推荐硬件 | 内存需求 | 适用场景 |
|------|-----------|------|----------|----------|----------|----------|
| **Qwen3-4B** (默认) | 2560 | 36 | ❌ `tie=false` | GPU (≥8GB VRAM) | ~8GB (bfloat16) | latent-engine 原生支持，编码质量与资源消耗的最佳平衡 |
| **Qwen3-14B** | 5120 | 40 | ❌ `tie=false` | GPU (≥24GB VRAM) | ~28GB (bfloat16) | 最高编码精度，适合大规模规则库（>200 模块） |
| **Qwen2.5-Coder-1.5B-Instruct** (轻量备选) | 1536 | 28 | ✅ `tie=true` | CPU | ~6GB (float32) | 无 GPU 环境的轻量降级方案 |

> **选型建议**：默认使用 Qwen3-4B，这是 latent-engine 的原生支持模型，隐空间表达力最佳；规则库 >200 模块且追求极致精度选 Qwen3-14B；仅在无 GPU 的开发机上才退回 Qwen2.5-1.5B。

---

## 3. 系统架构 (Architecture Overview)

```
┌─────────────┐     stdio/JSON-RPC     ┌──────────────────┐     HTTP/JSON     ┌─────────────────────┐
│ Claude Code  │ ◄──────────────────► │  MCP Server       │ ◄──────────────► │  FastAPI Backend      │
│ (用户侧)     │                       │  (Node.js/TS)     │                  │  (Python)             │
│              │                       │                   │                  │                       │
│ 调用 3 个    │                       │ architect_consult │                  │ ┌─────────────────┐   │
│ MCP Tools    │                       │ skill_injector    │                  │ │ Intent Encoder  │   │
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
                                                                            │ │ Safetensor Store │   │
                                                                            │ │ + NumPy Index    │   │
                                                                            │ └─────────────────┘   │
                                                                            └───────────────────────┘
```

### 3.1 记忆编译器 (The Latent Compiler) — 离线

将 everything-claude-code 仓库"编译"为张量：

```
Markdown Files ──► Scanner ──► Encoder (Qwen3/2.5 forward pass) ──► Persistence (.safetensors) ──► Index (cosine sim)
```

1. **扫描器 (Scanner)**：遍历 `agents/`, `skills/`, `rules/`, `hooks/`, `commands/`, `contexts/` 下的 Markdown 文件
2. **编码器 (Encoder)**：
   - 构建 ChatML 提示词（系统角色 + 规则内容）
   - 调用基座模型（默认 Qwen3-4B）进行 forward 传播
   - 截获最后一个 token 位置的所有隐藏层 hidden_states（Qwen3-4B: 36 层, Qwen3-14B: 40 层）
   - 执行 N 步隐空间推理（latent steps），通过 realignment matrix 将 hidden state 投影回 embedding space 并重新输入
3. **持久化 (Persistence)**：每个模块生成一个 `.safetensors` 文件，包含：
   - `mean_embedding` [H] — 用于相似度检索（H = 模型 hidden_dim，Qwen3-4B: 2560, Qwen3-14B: 5120）
   - `layer_states` [L, H] — 每层的隐状态（L = 层数）
   - `latent_trajectory` [N, H] — 隐空间推理轨迹
4. **索引 (Indexer)**：基于 mean_embedding 构建 L2 归一化的余弦相似度索引

### 3.2 动态解码网关 (JIT Decoder Gateway) — 运行时

实时响应 Claude 的工具调用：

```
User Intent ──► Intent Encoder ──► Cosine Retrieval ──► Load Tensors (mmap) ──► Embed Insertion ──► LM_Head Decode ──► Dense Prompt
```

1. **意图编码**：将用户的 intent 通过模型单次 forward pass 转换为 [H] 向量（维度随模型变化）
2. **Attention 检索**：与持久化张量库的 mean_embedding 计算余弦相似度，取 Top-K
3. **高密度解码**：将检索到的 latent trajectory 插入解码提示词的 embedding 序列中，通过 LM Head 解码出 < 150 Token 的压缩指令

---

## 4. MCP 工具箱定义 (MCP Tools Spec)

### Tool 1: `architect_consult(intent)`

**用途**：在进行任何模块设计或代码重构前调用，从隐层记忆中提取全局架构规则。

```json
// 输入
{ "intent": "实现一个带防抖的搜索输入框" }

// 输出
"【注入规则】：1. 使用 React Hook 规范；2. 引用 utils/debounce；3. 样式必须符合 UI-System 第 4 条。"
```

**触发场景**：规划功能设计、技术选型、架构审查

### Tool 2: `skill_injector(skill_id)`

**用途**：精确拉取特定技能的上下文（如 security-audit、tdd-workflow）。

```json
// 输入
{ "skill_id": "skills/security-review" }

// 输出：该 Skill 在隐空间中关联的所有边界条件和禁用项
```

**触发场景**：需要特定领域知识（安全审计、TDD、数据库迁移等）

### Tool 3: `compliance_verify(code)`

**用途**：在代码提交前，将代码片段在隐空间进行特征比对，检查是否违背预设规范。

```json
// 输入
{ "code": "function getData() { ... }" }

// 输出
{ "compliant": false, "violations": [...], "suggestions": [...] }
```

**触发场景**：代码审查、提交前检查

---

## 5. API 接口规格 (API Spec)

### `POST /v1/latent/query`

MCP Server → FastAPI Backend 的统一查询接口。

**Request:**
```json
{
  "intent": "string",           // 用户意图（architect_consult）
  "session_id": "string",       // 会话 ID
  "memory_partition": "default", // 检索分区
  "top_k": 3,                   // 返回 Top-K 匹配
  "module_type_filter": null,   // 可选：agent/skill/rule
  "tool_name": "string",        // 调用方工具名
  "skill_id": null,             // skill_injector 专用
  "code": null                  // compliance_verify 专用
}
```

**Response:**
```json
{
  "dense_prompt": "string",     // 高密度压缩指令（< 150 tokens）
  "latent_id": "hex_string",
  "session_id": "string",
  "metrics": {
    "tokens_saved": 1250,
    "retrieval_time_ms": 12.5,
    "decode_time_ms": 1850.3,
    "total_time_ms": 1920.1,
    "modules_searched": 100,
    "modules_matched": 3
  },
  "matched_modules": [
    {
      "module_id": "skills/security-review",
      "name": "Security Review",
      "module_type": "skill",
      "score": 0.92,
      "description": "..."
    }
  ]
}
```

---

## 6. 数据来源 (Content Source)

来自 [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) 仓库：

| 类型 | 数量 | 路径 | 格式 |
|------|------|------|------|
| Agents | 13 | `agents/*.md` | YAML frontmatter + Markdown |
| Skills | 43+ | `skills/*/SKILL.md` | YAML frontmatter + Markdown |
| Rules | 12+ | `rules/{common,ts,py,go}/*.md` | 纯 Markdown |
| Commands | 31+ | `commands/*.md` | YAML frontmatter + Markdown |
| Hooks | 1 | `hooks/hooks.json` | JSON |
| Contexts | 3 | `contexts/*.md` | 纯 Markdown |
| **总计** | **~100+** | | |

---

## 7. 关键技术细节 (Critical Considerations)

### 7.1 权重绑定与 Realignment 行为 (Weight Tying & Realignment)

不同模型的 `tie_word_embeddings` 配置直接影响 Realignment Matrix 的计算：

| 模型 | tie_word_embeddings | Realignment 特性 |
|------|--------------------|--------------------|
| Qwen2.5-Coder-1.5B | `true` (W_out ≡ W_in) | M* ≈ I（近单位矩阵），隐空间循环极其稳定 |
| Qwen3-4B / 14B | `false` (W_out ≠ W_in) | M* 需完整 Ridge Regression 求解，隐空间表达力更强但需更多 latent steps |

- **Qwen2.5**：由于权重绑定，M* 接近单位矩阵，编译时 5 步 latent steps 即可收敛
- **Qwen3**：W_out 与 W_in 独立训练，Realignment 投影更复杂，建议编译时 8-10 步 latent steps 以获得更好的隐空间轨迹；同时 Qwen3 支持 `<think>` token，可利用思维链进一步提升编码质量

### 7.2 增量编译 (Delta Updates)

基于 SHA-256 内容哈希的增量编译：
- 仅重新编译内容变化的模块
- 自动清理已删除模块的张量文件
- 重建索引时合并新旧数据

### 7.3 CPU 性能优化

| 策略 | 效果 |
|------|------|
| `low_cpu_mem_usage=True` | 减少峰值内存至 ~6GB |
| Safetensors mmap (`safe_open`) | 按需加载单个张量 |
| LRU 缓存（intent embedding + decoded prompt） | 重复查询零延迟 |
| 懒加载模型 | 服务启动不阻塞 |
| 可选 ONNX INT8 量化 | 推理加速 2-4x |

### 7.4 隐式多 Agent 路由

当意图复杂时，检索系统可同时激活多个隐空间记忆（如同时激活 React 规范 + Security 规范），解码器在生成时融合多个 latent trajectory。

---

## 8. 开发任务清单 (Task Breakdown)

### Phase 1: 项目脚手架
- [x] 目录结构创建
- [x] Git 初始化 + 子模块
- [x] pyproject.toml + package.json

### Phase 2: 模型适配层
- [x] 多模型常量配置（Qwen3-4B/14B + Qwen2.5-1.5B，GPU/CPU 自动检测）
- [x] ModelWrapper 适配（支持 Qwen3 原生 + Qwen2.5 兼容，自动检测 GPU/CPU）
- [x] Realignment Matrix 计算（适配 tie/untie 两种权重模式）

### Phase 3: 编译管线
- [x] Markdown 解析器（YAML frontmatter + body）
- [x] 文件扫描器
- [x] 隐状态编码器
- [x] Safetensors 持久化
- [x] 相似度索引
- [x] 增量编译
- [x] CLI 入口

### Phase 4: 解码网关
- [x] Intent 编码器
- [x] 张量检索器
- [x] 隐状态解码器
- [x] 会话管理

### Phase 5: FastAPI 后端
- [x] Pydantic Schema
- [x] 路由 + 端点
- [x] 中间件

### Phase 6: MCP Server
- [x] 3 个工具定义
- [x] stdio 传输
- [x] FastAPI 客户端

### Phase 7: 优化
- [x] 缓存层（LRU: intent embedding + decoded prompt）
- [ ] 性能基准测试
- [ ] 可选 ONNX 量化
- [ ] 单元/集成测试
