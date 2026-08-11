# WIP: 处理 issue #6 / #7 / #8

完整计划见 `~/.claude/plans/https-github-com-meathill-blog-2026-iss-linear-tide.md`。执行模式:主管 + Sonnet subagents 分包,逐项督查验收。

## 任务分解 (TODO)

### Part 0 基线
- [ ] chore(deps): next 升级到 16.3,全量验证(test/typecheck/build)

### Part 1 — #8 区域缓存
- [ ] perf(cloudflare): open-next.config.ts 用 withRegionalCache 包装 R2(long-lived + lazy update),不配 cachePurge(free plan 无 tag purge)

### Part 2 — #6 /tech 内容中心
- [ ] feat(middleware): 放行 /tech 与 4 个 section,保留其余 /tech/* legacy 301
- [ ] feat(seo): 抽取 buildItemListJsonLd,重构 solutions/skills 列表页
- [ ] feat(wordpress): getPosts 支持 slug 数组批量查询
- [ ] feat(tech): 策展数据层 tech.ts / tech-posts.ts + messages + 测试
- [ ] feat(tech): /tech hub 页 + [section] 分类页 + TechSectionCard
- [ ] feat(seo): sitemap 收录 /tech 5 个页面
- [ ] feat(nav): 主导航接入 /tech(注意 D1 navigation_configs 覆盖,部署后需 admin 同步)
- [ ] docs: docs/tech-content-plan.md 全量首批选题大纲(10-12 篇,query-to-page 映射)

### Part 3 — #7 sitemap 清理(外部运维,每步向用户确认)
- [ ] 盘点:GSC/Bing sitemap 清单 + curl 旧入口现状,产出 docs/seo-sitemap-cleanup-2026-08.md,修 DEV_NOTE 悬空引用
- [ ] 源站:核对/应用 Caddy sitemap 410 规则(放行 /wp-json 等),验证各 host 301
- [ ] Bing UI 删除旧 sitemap;GSC 记录淡出策略
- [ ] 评估删除 scripts/seo/server 未用的 nginx/htaccess 片段

### 收尾
- [ ] 全量回归 + push master + 线上抽查 + 三个 issue 留言
