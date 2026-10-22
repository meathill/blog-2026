## 文章链接 nofollow / 友链 dofollow 可选支持与 noopener 默认支持（2026-10-14，已完成）

- [x] 方案与核心工具库：创建 `src/lib/blog-links.ts`，提供链接属性解析、dofollow 标记编解码、内链判定与 HTML/Markdown 链接清洗
- [x] 单元测试先行：编写 `tests/lib/blog-links.test.ts` 覆盖内链、默认外链 (nofollow+noopener)、交换链接 (dofollow+noopener)、特殊 URL 兼容（16 项测试通过）
- [x] 前台内容流集成：在 `src/lib/wordpress/content.ts` 的 `processContent` 中接入链接处理，确保所有输出 HTML 链接规范统一
- [x] 后台编辑器交互：开发 `BlogLinkToolbar` 自定义组件，并在 `BlogBlockEditor.tsx` 中集成，支持浮层一键切换/编辑 nofollow 状态（5 项组件测试通过）
- [x] 导出与序列化清洗：在 `BlogBlockEditor.tsx` 与 `src/lib/blog-content.ts` 中将 HTML 与 Markdown 输出经由 `processBlogHtmlLinks` 和 `stripDofollowMarkers` 清洗
- [x] 全量验证：跑通全部 606 项单测、Biome 格式化、TypeScript 类型检查与 Next.js 构建验证通过

## 编辑器链接体验修复：鼠标掠过误切第二行链接 & 暗黑模式链接颜色优化（2026-10-14，已完成）

- [x] 链接浮层触发机制重构：开发 `BlogLinkToolbarController`，彻底移除 BlockNote 默认在 mouseover 上的激进劫持，仅在光标选中/点击链接时激活并锁定当前链接，避免鼠标移动时浮层跳窜（3 项组件测试通过）
- [x] 编辑器链接与暗色模式样式：在 `BlogBlockEditor.module.css` 中补齐 `.bn-editor a` 样式，适配 dark mode 高对比度琥珀主色，移除原生深蓝与浏览器默认 `:active` / `:visited` 变色
- [x] 单元测试与验证：更新/新增控制器测试，运行全量测试套件（609 项全绿通过）、格式化与构建验证


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

## R2 ISR / Workers Cache（2026-10-22，代码迭代结束）

代码 bfa796f 已上线：冷实例恢复路由 TTL、跨模块共享 ALS；647 项测试、类型/构建与实际产物验证通过。
Workers Cache HIT 与边缘 MISS / ISR HIT 已实测；当前方案和约22小时证据见
[收尾记录](docs/cache-isr-closeout-2026-10-22.md)及 DEV_NOTE。旧的关闭 R2 / 独立账号恢复前计划已由现行方案替代。

- [ ] 北京时间 10/22 17:35:59 满24小时并留出统计延迟后，重查固定窗口、更新收尾文档、结束 r2-isr 自动观察。
- [ ] 验收结束后推送本轮文档提交并核对自动部署；此前只本地提交，保留当前 build 的观察窗口。

历史全部爆量的归因边界保留在收尾记录，不再作为本轮代码任务。无关文章与产品 WIP 保持原样。
