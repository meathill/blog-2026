# 博文草稿：Serverless DB 2026

> 排期：**2026-07-21 周 · 文 A**（见 `docs/blog-topics-2026-q3.md`）  
> 直播挂钩：三种存储延迟手测（同 Worker / 同区域 / 简单 CRUD）。  
>
> 元数据建议（发布时用）:
> - **标题**: Serverless DB 2026：Hyperdrive + Supabase vs D1 vs Turso，怎么选才不后悔
> - **slug**: `serverless-db-2026-hyperdrive-d1-turso`
> - **分类**: cloudflare-worker（或 tech / database，按后台实际分类）
> - **标签**: Serverless, D1, Hyperdrive, Supabase, Turso, PlanetScale, Cloudflare Workers, SQLite, Postgres
> - **摘要**: 2026 年在 Cloudflare Workers 上选数据库，已经不是「有没有方案」的问题，而是 Hyperdrive 连 Postgres、原生 D1、还是 Turso/libSQL 三条路的取舍。文中并梳理 Cloudflare 自家博客翻新选用 Hyperdrive+PlanetScale、而非 D1 的公开信息与 CTO 口径——缺技术复盘，但旁证足以写进决策树。结合 blog、MuiRouter、free-ai-api 与 Hyperdrive 实战给出可执行取舍。
> - 配图位置用 `[图:...]` 标出，发布前替换。
> - 文末加：延伸阅读（Hyperdrive 深文 / R2 / TiDB 账单）+ 直播回放占位。

---

2026 年再聊「Cloudflare Workers 上用什么数据库」，空气已经变了。

两年前的主问题是：**能不能连**？Postgres 要不要弃、SQLite 够不够用、有没有连接池。  
现在的主问题是：**连得上之后，账单、一致性、跨平台和运维，哪条坑会先咬你**。

我手里同时跑着几条线：

| 项目 | 存储选型 | 角色 |
|------|----------|------|
| [ai3dmodel / 朋友站迁移](https://ai3dmodel.app/) | **Hyperdrive → Supabase Postgres** | 已有 Postgres 资产，Workers 上要低延迟读 |
| [blog.meathill.com 后台](https://meathill.com) | **D1**（编辑器 + 同步备份）+ WordPress/TiDB 当公开 CMS | 双轨：新编辑器走 D1，前台仍读 WP |
| [MuiRouter](https://muirouter.com) | **D1 + KV + Durable Object** | 网关账本与审计，热路径不靠单一 SQL |
| [freeaiapi.org](https://freeaiapi.org) | **Payload CMS + D1 + R2** | 目录站 CMS 独占 D1，前台经 service binding 取数 |

Turso 我没有放进生产主路径，但它是「多运行时 / 边缘副本 / 不想绑死 CF」时最常被拿来对照的选项，所以一并写进决策矩阵。

> 如果你只想看 Hyperdrive 的配置细节和踩坑清单，去读已经加深过的这篇：  
> [Workers + Supabase + Hyperdrive 最佳实践](/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker)。  
> 本文不重复「怎么配」，只回答 **2026 该怎么选**。

## 先把三条路说清楚

### 1. Hyperdrive + Postgres（以 Supabase 为代表）

**本质**：数据库仍是传统 Postgres（或 MySQL）；Cloudflare 在靠近库的一侧维护连接池 + 可选读缓存，Worker 连的是 Hyperdrive 接入点，而不是每次冷握手直连云库。

适合：

- 库已经在那里了（Supabase / Neon / RDS / 自建）
- 需要 Postgres 生态：RLS、扩展、复杂查询、BI、现有 ORM 与迁移工具
- 单库体量会涨到 **GB～TB 级**，或读写模式更接近「中心库 + 全球接入」

不适合：

- 从零开始、数据模型极简，却硬上整套 Postgres 运维面
- 只想用 Workers 绑定、零外部账单、零连接串心智

Workers 直连 Postgres 的痛，本质是 **无常驻进程 = 无常驻连接**。每个冷请求付 TCP + TLS + 认证；再叠加连接数上限，免费档尤其容易被打爆。Hyperdrive 解决的是「连接与可缓存读」，**不是**把 Postgres 变成边缘数据库。

![Hyperdrive 拓扑：Worker → CF 内网 → Hyperdrive 池 → Supabase 直连 5432](https://i.meathill.com/8cd81ae8-d8cf-4913-b668-6c16906f8b17-blog-serverless-db-01-hyperdrive-topology.png)

### 2. Cloudflare D1（SQLite serverless）

**本质**：Cloudflare 原生 SQL，绑定即用，和 Workers / Pages / OpenNext 同一账号体系。底层是 SQLite 语义，不是 Postgres。

适合：

- 应用本身就在 Workers 上，数据与计算同平台
- 读多写少、中等体量（Workers Paid 单库约 **10GB** 量级，账号可开大量库）
- 想用 Drizzle / 官方 D1 API，迁移与本地 `wrangler d1` 一条龙
- 需要 **Read Replication / Sessions API** 做读扩展（MuiRouter 已上线相关实践）

不适合：

- 强依赖 Postgres 特性（复杂扩展、某些并发写模型、重量级分析）
- 单库要冲到几十 GB 以上且不愿拆库
- 团队工具链全是「只能连 Postgres 的 BI / 同步管道」且改造成本过高

我在生产里对 D1 的体感是：**作为「Worker 应用的主库」非常舒服；作为「全世界唯一的中心分析库」别指望**。账本、并发、强一致写路径，往往还要叠 Durable Object 或外层设计（见下文 MuiRouter）。

### 3. Turso（libSQL / 边缘 SQLite）

**本质**：以 SQLite / libSQL 为中心，强调多副本、边缘就近读、以及 **不绑定单一运行时**（Node、Bun、部分边缘平台都能连）。和 D1 同属「SQLite 家族」，但产品和计费、复制模型、生态重心不同。

适合：

- 希望 **边缘读延迟** 优先，且部署面不止 Cloudflare
- 多租户「一租户一库」类形态（两边都能做，选型看配额与运维习惯）
- 想保留「文件型 SQL」心智，又要托管与复制

不适合：

- 已经 all-in Cloudflare 绑定、不想多引入一套凭证与账单
- 需要完整 Postgres 语义
- 写冲突极高、需要中心化强事务且不愿为副本一致性建模

> 诚实声明：下面对比里 Turso 一侧以官方能力与公开对比为准；延迟数字若直播实测会更新，文内不假装我有和生产同级的 Turso 长跑数据。

## 一张表对齐维度

| 维度 | Hyperdrive + Postgres | D1 | Turso |
|------|----------------------|-----|-------|
| 数据模型 | Postgres / MySQL 全能力 | SQLite | SQLite / libSQL |
| 与 Workers 集成 | 绑定 Hyperdrive，连接串分本地/线上 | 原生 binding | HTTP / libSQL 客户端，非 CF 原生绑定 |
| 连接痛点 | 由 Hyperdrive 池化；**必须给 Hyperdrive 配直连，不要 pooler 套 pooler** | 无传统连接池概念 | 客户端与副本拓扑自己管 |
| 全球读 | 靠 Hyperdrive 缓存 + 源库位置 | 读复制 / Sessions | 边缘副本是卖点 |
| 单库体量 | 可到很大（Postgres 本职） | Paid 约 10GB/库 | 按套餐存储，通常可大于 D1 单库心智 |
| 多库 / 多租户 | 传统 schema 或多实例 | 账号可开大量 DB | 多 DB 友好 |
| 本地开发 | `localConnectionString` / 环境变量；常与线上连接串 **故意不同** | `wrangler d1` 本地状态 | 本地 libSQL / 远程 |
| 典型账单结构 | 云库自身 + Hyperdrive + 流量 | 含在 CF 用量里（有免费档与 Paid 上限） | 独立供应商账单 |
| 我用在哪 | 存量 Postgres 业务迁移 | blog 后台、MuiRouter、free-ai-api CMS | 对照选项，未作主路径 |
| 公开旁证 | **Cloudflare 自家 blog 现栈** | CF 文档定位的轻量默认 | 社区边缘 SQLite 替代 |

![Hyperdrive + Postgres vs D1 vs Turso 三列决策对照表](https://i.meathill.com/e8f35d67-2f77-4182-a578-6fe680bb30ac-blog-serverless-db-02-three-way-decision.png)

## 旁证：Cloudflare 重构自家博客时，选了 PlanetScale 而不是 D1

2026 年 7 月中旬，Cloudflare 博客「里外翻新」上线。VP of Developers Rita Kozlov 公开技术栈时写得很直白：

> built on **emdash**, ai search, the newly released workers cache, **astro** and **hyperdrive + planetscale**

也就是说：前台/CMS 侧是 EmDash（CF 自己开源的 Astro 系 serverless CMS）+ Workers Cache；**数据层是 Hyperdrive 连 PlanetScale，不是 D1**。

社区立刻炸了——「卖 D1 的人，自己的门面站却上了 PlanetScale，这算不算反 D1 的最佳广告？」MVP James Ross 等也在等一篇技术复盘。

### 官方到底解释了什么（以及没解释什么）

**截至本稿（2026-07），我没看到一篇完整的「为什么 blog 不用 D1」技术长文。** 公开信息主要是碎片：

| 来源 | 说了什么 | 没说什么 |
|------|----------|----------|
| Rita 宣布栈 | blog = Hyperdrive + PlanetScale | 选型权衡、容量、查询形态 |
| CF CTO Dane Knecht 回复质疑 | 「我们在 dogfood **Hyperdrive**。负载更重的 **WWW 用 D1**。」 | 为何 blog 与 www 分叉、D1 在 blog 场景缺哪一块 |
| 2025-09 合作文 / 产品文档 | D1 与 Hyperdrive+PlanetScale **并列**为合法选项 | 自家 blog 的决策记录 |

CTO 那句其实很重要，而且和直觉有点拧：**并不是「流量大就上 PlanetScale」**——他明确写 heavier load 的 WWW 在用 D1。所以更合理的读法是：

1. **他们在 dogfood 的是整条「Workers → Hyperdrive → 外部 Postgres/MySQL」管道**（也是 2025 起和 PlanetScale 深度集成、控制台一键开库、账单逐步并入 CF 的那条产品线），自家 blog 是这条管道的展示橱窗。  
2. **D1 并没有被内部弃用**；至少在 CTO 口径里，更重的 www 仍跑 D1。  
3. **缺的是决策备忘录**：Postgres 工具链？存量 schema？编辑/搜索查询形态？运营侧熟悉度？与 EmDash 默认集成？公开材料都没钉死。

Rita 在更早讨论多供应商时也说过大意是：平台要提供积木，开发者常会为 best-of-breed 做多供应商组合——**「我们有 D1，但你们也看到今天的 PlanetScale 合作」**。这和「D1 失败了」不是同一句话。

### 对照官方自己的选型表

Cloudflare 文档 [Choosing a data or storage product](https://developers.cloudflare.com/workers/platform/storage-options/) 把 SQL 路线拆得很清楚（大意）：

- **Hyperdrive**：已有 Postgres/MySQL、需要 **很大的单库**（文档举例 1TB / 100TB 量级）、或想沿用现有驱动与运维工具 → 可连 PlanetScale / Neon 等。  
- **D1**：轻量 serverless、读多写少、受益于读复制、**不想自己养传统 RDBMS**；单库体量有上限（Paid 约 10GB，过大要拆库）。  
- **Durable Objects**：强一致单键 / 协作 / 分布式状态（D1 自己也建在 DO 上）。

合作长文里对 D1 的定位是「多租户、简单隔离的 SQL」；对 PlanetScale 的定位是「认真做全栈时需要的 Postgres/MySQL 能力 + Hyperdrive 池化与读缓存」。

把这些叠在一起，**blog 选 PlanetScale 并不等于官方宣布 D1 不适合博客**；它更像是：

> 当内容系统更接近「中心关系库 + 全球 Worker 接入」而不是「边缘轻量应用库」时，CF 自己也走 Hyperdrive 那条轨——并且选了他们正在主推的合作伙伴。

### 写进你自己的决策时怎么用这条旁证

- **不要**简化成「连 Cloudflare 都不用 D1 → 我也别用」。CTO 同时说了 WWW 在用 D1。  
- **要**当成压力测试：**门面站 + CMS + 搜索** 这类工作负载，在 CF 内部可以落到 Hyperdrive+PlanetScale；说明这条路径已被当一等公民运营，而不是「将就连一下外部库」。  
- **要**和本文决策树对齐：需要 Postgres 语义 / 更大单库 / 既有关系型工具链 → Hyperdrive（供应商可以是 PlanetScale、Supabase、Neon…）；平台闭环、体量与模型合适 → D1 仍然是最短路径。  
- **保留疑问**：若日后 CF 补技术复盘（容量数字、查询画像、为何不拆多 D1），再回来改这一节；在此之前，**别把营销叙事脑补成唯一真相**。

对我个人项目的含义很实在：MuiRouter / free-ai-api / blog 后台继续 D1 分层，并不「违背官方实践」；朋友站那种存量 Supabase，继续 Hyperdrive，也和 CF 自家 blog 同一条哲学——**接入层用 Hyperdrive，库用你真正需要的那一种**。

## 真实项目里怎么选的

### 场景 A：库已经在 Supabase，应用要迁 Workers

路径几乎唯一合理：**Hyperdrive + 直连 5432**。

本地开发用 Supavisor pooler（6543）是常态——免费档直连常是 IPv6，本机到不了；**线上 Hyperdrive 绝不能再套一层 transaction pooler**。postgres.js 的 prepared statements 在本地 transaction mode 下还会搞出「本地玄学报错、线上正常」。

这些坑我在 Hyperdrive 专文里写全了。这里只补一句决策层的话：

> 选 Hyperdrive，不是因为「Postgres 比 SQLite 高级」，而是因为 **迁移成本与数据资产** 决定了你动不了库，只能动接入层。

### 场景 B：从零做 Workers 上的产品（网关、目录站、CMS）

我反复落在 **D1**：

1. **绑定简单**：`wrangler` 一把梭，没有第二套 VPC / 白名单故事。  
2. **和 OpenNext / Hono / Payload 都有成熟路径**：free-ai-api 甚至把 Payload 独占 D1 拆成独立 CMS Worker，前台只 service binding 读。  
3. **钱和复杂度可控**：对比我在 WordPress + TiDB 上被 RU 账单教育的经历（[TiDB 账单爆炸之后](/posts/… 待填真实路径)），「按请求计费的远程中心库 + 没有对象缓存的 CMS」是反面教材；D1 在 Worker 内的访问模型更贴近「应用库」。

但 D1 不是银弹。MuiRouter 里余额扣费如果只靠 D1/KV 读改写，并发下会丢更新——最终 **权威账本进了 Durable Object**，D1 只承担可查询审计与配置。这是架构分层，不是 D1「不行」。

![MuiRouter 存储分层：KV 镜像、WalletDO 权威、D1 审计](https://i.meathill.com/0693cc37-9a87-4fd5-99b9-d7d1ea78dd0b-blog-serverless-db-03-storage-layers.png)

### 场景 C：为什么还要知道 Turso

当你出现下面任一信号，Turso 会重新进短名单：

- 同一套数据层要服务 **非 CF 运行时**（例如部分 API 在 Fly / 自建 Node）
- 产品叙事是「全球只读副本贴近用户」，且团队更熟 libSQL
- 需要比 D1 更灵活的「库数量 / 存储打包」商业套餐，同时接受多供应商

如果 100% 在 Cloudflare 里闭环，**D1 几乎总是更短路径**——少一套密钥轮换、少一份发票、调试时少一层网络。

## 延迟：别只看榜单，要会测

公开对比里经常能看到「冷查询 / 热查询」表格，数字随区域和测试方法漂移。直播和你自己的 CI 里，建议固定这套最小协议：

1. **同 Worker 内**发 50 次简单 `SELECT 1` / 按主键读一行（区分冷启动后首次与稳态）。  
2. **同区域写路径**：插入一行再读回，看是否符合你对一致性的预期（D1 Sessions bookmark、Turso 副本、Hyperdrive 是否绕过缓存）。  
3. **业务查询**：用真实索引与 `LIMIT`，不要只测玩具 SQL。  
4. 记录 p50 / p95，而不是只报平均值。

![Serverless DB 延迟手测协议与 D1 / Hyperdrive / Turso 三测点](https://i.meathill.com/ed5ac742-38b0-4a1b-b9f4-15ce3cc9b72c-blog-serverless-db-04-latency-protocol.png)

经验方向（不是 SLA）：

- **D1 binding**：同平台，稳态通常很省心；Sessions / 读复制要处理瞬时网络错误（我们在 MuiRouter 上对 `Network connection lost` 做了白名单重试）。  
- **Hyperdrive**：消除握手税之后，下限仍受 **源库地理与 Postgres 本身** 约束；Query Cache 只帮可缓存读。  
- **Turso**：边缘读好时可以非常「像本地文件」；跨副本写后读要清楚你的一致性模型。

## 计费与「隐形税」

选库时账单有三层：

1. **存储与请求单价**（厂商标价）  
2. **连接与协议税**（TLS、池、chatty ORM）  
3. **架构税**（为了正确性你必须加的 DO / 队列 / 缓存）

TiDB 那次教训写在另一篇长文里：远程 serverless 库 + WordPress 无对象缓存，每个请求上百 RU，边缘缓存也救不了长尾唯一 URL。  
Hyperdrive 专文则是：连接配错（pooler 套 pooler、IPv6、prepared statements）会让你在「能连」和「稳连」之间反复横跳。

D1 的隐形税更多是 **能力边界**：10GB、SQLite 语义、写并发模型——用错场景会在业务中期被迫拆库或迁出。

## 决策树（可直接丢给自己或 AI）

```text
已有 Postgres/MySQL 且迁移成本高？
  └─ 是 → Hyperdrive（直连端口；本地另配 pooler 很正常）
  └─ 否 → 是否 100% 跑在 Cloudflare Workers？
        └─ 是 → 数据是否读多写少、单库 < ~10GB、SQLite 够用？
              └─ 是 → D1（热路径强一致再考虑 DO/KV）
              └─ 否 → Postgres（PlanetScale / Neon / Supabase…）+ Hyperdrive，或拆多 D1
        └─ 否（多运行时）→ Turso/libSQL 或托管 Postgres
```

（CF 自家 blog 落在「Postgres + Hyperdrive」这支；这不自动否定另一支的 D1。）

再补三条「一票否决」：

- 需要重 Postgres 扩展 / 复杂分析 → 别拿 D1/Turso 硬扛。  
- 需要多 Worker 共享的 **金融级串行余额** → 别只靠 SQL 行锁幻想，看 DO 或专用账本。  
- 团队只会一种 ORM/SQL 方言 → 选型成本里要计入人，不只是美元。

## 和「数据库」相邻的一层

Serverless 应用很少只靠一个 SQL：

| 需求 | 我更常选 |
|------|----------|
| 对象 / 媒体 | R2（见[上传实战](/posts/infra/upload-file-via-cloudflare-r2)） |
| 会话 / 配置镜像 / 极热读 | KV |
| 强一致单键状态（钱包、房间、限流） | Durable Object |
| 后台任务 | Queue |
| 存量关系库加速 | Hyperdrive |

MuiRouter 是这一层的集中展示：**D1 不是唯一真相**，而是「可查询的持久层」；扣费权威在 `WalletDO`。详情见本周文 B。

## 常见问题（FAQ）

### Hyperdrive 能取代 D1 吗？

不能互相取代。Hyperdrive 是 **访问既有 SQL 库的加速与池化层**；D1 是 **CF 原生数据库产品**。一个帮你连「外面的库」，一个是「平台里的库」。

### 新项目还要不要上 Supabase？

若你明确要 Auth + Storage + Realtime + Postgres 一体，Supabase 仍然强。若只是「Workers 上要个关系库」，D1 往往更短；若只要 Postgres 不要全家桶，Neon 等 + Hyperdrive 也常见。

### D1 的 Sessions API / 读复制该不该开？

读多、可接受短暂副本延迟的审计/列表类负载值得开。注意瞬时 `Network connection lost` 一类错误要有重试白名单；**不要把「过载」字样当唯一诊断**，用 insights 与日志样本说话。

### Turso 和 D1 怎么快速二选一？

只在 Cloudflare、要 binding 与账单合一 → **D1**。  
要多云/多运行时或明确的边缘副本产品叙事 → **认真评估 Turso**。  
需要 Postgres → 两者都不是终点。

### Cloudflare 自家博客不用 D1，是不是说明 D1 不行？

**不能这么推。** 2026-07 博客翻新公开栈是 Hyperdrive + PlanetScale，CTO 同时表示更重的 WWW 在用 D1，且官方文档仍把 D1 与 Hyperdrive 并列。更准确的理解是：他们在 dogfood「Workers 连外部 Postgres」这条产品线，blog 成了橱窗；**缺的是一篇写清权衡的技术复盘，不是 D1 死刑判决**。选型仍看工作负载与 SQL 方言，不看热搜标题。

### 本地和线上连接串为什么可以不一样？

尤其是 Supabase + Hyperdrive：**线上给 Hyperdrive 直连，本地给 pooler** 是架构结果，不是临时补丁。把「两套连接串」写进 README，比强行统一更不容易翻车。

## 延伸阅读

- [Workers + Supabase + Hyperdrive 最佳实践](/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker)
- [2026 最佳实践：在 Cloudflare Workers 上部署 Next.js](/posts/next-js/best-practice-for-nextjs-on-cloudflare-worker-2026)
- [用 Cloudflare R2 上传文件](/posts/infra/upload-file-via-cloudflare-r2)
- TiDB 账单排查长文（第 1 周文 A，发布后互链）
- 产品：[MuiRouter](https://muirouter.com) · [freeaiapi.org](https://freeaiapi.org)
- 方案页：[Cloudflare 全栈架构与迁移](/solutions/cloudflare-fullstack)

## 直播回放

（发布后填：B 站 / YouTube。建议标题：Serverless DB 三选一延迟手测。）

---

> 草稿备注（发布前删）:
> - slug：`serverless-db-2026-hyperdrive-d1-turso`
> - 与 Hyperdrive 旧文避免大段重复；旧文负责「怎么配」，本文负责「怎么选」
> - 直播后可补一节「手测 p50/p95」真实数字
> - TiDB 文正式 URL 发布后替换文中占位链接
> - Turso 若之后上生产，补「我方长跑」后记，避免长期只有对照叙述
