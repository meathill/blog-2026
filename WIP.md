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
