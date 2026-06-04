# 当前开发任务 (WIP)

任务完成后，请清理本项目，将重要约定并入 `DEV_NOTE.md` 或 `README.md`。

Issue #4 SEO 恢复 & sitemap 清理　|　分支 `feat/seo-recovery-issue-4`
https://github.com/meathill/blog-2026/issues/4

## 代码部分 ✅ 已完成（format / typecheck / test 288 / build 全通过）
仓库 SEO 基建（新鲜度、JSON-LD、相关文章、FAQ、noindex、sitemap 收口）+ wp-cli 文案脚本 + GSC/服务器清理文档/片段。durable 约定已并入 `DEV_NOTE.md`「SEO 约定」。

## 待用户执行的线下动作
- [ ] **WordPress 内容**（服务器，wp-cli）：按 `scripts/seo/README.md`
  - `wp eval-file scripts/seo/export-current.php`（备份）
  - `wp eval-file scripts/seo/apply.php`（dry-run 审阅 6 篇 diff）
  - `SEO_APPLY=1 wp eval-file scripts/seo/apply.php`（写入）
- [ ] **GSC**：按 `docs/seo-gsc-cleanup.md` 删 6 份历史 sitemap，重新提交活跃 sitemap
- [ ] **服务器**：停用 WP 旧 sitemap 插件 + 应用 `scripts/seo/server/` 收敛片段（保留 /wp-json /wp-admin /wp-content）

## 待验证
- [ ] 端到端：开一篇文章用 Rich Results Test 校验 BlogPosting/Breadcrumb/(FAQ)；查看 tag/search 输出 noindex；`/sitemap.xml` 不含 `/tag/`
- [ ] 部署后 GSC：活跃 sitemap 0 error 且被抓取；blog.* 重复 URL 递减
- [ ] 指标（28 天窗口）：Top 技术文回到 4%+ CTR（主要靠文案更新）

> 全部线下动作完成、指标确认后，可删除本 WIP.md（约定已在 DEV_NOTE.md）。
