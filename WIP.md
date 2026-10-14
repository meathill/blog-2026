## Issue #16：关掉导航预取、空 slug 链接、favicon、OG 边缘缓存（2026-10-14）

- [x] `@/i18n/routing` Link 默认 `prefetch={false}`，页头品牌与主导航显式关闭；确认没有 `router.prefetch`
- [x] slug 为空（含字面量 `null`）时不生成 `/tag/null`、`/category/null`、`/posts/*/null`
- [x] `public/favicon.ico` 静态返回
- [x] `/api/og` 成功响应可进 Workers Cache，失败和 `?refresh=1` 为 no-store；API 其余路由仍 no-store
- [x] 测试 582、format、typecheck、next build 通过
- [ ] 部署后看 Workers CPU：导航 RSC 预取下降，`/favicon.ico` 不再 404，`/api/og/post` 边缘命中上升

## 博客编辑器代码块与排版改进（2026-10-13，已完成）

- [x] 装依赖：shiki / @shikijs/langs / @shikijs/themes / prosemirror-highlight（13 项高亮单测）
- [x] fork `blog-code-block.ts`：select 包一层 `.bn-code-block-language`、词表外语言补选项、挂 `code-block-highlighter`
- [x] `BlogBlockEditor.module.css`：代码块纵向布局、#282c34 底色、行内代码、段落间距
- [x] 无头 Chrome 截图验收（临时预览页，已删除）：工具条回到代码上方、shiki 高亮生效（82 个装饰）、
      语言下拉可见可点、行内代码有底色边框、段落间距变松；564 测试 / typecheck / next build 通过
- [x] `DEV_NOTE.md` 记录选型与两条 BlockNote CSS 坑
- [ ] 待用户确认观感（间距数值、深色工具栏是否合意，都在 CSS 里，随时可调）

根因：BlockNote 自带 `.bn-block-content{display:flex}`（行方向）让 toolbar 与 `<pre>` 并排；
`.bn-block-content[data-content-type=codeBlock]>div>select`（绝对定位 + opacity:0）命中 fork 的 select，
把它变成左上角隐形浮层，我们自己的下拉样式被更高特异性盖掉。

顺带发现（非本次引入，改动前后对照一致）：mermaid 预览只在编辑后才显示，详见 DEV_NOTE。



- [x] 入口改回 .open-next/worker.js，移除自定义别名与入口
- [x] 仅用官方 OpenNext 配置，保留当前 R2 全关与业务资源
- [x] 由 Next 原生 headers() 保护 API 缓存边界，发布走原生缓存清理 API
- [x] 移除无用的缓存包装与对应实现测试，补充配置/响应边界验证
- [x] 类型、548 项测试、构建、Worker dry-run 与本地预览通过；仅本地保存，不推送部署

# WIP: 处理 issue #6 / #7 / #8

## WP 源站抖动导致文章页 500（2026-10-05，已完成待部署）

线上 blog.meathill.com 源站间歇性挂起（>100s，Cloudflare 回 524），冷渲染文章页 `wpFetch` 抛未捕获异常 → 裸 500。定性为瞬时抖动（当日已自愈），只做代码韧性：

- [x] 测试先行：`tests/unit/wordpress-client.test.ts`（5xx 重试 / 网络错误重试 / 耗尽抛错 / 4xx 不重试 / 非 GET 不重试 / 超时 signal）
- [x] `wpFetch`：30s 超时 + GET 重试 1 次 + 结构化错误日志（`src/lib/wordpress/client.ts`）
- [x] 友好错误页：`src/app/[locale]/error.tsx`（500 语义 + 重试/回首页）+ `tests/unit/locale-error.test.tsx`
- [x] 回归：test 615 通过 / format / typecheck / build
- [ ] 部署后线上验证文章页与 feed 路由
- 决策记录见 DEV_NOTE「WP 源站访问韧性」；不做：feed 路由改造、observability 重开、源站排查

完整计划见 `~/.claude/plans/https-github-com-meathill-blog-2026-iss-linear-tide.md`。执行模式:主管 + Sonnet subagents 分包,逐项督查验收。

## 任务分解 (TODO)

### Part 0 基线
- [x] chore(deps): next 升级到 16.3,全量验证(test/typecheck/build);顺带修复 cf-typegen strict-vars 既有类型错误,新增 typecheck script

### Part 1 — #8 区域缓存
- [x] perf(cloudflare): open-next.config.ts 用 withRegionalCache 包装 R2(long-lived + lazy update),不配 cachePurge(free plan 无 tag purge)

### Part 2 — #6 /tech 内容中心
- [x] feat(middleware): 放行 /tech 与 4 个 section,保留其余 /tech/* legacy 301
- [x] feat(seo): 抽取 buildItemListJsonLd,重构 solutions/skills 列表页
- [x] feat(wordpress): getPosts 支持 slug 数组批量查询
- [x] feat(tech): 策展数据层 tech.ts / tech-posts.ts + messages + 测试
- [x] feat(tech): /tech hub 页 + [section] 分类页 + TechSectionCard
- [x] feat(seo): sitemap 收录 /tech 5 个页面
- [x] feat(nav): 主导航接入 /tech(注意 D1 navigation_configs 覆盖,部署后需 admin 同步)
- [x] docs: docs/tech-content-plan.md 全量首批选题大纲(12 篇,query-to-page 映射)

### Part 3 — #7 sitemap 清理
- [x] 盘点:GSC 8 条 / Bing 9 条 sitemap 实测,产出 docs/seo-sitemap-cleanup-2026-08.md,修 DEV_NOTE 悬空引用
- [x] 源站:确认 Cloudflare 边缘 301 在 Caddy 之前,410 方案不可达,维持 301 归一(不改源站);seo/shop DNS 已消亡
- [x] Bing:实操核实 Discovered 条目无删除入口,靠淡出;GSC 无删除入口,记录策略
- [x] 删除 scripts/seo/server 未应用的 nginx/htaccess/noindex 片段
- [x] 附带修复:非法 locale 段软 404(任意 .xml 路径曾以 200 渲染首页)

### 遗留
- [x] 生产导航同步:已用 SQL 直接更新 D1 navigation_configs(zh/en,保留自定义项),线上已验证
- [ ] 按 docs/tech-content-plan.md 逐篇写作(建议先写 Hyperdrive 详解、Claude Code Skills 实战、Skills 对比)


## Issue #11：Ahrefs crawl 32 broken + 88 过长 meta（2026-09-04）

- [x] 分组：本仓 5 条 meta + broken 链路；tools 站 83 条转交 evertools；2017 大图 0 引用不动；23.5K blocked 保持禁止
- [x] Meta：`root-metadata.ts` en、`messages/en.json` about、`skills.ts` 3 条 en 改短（≤155）+ `seo-meta-length.test.ts` 守卫
- [x] Middleware：honey/mysql8 301 到存活文，gitbook/`img_*` 直接 410（覆盖 /en、/posts/、.html 形态）
- [x] `processContent`：wp-content href 改指 blog 源（修 3 个 403）
- [x] 全量校验：format / typecheck / 469 测试 / build 通过
- [ ] 待部署 24h 后手动 Ahrefs Re-crawl，按 `docs/seo-ahrefs-2026-09.md` 验收关单

## Issue #10: 日语 PDF 编辑词曝光、图片格式转换词矩阵与 Ahrefs 抓取拦截修复 (2026-08-21)

- [x] Part 1: 多语言工具元数据扩展 (`src/lib/tools.ts` 支持 ja/es 多语言回退，补齐 PDF 编辑词与图片转换格式矩阵)
- [x] Part 2: Ahrefs 抓取拦截修复 (`src/app/robots.ts` 同时支持 AhrefsBot 与 AhrefsSiteAudit)
- [x] Part 3: 文章页前端排版与比较表格优化 (`src/app/post-content.css` 支持 table 横向自适应滚动与深色模式样式)
- [x] Part 4: CWV 性能与 TTFB 优化 (`src/app/[locale]/(public)/posts/[...slug]/page.tsx` 添加 `generateStaticParams` 实现 SSG 静态预渲染)
- [x] Part 5: 编写/更新单元测试，确保全部测试通过
- [x] Part 6: 代码格式化、类型检查与全量构建验证
- [x] Part 7: 更新开发笔记 `DEV_NOTE.md`

## Issue #12：Next/OpenNext prefetch 加固 + observability 关闭 (2026-09-05)

- [x] 版本：`next@16.3.4` / `@next/third-parties@16.3.4` / `@opennextjs/cloudflare@1.20.4` 已对齐
- [x] `open-next.config.ts`：`enableCacheInterception: true` → `false`（upstream opennextjs-cloudflare#1348 / opennextjs-aws#1212）
- [x] `wrangler.jsonc`：`observability.enabled` → `false`（本月额度用完，先关省请求数；排障时手动开）
- [x] 次要 `<Link>` 全部 `prefetch={false}`（35 个文件，卡片/列表/分页/面包屑/搜索/关于/admin/404 等）；主导航 `HeaderNavLink` 与品牌 `/` 保留预取；`/search` 关预取；`home/PostCard` 的动态 `LinkComponent` 用 `prefetch: false` 的 `linkProps`
- [x] 全量校验：format / typecheck / 469 测试 / build 通过
- [ ] 待部署后验证：生产 `_rsc` 不再跑飞 + Worker 请求量回落，再关 issue

## ISR 恢复 + 保留 R2（2026-09-27）

- [x] `wrangler.jsonc`：补 `services: WORKER_SELF_REFERENCE` 自引用（DO queue 构造缺它会抛 `IgnorableError`，time-based revalidate 发不出去）；incremental cache 保持 R2，不迁 KV（官方明确不推荐 KV，最终一致）
- [x] 测试：`tests/unit/isr-config.test.ts` 守卫 wrangler 绑定 + open-next R2/queue/tag 配置
- [x] 校验：format / typecheck / 498 测试 / `next build` / `opennextjs-cloudflare build` 通过；`pnpm cf-typegen` 同步 `env.d.ts`（gitignored，内有 `WORKER_SELF_REFERENCE`）
- [x] 文档：`DEV_NOTE.md` 记 ISR 决策
- [ ] 待部署后验证：`NEXT_PRIVATE_DEBUG_CACHE=1` 看 MISS→HIT、改文看 300s/86400s 窗口、R2 `site-cache` 对象增长
## 缓存重复写入独立调查（2026-10-09）

- [x] 核对当前/历史部署、SDK 实现与 R2 原始样本，按页面/fetch 拆分统计
- [x] 实际历史包复现慢 tag → 错误 STALE → 原生后台 Put；队列 HEAD 手动回放再次 Put
- [x] 完整 manifest 验证全局 404 正常访问只读，否定空 manifest 的历史归因
- [x] 当前原生止损线上核对：R2 关闭，公开 query MISS → HIT；548 测试/typecheck/Next build 通过
- [ ] 恢复前补齐历史异常 404 因果、跨 isolate TTL、原生候选与真实 DO/Workers Cache 绕过验收
- 证据与复现：`docs/cache-investigation-2026-10-09.md`；未将已复现缺陷等同于全部线上写入根因。
- 约束：不读取 .env，不改生产数据库，不恢复生产 R2，不部署、不 push；保留无关 WIP。
## 本地与隔离账号缓存验收（2026-10-09）

- [x] 独立安装锁定依赖，原生 Next/OpenNext 构建、冷 isolate / TTL / 404 / 分段 RSC 矩阵通过预期行为断言
- [x] 真实 DO：8 个过期请求去重为 1 次重建；500 写旧页面后重试；页面重建不重复刷新一天 fetch 缓存
- [x] SDK 最小候选：运行时与部署枚举都过滤 404 页面对象；先取数据再 404 仍有 .fetch Put，严格零写入要求尚未满足
- [ ] 本地验证通过后，在免费账号 07ee1a1a1cf0da549eaaf6d3c5c80b62 创建独立 Worker 与测试资源；限制不足时先汇报，不自动换账号或升级
- [ ] 验证 Workers Cache HIT、query、RSC、队列 HEAD 和实际 R2 写入，整理证据
- 线上延期：账号 R2 未启用（只读 API 10042），用户明确决定稍后开通。当前没有线上资源或部署。
- 结果与复现：`docs/cache-investigation-2026-10-09.md` 后续本地验收；`scripts/research/cache-lab/README.md`。
- 授权范围：可部署独立测试环境；不部署生产博客、不访问生产 site-cache 或业务数据库、不 push。
## 继续定位历史爆量（2026-10-09）

- [x] 实际高频全局 404 条目执行 70 个本地请求变体，Put=0；否定普通请求/慢 tag 会重写 false TTL 404 的解释
- [ ] 关联生产或历史原版线上复现的单次 MISS/重建调用者/Put，仍未解释 568 次全局 404 写入
- [ ] 将正常页面的错误 STALE / 失败回退机制与历史实际流量分开，不把候选验收当作根因证明
- [ ] 明确每个历史样本能解释的写入与仍不可归因的部分
- 目标仍是历史大量写入的原因；不恢复生产 R2，线上测试按用户决定等待测试账号开通。
