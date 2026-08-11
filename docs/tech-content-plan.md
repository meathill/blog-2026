# /tech 技术选型内容中心 —— 首批选题施工图

> 状态：`planned`（施工图，不是已发布内容）
> 关联：GitHub issue #6（内容策略讨论，2026-08-01 评论确认 hyperdrive / vibe coding skills 优先级）
> 频道结构参考：`src/lib/tech-sections.ts`（`compare` / `platforms` / `stacks` / `guides` 四个子栏目 slug 白名单）
> 更新：2026-08-11

本文档是 meathill.com `/tech` 频道未来数月的逐篇写作施工图。目标读者：独立开发者、小团队技术负责人、想入门但还没有判断力的技术小白。核心原则：**每篇都要有真实经验、成本数字或踩坑记录，不做参数罗列和同义词批量造页**。

---

## 1. 背景与关键词证据

### 1.1 数据来源

- Bing Webmaster Tools，2026-05 ~ 07 实测数据（见下表）
- Google Trends，近 12 个月，关键词相对热度
- Google Search Console，全站 28 天窗口（截至 2026-08 上旬）：55 clicks / 6,630 impressions / 平均位置 27
- GitHub issue #6 及其 2026-08-01 评论：明确「hyperdrive」「vibe coding skill(s)」是当前唯一两组已验证有真实排名和点击的词，应优先承接和扩展，而不是从零开跑新词

### 1.2 Bing 实测关键词表

| 关键词 | 展现 | 点击 | CTR | 平均位置 |
|---|---:|---:|---:|---:|
| hyperdrive | 103 | 5 | 4.85% | 5.09 |
| vibe coding skill | 48 | 5 | 10.42% | 6.65 |
| linux科学上网 | 40 | 3 | 7.50% | 7.47 |
| vibe coding skills | 22 | 3 | 13.64% | 7.59 |
| coding skills | 20 | 2 | 10.00% | 6.95 |

`linux科学上网` 有点击但与 /tech 定位（技术选型）无关，且项目 CLAUDE.md／历史发文计划已明确"科学上网类"不写，本次不纳入选题。

### 1.3 Google Trends（12 个月，相对热度）

| 词 | 相对热度 | 结论 |
|---|---:|---|
| vibe coding | ~71 | 明显最热，且仍在上升 |
| ai coding assistant | ~20 | 中等，偏泛概念，竞争对手多为大厂/媒体站 |
| coding skills | ~13 | 较冷，但与 Bing 实测的 `coding skills` / `vibe coding skill(s)` 互相印证 |

相关上升词：`Claude Code skills`、`Claude Code`、`Claude skills`、`agent skills`。这组词直接指向站长已公开维护的 `/skills` 页面（code-maintenance、livestream-to-podcast、pr-review 等真实 skill），有真实产品可以对应，不是凭空立题。

### 1.4 优先级逻辑

1. **P0 —— 已验证词，直接承接或强化**：`hyperdrive`（平均位置 5.09，已有一定排名，缺一篇专门讲清"是什么/怎么定价/怎么踩坑"的权威页）、`vibe coding skill(s)` / `coding skills` / `agent skills`（CTR 最高的一组词，且是 Trends 上升趋势，站长有 `/skills` 真实产品可佐证）。
2. **P1 —— 高热但需要用真实经验背书的泛概念词**：`vibe coding`（热度最高，但泛概念页极易做成"内容农场"式软文，必须靠站长真实项目经验、真实成本数字压住质量）、平台/技术栈选型类比较词（Vercel vs Cloudflare、Supabase vs TiDB 等）——这些词搜索量未必已被验证，但站长有真实迁移/踩坑经历，内容可信度高，属于"用真实经验换排名"的中期投入。
3. **P2 —— 长尾入门词，走量但优先级靠后**：Serverless/Edge/VPS 概念科普、小白技术栈推荐等，面向"技术小白"分层，转化路径长，先占位后打磨。

对应到执行顺序：**P0 两组词各出一篇权威页优先写**（对应大纲 ⑨ Hyperdrive 详解、⑤ Claude Code Skills vs Agent Skills vs 传统 coding skills），随后补 P0 的入门/复用类文章（① Vibe Coding 入门、② Skills 实战），再铺 P1/P2。具体建议见第 6 节。

---

## 2. Query-to-page 映射总表

说明：
- 「目标页面」列，已有文章用真实 URL；待写文章用规划 slug，格式 `/posts/tech/{slug}`（WP 分类沿用现有 `tech` 大类，通过 tag 聚合进 `/tech/{section}`，不改变现有 URL 规则 `/posts/{category}/{slug}`）。
- 「状态」：已有 / 待更新（已有文章需要改 tag 或加内容承接新词）/ 待写。
- 优先级 P0 > P1 > P2，与第 1.4 节逻辑一致。

| Query 簇 | 搜索意图 | 目标页面 | /tech 分类 | 约定 tag | 状态 | 优先级 |
|---|---|---|---|---|---|---|
| hyperdrive、cloudflare hyperdrive 定价/限制 | 了解型 + 决策型：这是什么、多少钱、能不能用 | `/posts/tech/cloudflare-hyperdrive-explained-pricing-limits-pitfalls`（大纲⑨） | platforms | tech-platforms, hyperdrive, cloudflare-workers | 待写 | P0 |
| hyperdrive（已有承接页强化） | 实操型：已在用 Next.js + Supabase + Hyperdrive，找最佳实践 | `/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker` | platforms | 补打 tech-platforms, hyperdrive | 待更新 | P0 |
| vibe coding skill、vibe coding skills、coding skills | 了解+行动型：想知道 skill 是什么、怎么用/怎么写 | `/posts/tech/claude-code-skills-how-to-write-organize-reuse`（大纲②） | guides | tech-guides, claude-code, agent-skills | 待写 | P0 |
| agent skills、claude code skills（对比类） | 决策型：几种"技能"概念傻傻分不清，想要选型判断 | `/posts/tech/claude-code-skills-vs-agent-skills-vs-traditional-coding-skills`（大纲⑤） | compare | tech-compare, claude-code, agent-skills, vibe-coding | 待写 | P0 |
| vibe coding、vibe coding 工具选型、ai coding assistant | 入门型：完全不了解 vibe coding，想要一篇总览 | `/posts/tech/vibe-coding-getting-started-tool-selection-2026`（大纲①） | guides | tech-guides, vibe-coding | 待写 | P0 |
| vibe coding（已有相关文承接） | 实操型：已经在写代码，遇到可维护性问题 | `/posts/ai/vibe-coding-code-maintenance-skill` | guides | 补打 tech-guides, vibe-coding, agent-skills | 待更新 | P1 |
| vibe coding（skill 案例延伸） | 实操型：想看真实 KMS/轻量基础设施 skill 案例 | `/posts/cloudflare-worker/vibe-coding-lightweight-kms-on-cloudflare` | guides | 补打 tech-guides, vibe-coding, cloudflare-workers | 待更新 | P2 |
| vercel vs cloudflare、next.js 部署选型 | 决策型：项目该部署在哪 | `/posts/tech/vercel-vs-cloudflare-which-fits-your-project`（大纲⑥） | compare | tech-compare, cloudflare-workers | 待写 | P1 |
| next.js cloudflare 最佳实践（已有承接页） | 实操型：已决定用 Cloudflare，找具体做法 | `/posts/next-js/best-practice-for-nextjs-on-cloudflare-worker-2026` | compare/platforms | 补打 tech-platforms, cloudflare-workers | 待更新 | P1 |
| vercel 迁移 cloudflare（已有承接页） | 实操型：正在做迁移，找迁移指南 | `/posts/next-js/migrate-next-js-from-vercel-to-cloudflare` | compare | 补打 tech-compare, cloudflare-workers | 待更新 | P1 |
| nuxt vercel 迁移 cloudflare（已有承接页） | 实操型：Nuxt 技术栈的迁移场景 | `/posts/tech/moved-my-nuxt3-sites-from-vercel-to-cloudflarenuxt` | compare | 补打 tech-compare, cloudflare-workers | 待更新 | P2 |
| vps vs serverless、vps vs cloudflare workers | 决策型：不想什么都上 Serverless，想知道 VPS 什么时候更划算 | `/posts/tech/vps-vs-cloudflare-workers-not-everything-should-be-serverless`（大纲⑦） | compare | tech-compare, cloudflare-workers | 待写 | P1 |
| supabase vs tidb、postgres vs mysql 云数据库选型 | 决策型：两个数据库产品定位完全不同，怎么选 | `/posts/tech/supabase-vs-tidb-not-the-same-category`（大纲⑧） | compare | tech-compare, hyperdrive | 待写 | P1 |
| tidb 踩坑、tidb 账单（已有承接页） | 案例型：TiDB 真实踩坑经历 | `/posts/tech/a-record-of-moving-db-to-tidb-cloud-and-move-back` | compare | 补打 tech-compare | 待更新 | P2 |
| tidb ru 账单爆炸（已有承接页） | 案例型：serverless 数据库计费机制踩坑 | `/posts/tidb/tidb-ru-bill-explosion-investigation` | compare | 补打 tech-compare | 待更新 | P2 |
| tidb sql 优化（已有承接页） | 实操型：性能优化案例 | `/posts/tidb/from-40s-to-11ms-tidb-cloud-sql-optimization` | platforms | 补打 tech-platforms | 待更新 | P2 |
| cloudflare workers 适合什么项目 | 决策型：技术选型前置判断 | `/posts/tech/cloudflare-workers-what-its-good-for-what-its-not`（大纲⑩） | platforms | tech-platforms, cloudflare-workers | 待写 | P1 |
| cloudflare 图片处理/邮件/payload 踩坑（已有承接页） | 实操型：具体子系统踩坑，反向导流到 platforms 详解 | `/posts/cloudflare/nextjs-images-why-so-expensive-cloudflare-image-resizing-pitfalls-best-practices`、`/posts/cloudflare/cloudflare-email-worker-three-pitfalls`、`/posts/cloudflare/payload-cms-on-cloudflare-five-pitfalls` | platforms | 补打 tech-platforms, cloudflare-workers | 待更新 | P2 |
| 云服务成本估算、serverless 账单怎么算 | 了解型：小白/独立开发者不知道怎么估算云成本 | `/posts/tech/how-to-estimate-real-cloud-costs-for-web-products`（大纲③） | guides | tech-guides | 待写 | P1 |
| serverless edge vps 容器 区别 | 了解型：完全小白，分不清基础概念 | `/posts/tech/serverless-edge-vps-containers-explained`（大纲④） | guides | tech-guides | 待写 | P2 |
| 内容站 技术栈推荐、博客技术栈 | 决策型：小白启动内容站选型 | `/posts/tech/recommended-stack-for-starting-a-content-site`（大纲⑪） | stacks | tech-stacks | 待写 | P2 |
| 独立开发 saas 技术栈、ai 应用低成本技术栈 | 决策型：独立开发者/小团队启动新项目选型 | `/posts/tech/low-cost-stack-for-indie-saas-and-ai-apps`（大纲⑫） | stacks | tech-stacks, cloudflare-workers | 待写 | P1 |

---

## 3. 首批 12 篇完整大纲

大纲结构统一遵循 issue #6 的 9 段模板（compare / platforms 类严格遵循，guides / stacks 类按内容合理裁剪，裁剪原则见各篇说明）：

1. 30 秒结论
2. 适合谁 / 不适合谁
3. 核心能力比较
4. 成本与隐藏成本
5. 开发体验与运维
6. 限制与迁移成本
7. 真实项目经验
8. 按项目类型的最终建议
9. 资料来源与更新时间

「常见问题」作为 H2 会被站点自动提取生成 FAQPage 结构化数据，因此所有 FAQ 段落标题必须写成「常见问题」，不要用「FAQ」「Q&A」等变体。

---

### ① Vibe Coding 入门与工具选型（2026 版）

- **zh 工作标题**：Vibe Coding 入门与工具选型（2026 版）
- **en 工作标题**：Vibe Coding for Beginners: Tool Selection Guide (2026)
- **规划 slug**：`vibe-coding-getting-started-tool-selection-2026`
- **WP 分类建议**：tech
- **tags**：tech-guides, vibe-coding
- **目标 query 与意图**：`vibe coding`（Trends 最热词，泛入门意图）、`ai coding assistant`。搜索者多是听说了 vibe coding 这个说法但不清楚具体指什么、该用什么工具、和"用 AI 自动补全代码"有什么区别，属于纯入门了解型查询，转化路径是先建立认知再导流到更具体的 skills/工具对比文。
- **大纲**（裁剪：入门型文章，用"是什么 → 怎么选 → 怎么上手"替代严格 9 段结构）：
  - H2 30 秒结论：vibe coding 是什么、和传统 AI 辅助编程的本质区别（一句话讲清楚：从"人写代码 AI 补全"到"人描述意图 AI 主导实现，人做判断和把关"）
  - H2 vibe coding 适合谁 / 不适合谁
    - H3 适合：原型验证、内部工具、独立开发者的第二上下文（如站长自己维护十几个副项目的场景）
    - H3 不适合：对代码可解释性/合规审计要求极高的核心系统，或团队缺乏 code review 习惯的场景
  - H2 主流工具选型对照（不做参数堆砌，按使用场景分组）
    - H3 CLI 类（Claude Code 等）：适合本地/服务器全流程自动化，可写 skill 复用
    - H3 IDE 插件类：适合渐进式引入、团队协作场景
    - H3 一体化 vibe coding 平台：适合完全非技术背景的原型验证
  - H2 从"能跑"到"能维护"：vibe coding 最大的坑
    - 引用站长真实经验：`/posts/ai/vibe-coding-code-maintenance-skill`（code-maintenance skill 诞生的背景）
  - H2 真实项目经验：站长如何用 Claude Code 管理 meathill.com 及十余个副项目
  - H2 常见问题（3-5 条）
    - vibe coding 会不会让代码质量变差？
    - 完全不会编程可以用 vibe coding 吗？
    - vibe coding 和"AI 生成代码"是一回事吗？
    - 用 vibe coding 做的项目能长期维护吗？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，4 条
- **内链计划**：
  - 指向 `/posts/ai/vibe-coding-code-maintenance-skill`（可维护性延伸阅读）
  - 指向大纲②《Claude Code Skills 实战》（工具深入）
  - 指向大纲⑤《Skills 对比》（概念澄清）
  - 指向 `/skills` 页面（真实 skill 案例）
  - 指向 `/tech/guides` 分类页

---

### ② Claude Code Skills 实战：怎么写、怎么组织、怎么复用

- **zh 工作标题**：Claude Code Skills 实战：怎么写、怎么组织、怎么复用
- **en 工作标题**：Claude Code Skills in Practice: Writing, Organizing, and Reusing
- **规划 slug**：`claude-code-skills-how-to-write-organize-reuse`
- **WP 分类建议**：tech
- **tags**：tech-guides, claude-code, agent-skills
- **目标 query 与意图**：`vibe coding skill`（CTR 10.42%，已验证）、`vibe coding skills`（CTR 13.64%，已验证）、`coding skills`。三组词都是"已经知道 skill 这个概念，想知道具体怎么做"的行动型查询，是本次选题里转化确定性最高的一篇，必须给出可复制的操作步骤，不能停留在概念介绍。
- **大纲**（裁剪：实操教程型，保留结论/适用场景/真实经验/FAQ，跳过"成本对比"段落，改为"组织与复用方法论"）：
  - H2 30 秒结论：skill 是什么（可复用的、带说明文档和脚本的"技能包"，不是一次性 prompt）
  - H2 适合谁 / 不适合谁
    - 适合：有重复性工作流程（发布检查、代码维护、内容处理）的独立开发者/小团队
    - 不适合：只写过一两次的一次性任务，不值得封装成 skill
  - H2 怎么写一个 skill：从触发条件到执行步骤
    - 触发描述怎么写才会被正确调用
    - 步骤化 vs 让模型自由发挥的取舍
  - H2 怎么组织：多个 skill 之间怎么分工不打架
    - 站长真实案例：`/skills` 页面里 code-maintenance、livestream-to-podcast、pr-review 三个 skill 的边界怎么划
  - H2 怎么复用：从个人 skill 到跨项目/跨团队复用
  - H2 真实项目经验：站长在 meathill.com、`../meathill`、`../muicv` 等项目里维护 skill 的实际流程
  - H2 常见问题
    - skill 和 slash command 有什么区别？
    - 一个 skill 应该管多细的粒度？
    - skill 里能不能调用外部脚本？
    - 团队协作时 skill 要不要纳入代码仓库？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，4 条
- **内链计划**：
  - 指向 `/skills`（真实 skill 展示页，主承接）
  - 指向大纲①《Vibe Coding 入门》（前置概念）
  - 指向大纲⑤《Skills vs Skills vs Skills》（概念辨析）
  - 指向 `/posts/ai/vibe-coding-code-maintenance-skill`（真实 skill 案例延伸）
  - 指向 `/tech/guides` 分类页

---

### ③ 如何估算 Web 产品的真实云服务成本

- **zh 工作标题**：如何估算 Web 产品的真实云服务成本
- **en 工作标题**：How to Estimate Real Cloud Costs for Your Web Product
- **规划 slug**：`how-to-estimate-real-cloud-costs-for-web-products`
- **WP 分类建议**：tech
- **tags**：tech-guides
- **目标 query 与意图**：`云服务成本估算`、`serverless 账单怎么算`、`cloudflare workers 定价`。了解+决策混合型：开发者在选型前想知道"这个方案上线后大概要花多少钱"，但云厂商的定价页往往是单价表，看完还是不会算。核心价值是给出一套可复用的估算方法，而不是罗列各家价格。
- **大纲**（裁剪：方法论型文章，用"估算方法 → 真实案例对照 → 隐藏成本清单"替代严格 9 段）：
  - H2 30 秒结论：估算云成本的三个变量（请求量、数据传输、有状态存储），以及为什么"看单价表"永远算不准
  - H2 常见的估算误区
    - 只看免费额度，不看超出后的边际单价曲线
    - 忽视"计费单位"和"实际消耗单位"不一致的情况（如 TiDB 的 RU）
  - H2 一套可复用的估算步骤
    - 第一步：画出请求路径（哪些环节会产生计费事件）
    - 第二步：用真实/预估流量代入单价
    - 第三步：预留 2-3 倍缓冲应对突发流量
  - H2 真实项目经验：TiDB RU 账单爆炸事件的完整复盘
    - 引用 `/posts/tidb/tidb-ru-bill-explosion-investigation`
    - 引用 `/posts/tech/a-record-of-moving-db-to-tidb-cloud-and-move-back`（最终回迁决策）
  - H2 不同规模项目的成本量级参考（不是精确报价，是数量级判断）
    - H3 个人项目/原型验证阶段
    - H3 有真实用户但流量不大（<10万 PV/月）
    - H3 增长期项目
  - H2 常见问题
    - 免费额度用完了会不会突然产生巨额账单？
    - 怎么设置账单告警？
    - Serverless 计费和传统 VPS 包月哪个更容易控制预算？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向 `/posts/tidb/tidb-ru-bill-explosion-investigation`（主案例）
  - 指向 `/posts/tech/a-record-of-moving-db-to-tidb-cloud-and-move-back`
  - 指向大纲⑨《Hyperdrive 详解》（定价小节互链）
  - 指向大纲⑦《VPS vs Cloudflare Workers》（成本决策延伸）
  - 指向 `/tech/guides` 分类页

---

### ④ Serverless、Edge、VPS、容器到底是什么、怎么选

- **zh 工作标题**：Serverless、Edge、VPS、容器到底是什么、怎么选
- **en 工作标题**：Serverless vs Edge vs VPS vs Containers: A Plain-English Guide
- **规划 slug**：`serverless-edge-vps-containers-explained`
- **WP 分类建议**：tech
- **tags**：tech-guides
- **目标 query 与意图**：`serverless 是什么`、`edge computing 是什么`、`vps 和 serverless 区别`。纯了解型，面向技术小白，搜索者可能刚接触后端部署概念，容易被营销术语搞混。这篇是整个 /tech 频道的"底层概念收口页"，后续多篇 compare/platforms 文章都可以反向链接过来做概念铺垫。
- **大纲**（裁剪：科普型文章，四个概念逐一拆解 + 一张决策速查，不做成本/迁移深挖，那些留给具体的 compare 文章）：
  - H2 30 秒结论：四个词描述的是部署形态的不同维度，不是互斥选项（可以同时具备 edge + serverless 特征，如 Cloudflare Workers）
  - H2 VPS：你租了一台完整的虚拟机
  - H2 容器：把运行环境打包，解决"在我电脑上能跑"的问题
  - H2 Serverless：按请求计费，不用管服务器本身
  - H2 Edge：代码跑在离用户更近的节点
  - H2 一张速查表：常见场景该往哪个方向想
    - 个人项目起步、需要长驻进程/定时任务、全球用户访问延迟敏感、传统数据库强一致性需求 等场景对照
  - H2 真实项目经验：站长同一批产品里同时用了 VPS（WordPress 后端）和 Cloudflare Workers（Next.js 前台）的混合架构，为什么这么选
  - H2 常见问题
    - Serverless 是不是比 VPS 更便宜？
    - Edge 计算是不是就是 CDN？
    - 小项目要不要一上来就用容器化部署？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向大纲⑦《VPS vs Cloudflare Workers》（深入对比）
  - 指向大纲⑩《Cloudflare Workers 适合什么》（Edge 具体案例）
  - 指向大纲⑪⑫（技术栈实操延伸）
  - 指向 `/tech/guides` 与 `/tech/compare` 分类页

---

### ⑤ Claude Code Skills vs Agent Skills vs 传统 Coding Skills

- **zh 工作标题**：Claude Code Skills vs Agent Skills vs 传统 Coding Skills：概念不是一回事
- **en 工作标题**：Claude Code Skills vs Agent Skills vs Traditional Coding Skills
- **规划 slug**：`claude-code-skills-vs-agent-skills-vs-traditional-coding-skills`
- **WP 分类建议**：tech
- **tags**：tech-compare, claude-code, agent-skills, vibe-coding
- **目标 query 与意图**：`agent skills`（Trends 上升词）、`claude code skills`、`coding skills`（CTR 已验证但排名不稳）。决策/澄清型：这三个说法在营销语境下经常混用，搜索者往往是被不同厂商的术语绕晕，想知道到底有什么区别、该学哪个。这是 P0 优先级里唯一的严格 compare 类文章，需要完整走 9 段结构。
- **大纲**（严格 9 段）：
  - H2 30 秒结论：三者的关系不是"三选一"，而是"具体实现 / 通用协议 / 传统资格认证"三个不同层面的概念，一句话给出判断树
  - H2 适合谁 / 不适合谁
    - Claude Code Skills：已经在用 Claude Code 的开发者
    - Agent Skills（跨厂商/跨 agent 的技能协议概念）：需要在多个 agent 平台间复用技能逻辑的团队
    - 传统 coding skills（招聘/简历语境下的"编程技能"）：求职者、技能自评场景
  - H2 核心能力比较
    - 触发机制、可移植性、执行环境的差异对照
  - H2 成本与隐藏成本
    - 学习成本、维护成本（skill 会不会随模型/平台升级而失效）
  - H2 开发体验与运维
    - 编写、测试、版本管理 skill 的实际流程差异
  - H2 限制与迁移成本
    - Claude Code Skills 迁移到其他 agent 平台的兼容性现实
  - H2 真实项目经验：站长维护的 `/skills` 页面里各 skill 的定位，以及哪些属于纯 Claude Code 专属、哪些逻辑可以移植
  - H2 按项目类型的最终建议
    - 单人用 Claude Code 深度绑定：直接学 Claude Code Skills
    - 团队多 agent 混用：优先考虑通用性更强的 Agent Skills 设计思路
  - H2 常见问题
    - Agent Skills 是某个厂商的专有名词吗？
    - 学 Claude Code Skills 会不会被平台锁定？
    - 传统意义上的"coding skill"（简历技能项）在 AI 时代还重要吗？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向大纲②《Claude Code Skills 实战》（操作延伸）
  - 指向 `/skills`（真实案例）
  - 指向大纲①《Vibe Coding 入门》（上位概念）
  - 指向 `/tech/compare` 分类页

---

### ⑥ Vercel vs Cloudflare：不同规模和项目类型怎么选

- **zh 工作标题**：Vercel vs Cloudflare：不同规模和项目类型怎么选
- **en 工作标题**：Vercel vs Cloudflare: Choosing by Project Size and Type
- **规划 slug**：`vercel-vs-cloudflare-which-fits-your-project`
- **WP 分类建议**：tech
- **tags**：tech-compare, cloudflare-workers
- **目标 query 与意图**：`vercel vs cloudflare`、`next.js 部署选型`。决策型：多数搜索者已经在用 Vercel（Next.js 官方推荐平台），纠结的点是"要不要迁到 Cloudflare、什么情况下值得迁"。站长有完整的迁移实操经验（多篇已有文章），这篇是"总纲"，把决策逻辑讲清楚，把具体迁移步骤甩给已有的实操文。
- **大纲**（严格 9 段）：
  - H2 30 秒结论：小项目/原型阶段 Vercel 更省心，规模上来后 Cloudflare 的成本优势和边缘特性开始体现，给出简明判断标准
  - H2 适合谁 / 不适合谁
    - Vercel 适合：团队小、要极致开发体验、预算对早期成本不敏感
    - Cloudflare 适合：流量大后账单敏感、需要 D1/R2/DO 等边缘原生存储、已有 Cloudflare 基础设施
  - H2 核心能力比较
    - 部署流程、Edge Runtime 兼容性、ISR/图片优化等 Next.js 特性支持差异
  - H2 成本与隐藏成本
    - Vercel 的带宽/函数调用计费 vs Cloudflare Workers 的请求计费，超额后的真实差异
    - 图片处理隐藏成本：引用 `/posts/cloudflare/nextjs-images-why-so-expensive-cloudflare-image-resizing-pitfalls-best-practices`
  - H2 开发体验与运维
    - 本地开发、预览环境、CI/CD 流程对比
  - H2 限制与迁移成本
    - OpenNext 适配层带来的限制，哪些 Next.js 特性在 Cloudflare 上要改写
  - H2 真实项目经验
    - 引用 `/posts/next-js/migrate-next-js-from-vercel-to-cloudflare`（Next.js 迁移实录）
    - 引用 `/posts/tech/moved-my-nuxt3-sites-from-vercel-to-cloudflarenuxt`（Nuxt 场景对照）
  - H2 按项目类型的最终建议
    - 内容站/博客、SaaS 早期、SaaS 增长期、AI 应用 分别给判断
  - H2 常见问题
    - 迁移到 Cloudflare 需要重写多少代码？
    - Cloudflare 是不是一定比 Vercel 便宜？
    - 可以只迁一部分服务，保留混合架构吗？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向 `/posts/next-js/migrate-next-js-from-vercel-to-cloudflare`（主案例）
  - 指向 `/posts/tech/moved-my-nuxt3-sites-from-vercel-to-cloudflarenuxt`
  - 指向 `/posts/next-js/best-practice-for-nextjs-on-cloudflare-worker-2026`（落地后最佳实践）
  - 指向 `/posts/cloudflare/nextjs-images-why-so-expensive-cloudflare-image-resizing-pitfalls-best-practices`
  - 指向大纲⑩《Cloudflare Workers 适合什么》
  - 指向 `/tech/compare` 分类页

---

### ⑦ VPS vs Cloudflare Workers：别把所有项目都做成 Serverless

- **zh 工作标题**：VPS vs Cloudflare Workers：别把所有项目都做成 Serverless
- **en 工作标题**：VPS vs Cloudflare Workers: Not Everything Should Be Serverless
- **规划 slug**：`vps-vs-cloudflare-workers-not-everything-should-be-serverless`
- **WP 分类建议**：tech
- **tags**：tech-compare, cloudflare-workers
- **目标 query 与意图**：`vps vs serverless`、`vps vs cloudflare workers`。决策型，带有一定反主流观点色彩：当前技术圈 serverless/edge 叙事很强，但站长自己的架构是 WordPress（VPS）+ Next.js 前台（Cloudflare），这篇要旗帜鲜明地讲清楚"什么时候 VPS 仍是更优解"，避免读者盲目 all-in serverless。
- **大纲**（严格 9 段）：
  - H2 30 秒结论：长驻进程、强状态依赖、需要完全控制运行时环境（如 WordPress + PHP 生态）的场景，VPS 依然是更简单可靠的选择；无状态、突发流量、边缘分发场景才是 Serverless 的主场
  - H2 适合谁 / 不适合谁
    - VPS 适合：CMS 类系统（WordPress）、需要长连接/后台任务、预算可预测优先于弹性
    - Cloudflare Workers 适合：API 层、边缘渲染、流量波动大的前台
  - H2 核心能力比较
    - 冷启动、执行时长限制、可用运行时/语言生态、状态管理方式
  - H2 成本与隐藏成本
    - VPS 包月固定成本 vs Workers 按请求计费在不同流量曲线下的交叉点
  - H2 开发体验与运维
    - VPS 需要自己维护安全更新、进程守护；Workers 免运维但受平台限制约束
  - H2 限制与迁移成本
    - 把有状态服务硬塞进 Serverless 的常见反模式和真实代价
  - H2 真实项目经验
    - 站长真实混合架构：meathill.com WordPress 后端跑 VPS，Next.js 前台跑 Cloudflare Workers，两者通过 wp-json 通信
    - 引用博客 WP 后端相关运维经验（Caddy、wp-cron 等真实踩坑背景）
  - H2 按项目类型的最终建议
    - 纯内容站/CMS、API 网关型服务、AI 应用推理层 分别给判断
  - H2 常见问题
    - VPS 是不是已经过时了？
    - 可以把 WordPress 也做成 Serverless 吗？
    - 混合架构会不会增加维护复杂度？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向大纲④《Serverless/Edge/VPS/容器》（概念铺垫）
  - 指向大纲⑩《Cloudflare Workers 适合什么》
  - 指向大纲⑫《独立开发者低成本技术栈》
  - 指向 `/tech/compare` 分类页

---

### ⑧ Supabase vs TiDB：它们不是同一类产品

- **zh 工作标题**：Supabase vs TiDB：它们根本不是同一类产品
- **en 工作标题**：Supabase vs TiDB: They're Not Even the Same Category
- **规划 slug**：`supabase-vs-tidb-not-the-same-category`
- **WP 分类建议**：tech
- **tags**：tech-compare, hyperdrive
- **目标 query 与意图**：`supabase vs tidb`、`postgres vs mysql 云数据库选型`。决策型，但核心是"纠偏"：很多开发者把两者当作同一层面的"云数据库选择"来比较，实际上 Supabase 是 BaaS（认证+存储+数据库一体化平台），TiDB 是分布式 MySQL 兼容数据库，定位完全不同。这篇要先纠正认知框架，再给出场景化建议。
- **大纲**（严格 9 段）：
  - H2 30 秒结论：先说清楚二者不是互斥选项——很多项目其实是"Supabase 做 BaaS 层 + 底层数据库另选"，或者"纯后端项目直接选 TiDB"，给出决策框架而不是单一推荐
  - H2 适合谁 / 不适合谁
    - Supabase 适合：需要开箱即用的认证/存储/实时订阅，前端主导的独立开发项目
    - TiDB 适合：已有 MySQL 生态、需要水平扩展、对分布式一致性有要求的后端系统
  - H2 核心能力比较
    - 数据模型（Postgres vs MySQL 兼容）、内置服务范围、扩展性设计差异
  - H2 成本与隐藏成本
    - Supabase 的分层定价 vs TiDB Serverless 的 RU 计费模型
    - 引用 `/posts/tidb/tidb-ru-bill-explosion-investigation`（RU 计费踩坑，隐藏成本核心案例）
  - H2 开发体验与运维
    - Supabase 一体化控制台 vs TiDB 需要自己搭配连接池/连接管理（引出 Hyperdrive 的作用）
  - H2 限制与迁移成本
    - 从 TiDB 迁移到其他数据库、或反向迁移的真实代价
    - 引用 `/posts/tech/a-record-of-moving-db-to-tidb-cloud-and-move-back`（迁移+回迁全过程）
  - H2 真实项目经验
    - 引用 `/posts/tidb/from-40s-to-11ms-tidb-cloud-sql-optimization`（TiDB SQL 优化真实案例）
    - Cloudflare Workers 场景下用 Hyperdrive 连接 Supabase Postgres 的实践：引用 `/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker`
  - H2 按项目类型的最终建议
    - 独立开发者 MVP、需要水平扩展的后端系统、混合架构 分别给判断
  - H2 常见问题
    - Supabase 底层用的是 TiDB 吗？（纠正常见误解，两者本来就不冲突）
    - TiDB 适合小项目吗？
    - 数据库选型定了之后还能中途换吗？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向 `/posts/tidb/tidb-ru-bill-explosion-investigation`
  - 指向 `/posts/tech/a-record-of-moving-db-to-tidb-cloud-and-move-back`
  - 指向 `/posts/tidb/from-40s-to-11ms-tidb-cloud-sql-optimization`
  - 指向 `/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker`
  - 指向大纲⑨《Hyperdrive 详解》
  - 指向 `/tech/compare` 分类页

---

### ⑨ Cloudflare Hyperdrive 详解：它解决什么、定价、限制与踩坑

- **zh 工作标题**：Cloudflare Hyperdrive 详解：它解决什么、定价、限制与踩坑
- **en 工作标题**：Cloudflare Hyperdrive Explained: What It Solves, Pricing, Limits, and Pitfalls
- **规划 slug**：`cloudflare-hyperdrive-explained-pricing-limits-pitfalls`
- **WP 分类建议**：tech
- **tags**：tech-platforms, hyperdrive, cloudflare-workers
- **目标 query 与意图**：`hyperdrive`（Bing 实测展现 103、平均位置 5.09，P0 最高优先级词）。了解+决策混合型：搜索者大概率已经在评估或使用 Cloudflare Workers，听说过 Hyperdrive 但不确定它到底解决什么问题、要不要用、有什么限制。当前站内已有一篇聚焦"Next.js + Supabase + Hyperdrive 最佳实践"的实操文，但缺一篇专门讲清楚 Hyperdrive 本身（定位、定价、限制）的权威解释页——这篇就是承接 `hyperdrive` 这个词的主入口，写完后要和已有实操文互相加内链。
- **大纲**（严格 9 段，platforms 类标准结构）：
  - H2 30 秒结论：Hyperdrive 不是数据库，是 Cloudflare Workers 连接传统数据库（Postgres/MySQL）的连接池+缓存加速层，解决的是"Workers 无状态短连接 vs 数据库长连接池"的根本矛盾
  - H2 适合谁 / 不适合谁
    - 适合：Workers 上跑的应用要连接 Supabase/传统 Postgres/MySQL 等非边缘原生数据库
    - 不适合：本来就用 D1/边缘原生存储的项目，不需要额外引入 Hyperdrive
  - H2 核心能力比较
    - 连接池、查询缓存、和直接连接数据库相比的延迟差异
  - H2 成本与隐藏成本
    - Hyperdrive 本身定价 vs 隐性成本（数据库出口流量、缓存失效场景下的穿透查询）
  - H2 开发体验与运维
    - 配置流程、本地开发与生产环境的差异、监控可观测性
  - H2 限制与迁移成本
    - 支持的数据库类型、查询缓存的一致性边界、不适用的查询模式（长事务、大结果集）
  - H2 真实项目经验
    - 引用 `/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker`（详细实操延伸阅读）
    - 补充站长在该项目里遇到的具体限制/调优过程
  - H2 按项目类型的最终建议
    - Next.js/Nuxt + Supabase 组合、自建 Postgres/MySQL、纯 D1 项目 分别给判断
  - H2 常见问题
    - Hyperdrive 支持哪些数据库？
    - 不用 Hyperdrive 直接连接数据库会怎样？
    - Hyperdrive 的缓存会不会导致读到脏数据？
    - Hyperdrive 免费额度够小项目用吗？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，4 条
- **内链计划**：
  - 指向 `/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker`（互相加内链，双向承接同一关键词）
  - 指向大纲⑧《Supabase vs TiDB》
  - 指向大纲⑩《Cloudflare Workers 适合什么》
  - 指向大纲③《云成本估算》
  - 指向 `/tech/platforms` 分类页

---

### ⑩ Cloudflare Workers 适合什么、不适合什么

- **zh 工作标题**：Cloudflare Workers 适合什么、不适合什么
- **en 工作标题**：What Cloudflare Workers Is Good For — and What It Isn't
- **规划 slug**：`cloudflare-workers-what-its-good-for-what-its-not`
- **WP 分类建议**：tech
- **tags**：tech-platforms, cloudflare-workers
- **目标 query 与意图**：`cloudflare workers 适合什么`、`cloudflare workers 限制`。决策型：搜索者已经了解 Cloudflare Workers 基本概念（可能是从 Vercel vs Cloudflare 对比文过来的），想确认自己的具体项目类型是否适合，尤其关心执行时长/内存/运行时限制这些容易踩坑的边界条件。
- **大纲**（严格 9 段，platforms 类标准结构）：
  - H2 30 秒结论：Cloudflare Workers 是 V8 隔离环境，不是完整的 Node.js 运行时；适合无状态请求处理、API 网关、边缘渲染，不适合长驻进程、重计算任务、依赖 Node 原生模块的场景
  - H2 适合谁 / 不适合谁
    - 适合：Next.js/Nuxt 边缘渲染前台、API 网关、轻量后端逻辑
    - 不适合：CMS 后端（WordPress 类）、长时间运行的批处理任务、强依赖特定 Node.js 原生模块的项目
  - H2 核心能力比较
    - CPU 时间限制、内存限制、支持的 API 子集（fetch/D1/R2/DO/Queues 等）
  - H2 成本与隐藏成本
    - 请求计费模型，以及"看似便宜实则超额"的典型场景（如图片处理）
    - 引用 `/posts/cloudflare/nextjs-images-why-so-expensive-cloudflare-image-resizing-pitfalls-best-practices`
  - H2 开发体验与运维
    - wrangler 本地开发体验、绑定（bindings）机制、可观测性工具
  - H2 限制与迁移成本
    - OpenNext 适配层的限制、从 Node.js 后端迁移过来需要改写的部分
  - H2 真实项目经验
    - 站长多个产品在 Workers 上的真实架构：OpenNext/Next.js + D1 + R2 + DO + Hyperdrive 组合
    - 引用 `/posts/cloudflare/cloudflare-email-worker-three-pitfalls`、`/posts/cloudflare/payload-cms-on-cloudflare-five-pitfalls`
  - H2 按项目类型的最终建议
    - 内容站前台、API 服务、CMS 后端、AI 推理网关 分别给判断
  - H2 常见问题
    - Cloudflare Workers 能跑 Node.js 应用吗？
    - Workers 的执行时长限制是多少？
    - 什么情况下应该用 Durable Objects 而不是普通 Workers？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向大纲⑥《Vercel vs Cloudflare》
  - 指向大纲⑦《VPS vs Cloudflare Workers》
  - 指向大纲⑨《Hyperdrive 详解》
  - 指向 `/posts/cloudflare/nextjs-images-why-so-expensive-cloudflare-image-resizing-pitfalls-best-practices`、`/posts/cloudflare/cloudflare-email-worker-three-pitfalls`、`/posts/cloudflare/payload-cms-on-cloudflare-five-pitfalls`
  - 指向 `/tech/platforms` 分类页

---

### ⑪ 小白启动内容站的推荐技术栈

- **zh 工作标题**：小白启动内容站的推荐技术栈
- **en 工作标题**：Recommended Stack for Starting a Content Site (Beginner Guide)
- **规划 slug**：`recommended-stack-for-starting-a-content-site`
- **WP 分类建议**：tech
- **tags**：tech-stacks
- **目标 query 与意图**：`内容站 技术栈推荐`、`博客技术栈选型`。决策型，面向技术小白：想做一个内容站（博客/资讯站），不知道从哪些技术组件开始选。这篇要给出一个"够用就好"的默认推荐，而不是罗列所有可能性，降低决策成本。
- **大纲**（裁剪：stacks 类以"默认推荐 + 何时偏离默认"为核心，跳过严格的"核心能力比较"段落）：
  - H2 30 秒结论：给出一套默认技术栈推荐（CMS + 静态/边缘渲染前台 + CDN），并说明为什么这是大多数内容站的最优起点
  - H2 适合谁 / 不适合谁
    - 适合：个人博客、垂类资讯站、企业内容营销站
    - 不适合：需要复杂交互/实时功能的产品（应参考大纲⑫ SaaS 技术栈）
  - H2 推荐技术栈拆解
    - H3 内容管理：WordPress（成熟生态、内容团队友好）vs Headless CMS 的取舍
    - H3 前台渲染：Next.js/Nuxt + 边缘部署（引用站长真实架构）
    - H3 图片与静态资源：CDN + 图片处理服务选型要点（不重复讲定价，链接到已有踩坑文）
  - H2 成本参考
    - 起步阶段（域名+托管+CDN）大致量级，不做精确报价
  - H2 真实项目经验
    - 站长自己的 WordPress + Next.js 混合架构就是这套推荐的原型：`/posts/next-js/best-practice-for-nextjs-on-cloudflare-worker-2026`
  - H2 什么时候应该偏离这套默认推荐
    - 内容量极大需要搜索/推荐系统时
    - 需要多语言/多地区部署时
  - H2 常见问题
    - 一定要用 WordPress 吗？
    - 静态站生成和边缘渲染怎么选？
    - 起步阶段要不要考虑后续迁移成本？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向 `/posts/next-js/best-practice-for-nextjs-on-cloudflare-worker-2026`
  - 指向大纲④《Serverless/Edge/VPS/容器》（概念铺垫）
  - 指向大纲⑥《Vercel vs Cloudflare》
  - 指向 `/tech/stacks` 分类页

---

### ⑫ 独立开发者启动 SaaS/AI 应用的低成本技术栈

- **zh 工作标题**：独立开发者启动 SaaS/AI 应用的低成本技术栈
- **en 工作标题**：Low-Cost Stack for Indie Developers Launching SaaS/AI Apps
- **规划 slug**：`low-cost-stack-for-indie-saas-and-ai-apps`
- **WP 分类建议**：tech
- **tags**：tech-stacks, cloudflare-workers
- **目标 query 与意图**：`独立开发 saas 技术栈`、`ai 应用低成本技术栈`。决策型，面向已经有一定判断力的独立开发者/小团队：想快速启动一个 SaaS 或 AI 应用，预算有限，关心"从 0 到有真实用户"这个阶段该怎么选技术栈才不会一上来就背高固定成本。
- **大纲**（裁剪：同大纲⑪结构，聚焦"起步低成本 + 后续可扩展路径"）：
  - H2 30 秒结论：给出一套默认组合（边缘渲染前台 + 边缘原生存储 D1/R2 + 按量计费的第三方数据库/AI API），核心原则是"起步阶段固定成本趋近于零，增长阶段再按需升级"
  - H2 适合谁 / 不适合谁
    - 适合：独立开发者验证想法阶段、小团队 MVP
    - 不适合：从一开始就明确需要复杂多租户/合规要求的企业级 SaaS
  - H2 推荐技术栈拆解
    - H3 前台+API：Next.js/Nuxt on Cloudflare Workers（OpenNext）
    - H3 数据层：D1（轻量）/ Supabase+Hyperdrive（需要更完整关系型能力时）
    - H3 文件/对象存储：R2
    - H3 有状态协调：Durable Objects（如需要 WebSocket/实时协作/计费状态机）
    - H3 AI 能力接入：怎么控制 AI API 调用成本（引用 MuiRouter 网关经验，如已发布可互链）
  - H2 成本参考
    - 起步阶段免费额度基本覆盖验证期，给出量级参考而非精确报价
  - H2 真实项目经验
    - 站长同时运营多个副产品（`../mui-api`、`../dyqr`、`../gazou` 等）的共同技术栈选择逻辑
    - 引用 `/posts/cloudflare-worker/vibe-coding-lightweight-kms-on-cloudflare`（轻量基础设施 skill 案例）
  - H2 什么时候应该偏离这套默认推荐
    - 需要强一致性事务、复杂 SQL 查询能力时应转向 TiDB/传统关系型数据库（链接大纲⑧）
    - 长驻计算密集任务应考虑 VPS（链接大纲⑦）
  - H2 常见问题
    - D1 能撑到多大规模？
    - AI 应用的调用成本怎么控制？
    - 起步用这套技术栈,后续换会不会很痛苦？
  - H2 资料来源与更新时间
- **FAQ 候选**：见上，3 条
- **内链计划**：
  - 指向大纲⑧《Supabase vs TiDB》
  - 指向大纲⑦《VPS vs Cloudflare Workers》
  - 指向大纲⑨《Hyperdrive 详解》
  - 指向 `/posts/cloudflare-worker/vibe-coding-lightweight-kms-on-cloudflare`
  - 指向 `/tech/stacks` 分类页

---

## 4. 发布 workflow（checklist）

每篇文章从写完到验证收录，按以下顺序执行：

- [ ] **写文并打约定 tag**：在 WordPress 后台创建文章，正文写完后打上「通用分类 tag」（`tech-compare` / `tech-platforms` / `tech-stacks` / `tech-guides` 中对应一个）+「主题 tag」（`vibe-coding` / `claude-code` / `agent-skills` / `hyperdrive` / `cloudflare-workers` 中相关的一个或多个）
- [ ] **确认自动聚合**：打 tag 后文章应自动出现在对应的 `/tech/{section}` 分类页（由现有 tag-to-section 聚合逻辑处理，不需要改代码）
- [ ] **如需要置顶/精选**：若该篇文章需要在 `/tech` 首页或子栏目页人工置顶，把 slug 加进 `src/lib/tech.ts` 对应分类的 `postSlugs` 白名单（保序展示）——这是唯一需要碰代码的步骤，其余流程均在 WP 后台完成
- [ ] **验证收录**：
  - [ ] 打开对应 `/tech/{section}` 分类页，确认文章出现且排序符合预期
  - [ ] 检查 sitemap（`/sitemap.xml` 或相关子 sitemap）是否已包含该文章 URL
- [ ] **GSC 提交 URL**：在 Google Search Console 用 URL 检查工具提交该文章 URL 请求编入索引
- [ ] **回链已有文章**：按本文档第 2/3 节的内链计划，回头给旧文章补打 tag / 加内链（「待更新」状态的文章逐一处理）
- [ ] **28 天后回看效果**：分别在 Bing Webmaster Tools 和 GSC 查询该文章对应的目标 query 簇，记录展现/点击/CTR/平均位置，判断是否需要二次优化（补内容、调标题、加内链）或该 query 簇优先级降级

---

## 5. 写作原则

- **每篇必须有真实经验/成本数据/踩坑记录**，不做参数罗列。没有真实经历支撑的选题，宁可先不写，也不要凑数。
- **30 秒结论放最前**，读者不看完全文也能拿到判断结论，正文是给出判断依据。
- **避免为同义词批量造薄页**：`vibe coding skill` / `vibe coding skills` / `coding skills` 这类高度重合的query，合并到同一篇里通过标题/H2 自然覆盖，不额外拆分文章。
- **比较型文章（compare）结论要有明确判断**，不能各打五十大板式"看情况"，要给出"按项目类型"的具体建议，模糊结论等于没有结论。
- **常见问题必须用「常见问题」四个字作为 H2**，触发站点自动 FAQPage 结构化数据提取，不要写成「FAQ」或其他变体。

---

## 6. 自查与优先级建议

### 自查结果

- 12 篇大纲齐全（① ~ ⑫），分类分布：guides 4 篇、compare 4 篇、platforms 2 篇、stacks 2 篇，与任务要求一致
- 每篇均含：zh/en 工作标题、规划 slug、WP 分类建议、tags、目标 query 与意图分析、H2/H3 大纲、FAQ 候选（3-5 条）、内链计划，字段齐全
- 12 个规划 slug（`vibe-coding-getting-started-tool-selection-2026`、`claude-code-skills-how-to-write-organize-reuse`、`how-to-estimate-real-cloud-costs-for-web-products`、`serverless-edge-vps-containers-explained`、`claude-code-skills-vs-agent-skills-vs-traditional-coding-skills`、`vercel-vs-cloudflare-which-fits-your-project`、`vps-vs-cloudflare-workers-not-everything-should-be-serverless`、`supabase-vs-tidb-not-the-same-category`、`cloudflare-hyperdrive-explained-pricing-limits-pitfalls`、`cloudflare-workers-what-its-good-for-what-its-not`、`recommended-stack-for-starting-a-content-site`、`low-cost-stack-for-indie-saas-and-ai-apps`）均未与背景资料列出的站内已有文章 slug 重复
- 全文出现的 tag 均取自约定 tag 体系（`tech-compare` / `tech-platforms` / `tech-stacks` / `tech-guides` / `vibe-coding` / `claude-code` / `agent-skills` / `hyperdrive` / `cloudflare-workers`），未新造 tag

### 优先级排序建议：先写哪 3 篇

按第 1.4 节的 P0 逻辑，建议开局顺序：

1. **⑨ Cloudflare Hyperdrive 详解**——`hyperdrive` 是目前唯一有稳定排名基础（平均位置 5.09）的词，且当前只有一篇偏实操的承接页、缺权威解释页，是"补短板换排名"里投入产出比最高的一篇。写完后立即与已有的 `/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker` 互加内链。
2. **② Claude Code Skills 实战：怎么写、怎么组织、怎么复用**——直接承接 CTR 最高的两组已验证词（`vibe coding skill` 10.42%、`vibe coding skills` 13.64%），且站长有 `/skills` 页面的真实产品可以背书，行动型查询转化确定性最高。
3. **⑤ Claude Code Skills vs Agent Skills vs 传统 Coding Skills**——承接 Trends 上升词 `agent skills`，同时是 12 篇里唯一严格走满 9 段结构的 compare 类 P0 文章，能和②互相导流、把"了解型"和"决策型"两种查询意图的流量都接住，形成一个小闭环。

这三篇写完后，建议紧接着补 ① Vibe Coding 入门（承接 Trends 最热但需要真实经验压住质量的泛概念词，同时给②⑤做入口铺垫），再进入 P1 的 compare/stacks 系列。
