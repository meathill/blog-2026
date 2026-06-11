# 当前开发任务 (WIP)

任务完成后，请清理本项目，将重要约定并入 `DEV_NOTE.md` 或 `README.md`。

## TiDB 降载:blog.meathill.com 边缘收口 + wp-json 缓存(2026-06-11)

计划全文:`~/.claude/plans/tidb-spicy-flute.md`(已批准)。
背景:TiDB 账单暴涨。真正打 DB 的口子:① wp-json 零边缘缓存(WP 发 no-store);② wp-content 缺失文件回落 index.php 启动全量 WP(实测 15s 超时)。

- [ ] 1. 源站 Caddy 修复:@preserve 拆三块(assets 纯静态 / PHP 保留 / feed),部署 + 验证
- [ ] 2. scripts/cloudflare/ 工具脚本(inventory / apply / rollback,幂等,快照)
- [ ] 3. inventory 盘点(**需用户创建 CLOUDFLARE_API_TOKEN**,权限清单见 scripts/cloudflare/README.md)
- [ ] 4. Cache Rule:wp-json 边缘缓存 600s(override_origin,排除 authorization)
- [ ] 5. WAF Rule:block 非 uploads 的 /wp-content/*
- [ ] 6. 边缘 feed 例外 → 修复 meathill.com/feed(当前 500,自 2026-06-05 起,blog/feed 被边缘 301 所致)
- [ ] 7. Access 全量收口 /wp-json(决策树 Case A-D,预检后执行,最后做)
- [ ] 8. 收尾:Smart Tiered Cache、DEV_NOTE、memory、清理本文件

发现(不在本次范围):wp-cron.php 被边缘 301 → WP loopback cron 失效(定时发布等),DEV_NOTE 提醒。

## 遗留:Issue #4 SEO(代码与服务器侧已完成)

仍需用户手动:
- [ ] **GSC**:删 6 份历史 sitemap 条目(Search Console UI;API 不支持删除);重新提交活跃 sitemap
- [ ] 可选:Jetpack 关掉 XML sitemaps(origin 已 410,非必须)

待验证:
- [ ] 端到端:Rich Results Test 校验 BlogPosting/Breadcrumb/(FAQ);tag/search 有 noindex;`/sitemap.xml` 不含 `/tag/`
- [ ] 部署后 GSC:活跃 sitemap 0 error 且被抓取;blog.* 重复 URL 递减
- [ ] 指标(28 天窗口,至 2026-07-03):Top 技术文回到 4%+ CTR
