# 博文草稿：MuiRouter 架构复盘

> 排期：**2026-07-21 周 · 文 B**（见 `docs/blog-topics-2026-q3.md`）  
> 直播挂钩：一条请求从鉴权到扣费的路径走读（代码 + dashboard）。  
>
> 元数据建议（发布时用）:
> - **标题**: OpenAI 兼容计费网关：MuiRouter 架构复盘（路由、账本与异步扣费）
> - **slug**: `muirouter-openai-compatible-billing-gateway`
> - **分类**: tech / ai（按后台实际分类）
> - **标签**: MuiRouter, AI Gateway, OpenAI API, Cloudflare Workers, Durable Object, D1, 计费, MCP
> - **摘要**: MuiRouter 是一个跑在 Cloudflare Workers 上的 OpenAI 兼容 AI 网关：一个 `sk-gw-` Key 接入多家模型，统一路由、配额与按 token 计费。本文复盘存储分层（KV / D1 / WalletDO）、请求到扣费路径、流式 tee 异步计费、以及一次「充值未到账」事故如何把「唯一写者」从注释升级成结构。
> - 配图位置用 `[图:...]` 标出。
> - 文末：产品链接 + 文 A 互链 + 直播回放占位。

---

市面上不缺「聚合多个大模型」的代理。缺的是：在 **边缘 Worker 的成本模型** 里，把鉴权、并发、路由、流式响应和 **真金白银的余额** 做成一套不会偷偷少扣钱、也不会把用户余额写丢的系统。

[MuiRouter](https://muirouter.com) 是我做的 OpenAI 兼容网关：调用方只持有本服务的 API Key（`sk-gw-`）或 OAuth token，上游凭证走 Cloudflare AI Gateway Stored Keys 或 Worker secrets；对外统一 `/v1/chat/completions`、`/v1/responses`、图片与异步视频，以及 MCP。

这篇文章不是产品手册，而是 **架构复盘**：钱和正确性相关的决策，为什么长这样。

## 产品表面长什么样

一句话：

> **一个 Key，多家模型；OpenAI 形接口；按 token 分档计费；可充值、可限额、可并发控制。**

仓库是 pnpm monorepo：

| 包 | 角色 | 栈 |
|----|------|-----|
| `packages/app` | API 网关 | Workers · Hono · D1 · KV · DO · Resend |
| `packages/dashboard` | 控制台 + 营销站 | Next.js · better-auth · OpenNext |
| `packages/shared-db` | 共享 schema / migration | Drizzle · D1 |

线上站点： [muirouter.com](https://muirouter.com)。  
第三方接入规范（PAT / OAuth）：仓库内 `muirouter-spec.md`。

## 一次请求的完整路径

以 `POST /v1/chat/completions` 为例（简化，省略错误分支）：

```text
Client
  │  Authorization: Bearer sk-gw-...
  ▼
authMiddleware          → 校验 Key / OAuth，解析 userId
  ▼
ConcurrencyLimiterDO    → 申请 lease（超限 429）
  ▼
model 解析 + 路由分发   → Gateway / 直连 / env.AI / 原生透传
  ▼
上游响应
  ├─ 非流式：JSON 里抽 usage
  └─ 流式：body.tee() 一份给客户端，一份给计费
  ▼
executionCtx.waitUntil(
    calculateCost → WalletDO 扣费 → D1 usage_logs → 告警
)
  ▼
释放并发 lease
```

![MuiRouter 请求路径：鉴权、并发、路由、tee、waitUntil 扣费](https://i.meathill.com/1b686ebc-b433-4e5e-9da2-82fa81dff8f8-blog-muirouter-01-request-path.png)

几个刻意的选择：

1. **计费不挡响应**：`waitUntil` 异步跑，用户先拿到 token 流。代价是计费崩溃不会回滚已生成内容，必须靠日志与告警兜。  
2. **流式必须 tee**：只读客户端那一支，usage 可能永远抽不到；只缓冲全量再转发，延迟与内存都不可接受。  
3. **并发 lease 在 DO**：同一用户默认有限并发，防止一把钥匙打爆上游与钱包。

## 存储为什么要三层

早期版本里，用户余额主要活在 KV 的 `user:{userId}` 上。读快，写却是经典的 **读-改-写**。  
并发一开（限流器允许每用户多个 in-flight），两个请求同时读到余额 10、各扣 3，后写覆盖先写——余额变成 7 而不是 4。因为有 `Math.max(0, …)`，表现是 **少扣钱**，不是报错。这是持续漏收，不是理论边界。

现在的分层：

| 存储 | 用途 | 原因 |
|------|------|------|
| **KV** | API Key 索引、用户展示镜像、全局配置与花费统计 | 热路径读，目标亚 60ms 心智 |
| **Durable Object** | `ConcurrencyLimiterDO` 租约；`WalletDO` 余额/免费额度/暂停/预占 | 同用户串行，权威状态 |
| **D1** | 用户账户、usage 日志、模型定价、限额、better-auth、视频任务审计 | 要 SQL、要聚合、要可查 |

![KV 镜像 vs WalletDO 权威账本 vs D1 审计，含充值未到账事故](https://i.meathill.com/c07d8eb7-48e0-466a-a2fa-4c7b0338c485-blog-muirouter-02-wallet-authority.png)

### WalletDO：权威账本

- 按 `idFromName(userId)` 分区，**唯一写者** 负责 `user:{userId}` 这条逻辑账本。  
- KV 变成只读展示镜像，由 WalletDO 写回。  
- 自愈迁移：实例首次请求若本地 storage 空，从现有 KV 镜像 adopt，零停机、不扫全表。

**坑：`blockConcurrencyWhile` 包哪一段。**  
只包「首次 adopt」不够。DO 的 input/output gate 只保证 storage 操作之间的互斥；若在两次 storage 之间 `await` 了外部 I/O（例如写 KV），别的请求能插进来读到旧值。正确做法是把 **读 storage → 应用变更 → 写 storage** 整段放进 `blockConcurrencyWhile`（段内无外部 I/O），KV 镜像同步放锁外。

**教训**：涉及 DO 并发正确性，必须用 **真实 DO 运行时** 的并发测试（我们用 `cloudflare:test` 对同一实例打并发 `/deduct`）。纯 mock 单测测不出 gate 语义。

### 2026-07-21：充值「未到账」

用户 Stripe 充了 $20，WalletDO 权威账本已对，界面余额不动。

根因：`ConcurrencyLimiterDO` 为了更新并发数字段，对 `user:{userId}` 做了 **整条 KV 读-改-写**。lease 过期 alarm 恰在充值后触发，用旧镜像把 balance **盖回充值前**。之后用户无钱包变动，脏镜像无人纠正。

修复：

1. 并发数字段也走 WalletDO `/set-concurrency`，限流器 **不再直接碰** 该 KV 键——「唯一写者」从注释变成结构。  
2. 镜像写 single-flight，避免乱序 put。  
3. 运维端点 `/sync-mirror` + 管理接口，可强制把权威账本刷回展示镜像。

> 任何「我只改一个字段」的 KV 读改写，都是整条记录的覆盖写。声明唯一写者，要用入口收敛，不要靠约定。

## 计费：矩阵，而不是两个单价

早期模型表只有 `inputPrice` / `outputPrice`。接入 Anthropic cache 与长上下文分档后，变成：

| token 类别 | 标准档 | 长上下文档 |
|------------|--------|------------|
| 普通输入 | inputPrice | longContextInputPrice |
| cache 命中 | cachedInputPrice | longContextCachedInputPrice |
| cache 写入 | cacheWritePrice | longContextCacheWritePrice |
| 输出 | outputPrice | longContextOutputPrice |

- 单价按 **每 1M token 美元** 存。  
- 档位：`contextSize` 超阈值走 long_context。  
- 回退：长上下文价缺省回标准价；cache 价缺省回 input。  
- `rawCost → × markupRate × userRateMultiplier → cost`；免费额度抵扣后 `chargedCost` 才动钱包。  
- D1 `usage_logs` 记全量 cost 与四类 token，便于区分真实成本与运营补贴。

图片 / Grok ticks / 视频预占是另一套换算，原则不变：**上游怎么计量，网关就沉淀成可审计的内部单位，再进同一条钱包管道**。

视频生成额外用 **预占（reservation）**：提交时按上限锁余额，完成时按实际 ticks 结算，失败释放；幂等靠 reservation id + `usage_logs.id` + 任务 `billed_at` 三道。

![MuiRouter 标准档与长上下文档定价矩阵及扣费公式](https://i.meathill.com/d5b47668-1f67-435a-8ab1-4c0d4ea3a6de-blog-muirouter-03-pricing-matrix.png)

## 路由：不要一刀切走 AI Gateway

不是所有 provider 都适合同一条代理路径：

| 类型 | 做法 | 备注 |
|------|------|------|
| OpenAI / Google AI Studio / xAI Grok | CF AI Gateway + Stored Keys | 本服务可不持有真实上游 key |
| Anthropic | Gateway；unified 代付 / byok 自付开关 | 仅 Claude 允许进 Unified Billing 白名单，防误烧 credits |
| Moonshot / Xiaomi MiMo | Worker secrets 直连 | 不进 Gateway 日志 |
| Workers AI `@cf/*` | `env.AI.run` | 按 neuron 计费 |
| OpenAI Responses API | 原始透传 `/v1/responses` | 服务 Codex CLI 等；usage 字段与 Chat Completions 不同，抽取器要兼容两套 envelope |

**Unified Billing 用 allow-list 而不是 deny-list**：默认未知 provider 自付。否则新接一个模型忘了排除，就会静默烧 CF 代付额度。

另外踩过的隐藏状态：CF 控制台里给某个 provider 配了 Stored Key，会和代码里的 `ANTHROPIC_CREDENTIAL_MODE` 叙事脱节——**后台点击配置是版本库外的第二真相**，对账时两边都要看。

## 鉴权：PAT 与 OAuth 等价入口

- **PAT**：`sk-gw-…`，dashboard 生成，库内只存 hash。  
- **OAuth 2.0**：给 muicv 等第三方用，用户授权后拿 `mr_at_` access token；在受保护端点与 PAT **等价**，按 Bearer 前缀分流验证。  
- Anthropic 官方 SDK 爱用 `x-api-key`：入站鉴权两种头都收，否则原生 SDK 直连全 401。

对外还有 `GET /v1/balance`、`/v1/usage`、MCP tools（余额、用量、模型列表、出图等），方便把网关嵌进别的产品，而不是只做「人肉 curl 代理」。

## D1 在这套系统里的位置

D1 很适合：

- 模型目录与定价  
- usage / recharge 流水  
- OAuth 与 better-auth 表  
- 视频 job 归属与结算审计  

D1 **不**适合单独承担钱包权威——上面已经论证过。

读路径上我们用了 D1 Sessions（`withSession('first-unconstrained')`），**不做跨请求 bookmark**：余额真相在 DO，D1 上多是审计与统计，亚秒级副本延迟可接受。  
Sessions 会带来偶发 `Network connection lost`，用白名单重试包装 `prepare/bind/run/…`；**不要**把所有 SQL 错误都重试（约束失败重试只会更糟）。

## 和「数据库选型」文的关系

本周文 A 写 Hyperdrive / D1 / Turso 怎么选。MuiRouter 是 D1 路线的一个极端样本：

- 平台闭环 → D1 + KV + DO  
- 热路径正确性 → DO  
- 可查询历史 → D1  
- 不是「选了 D1 就万事大吉」，而是 **SQL 只放它擅长的那一层**

若有人把「AI 网关」理解成一个 `fetch` 转发加一张余额表，上线第一周并发就会教做人。

## 架构决策清单（可剪进 ADR）

1. 响应与计费解耦（`waitUntil` + 流式 `tee`）。  
2. 钱包唯一写者（WalletDO）；KV 仅镜像。  
3. 并发 lease 与钱包职责分离（两个 DO）。  
4. 定价矩阵化（cache / 长上下文 / markup）。  
5. Provider 路由分策略；Unified Billing 白名单。  
6. 视频等异步任务：预占 → 终态结算 → 多键幂等。  
7. 第三方：PAT + OAuth + MCP，余额 API 用字符串金额防精度坑。

## 常见问题（FAQ）

### 为什么不用「先扣费再生成」？

可以，且更保守。我们选择先响应，是为了降低流式首字延迟、避免上游已产出却因扣费抖动失败。代价是必须接受「偶发计费失败需对账」的运营现实，并用告警补齐。

### 余额能不能只放 D1 事务里？

在 SQLite/D1 语义与多请求并发模型下，**可以做出可用方案**，但和「每用户一个 DO 串行」比，边界情况更多，跨 Worker（app vs dashboard）共享也更别扭。我们用 DO 换的是更简单的正确性模型。

### 和 Cloudflare AI Gateway 什么关系？

AI Gateway 负责上游凭证、部分可观测与统一入口；**用户侧计费、配额、模型目录、OAuth 是 MuiRouter 的职责**。可以把 MuiRouter 理解成「带钱包与产品层的 OpenAI 兼容门面」，Gateway 是其中若干 provider 的出站通道。

### 免费额度怎么防刷？

全局策略在 KV `config:global.freeQuota`，用户侧记已用；按模型白名单控制，优先便宜或要推广的模型。Native 透传等无法可靠识别模型的路径不走免费额度，避免绕过白名单。

### 开源吗？怎么试用？

以线上产品为准： [muirouter.com](https://muirouter.com)。本文描述的是 2026-07 生产架构快照，实现细节以仓库与线上行为为准。

## 延伸阅读

- 产品站：[muirouter.com](https://muirouter.com)
- [Serverless DB 2026：Hyperdrive vs D1 vs Turso](/posts/… 待填文 A slug)
- [Workers + Supabase + Hyperdrive 最佳实践](/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker)
- [2026：在 Cloudflare Workers 上部署 Next.js](/posts/next-js/best-practice-for-nextjs-on-cloudflare-worker-2026)
- 方案页：[Cloudflare 全栈](/solutions/cloudflare-fullstack) · 产品页若有 MuiRouter 条目可互链

## 直播回放

（发布后填。建议标题：MuiRouter 请求到扣费路径走读。）

---

> 草稿备注（发布前删）:
> - slug：`muirouter-openai-compatible-billing-gateway`
> - 敏感：不要贴真实 key、用户邮箱、具体 Stripe 支付意图；$20 事故可保留量级
> - 直播可演示 playground + 余额变化，勿在录屏暴露 admin secret
> - 文 A 发布后替换互链 URL
> - 若需英文版，可另开 en 草稿；本篇默认中文主站
