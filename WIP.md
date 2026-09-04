# WIP: 处理 issue #6 / #7 / #8

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

