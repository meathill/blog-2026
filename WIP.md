# 当前开发任务 (WIP)

任务完成后，请清理本项目，将重要约定并入 `DEV_NOTE.md` 或 `README.md`。

Issue #4 SEO 恢复 & sitemap 清理　|　分支 `feat/seo-recovery-issue-4`
https://github.com/meathill/blog-2026/issues/4

## 代码部分 ✅ 已完成（format / typecheck / test 288 / build 全通过）
仓库 SEO 基建（新鲜度、JSON-LD、相关文章、FAQ、noindex、sitemap 收口）+ wp-cli 文案脚本 + GSC/服务器清理文档/片段。durable 约定已并入 `DEV_NOTE.md`「SEO 约定」。

## 服务器侧（2026-06-05 已由 AI 在 34.177.119.169 执行完成）
- [x] **WordPress 内容**：`runner.php`(无 WP-CLI) 跑 `apply.php`，6 篇 title/excerpt/FAQ/互链更新 + `verify.php` 通过；备份 `~/seo-backup-20260605`
- [x] **服务器收敛**：装 `blog-redirect.Caddyfile`（admin off → restart 生效），origin 410 旧 sitemap + 301 历史 URL + 保住 /wp-json /wp-content；meathill.com 全程 200
- 发现：Cloudflare 边缘已有 blog→meathill 跳转，origin 规则为纵深防御

## 仍需用户手动（我无法代劳）
- [ ] **GSC**：删 6 份历史 sitemap 条目（Search Console UI；API 不支持删除）；重新提交活跃 sitemap
- [ ] 可选：Cloudflare 清缓存；Jetpack 关掉 XML sitemaps（origin 已 410，非必须）

## 待验证
- [ ] 端到端：开一篇文章用 Rich Results Test 校验 BlogPosting/Breadcrumb/(FAQ)；查看 tag/search 输出 noindex；`/sitemap.xml` 不含 `/tag/`
- [ ] 部署后 GSC：活跃 sitemap 0 error 且被抓取；blog.* 重复 URL 递减
- [ ] 指标（28 天窗口）：Top 技术文回到 4%+ CTR（主要靠文案更新）

> 全部线下动作完成、指标确认后，可删除本 WIP.md（约定已在 DEV_NOTE.md）。
