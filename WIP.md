# 当前开发任务 (WIP)

任务完成后，请清理本项目，将重要约定并入 `DEV_NOTE.md` 或 `README.md`。

Issue #4 SEO 恢复 & sitemap 清理　|　分支 `feat/seo-recovery-issue-4`
https://github.com/meathill/blog-2026/issues/4

## 待办事项

### Workstream A — 仓库 SEO 基建（代码）✅ 完成 + 测试通过
- [x] A1 新鲜度：`WPPost.modified`；sitemap `lastModified` 用 modified；PostHeader「更新于」（晚于发布 1 天才显示）；OG `modifiedTime`
- [x] A2 JSON-LD：`src/lib/seo/jsonld.ts`（BlogPosting / BreadcrumbList / FAQPage），在 `PostView` 注入
- [x] A3 相关文章：`selectRelatedPosts`（post-utils）+ `src/components/posts/related-posts.tsx`（标签优先、分类兜底），复用 `PostCard`
- [x] A4 FAQ：`extractFaq`（约定 `<h2>常见问题（FAQ）</h2>` + h3/p），喂 FAQPage
- [x] A5 noindex：tag(±分页)/author(±分页)/search/posts 分页/category 分页/attachment → `noindex,follow`
- [x] A6 sitemap：移除 tag 页　[x] A7 robots：disallow `/search`
- [x] 单测：jsonld、post-utils(+extractFaq/+selectRelatedPosts)、sitemap(改断言无 tag)

### Workstream B — 6 篇文案（wp-cli 服务器执行）✅ 脚本就绪，待用户在服务器跑
- [x] `scripts/seo/`：manifest.json（title/excerpt/FAQ/互链）+ apply.php（幂等、dry-run、不改 slug）+ export-current/restore.php + README
- [ ] 用户在服务器执行：`export-current.php` → `apply.php`（dry-run）→ `SEO_APPLY=1 apply.php`

### Workstream C — GSC + 服务器清理 ✅ 文档/片段就绪，待用户执行
- [x] `docs/seo-gsc-cleanup.md`（删历史 sitemap 清单 + 验证 + 指标）
- [x] `scripts/seo/server/`（nginx/apache：301 旧前台 HTML、410 旧 sitemap，保留 /wp-json /wp-admin /wp-content；含 noindex 过渡版）
- [ ] 用户执行：GSC 删历史 sitemap；服务器停旧 sitemap 插件 + 应用收敛片段

## 决策记录（与原计划的偏差）
- **i18n**：文章页 UI 子树（PostView/PostHeader/PostCard）本就硬编码中文（"分钟阅读" 等）、无 next-intl。为与周边一致，"更新于"/"相关文章" 同样硬编码中文，未新增 i18n key。文章页本地化是独立议题。
- **提交粒度**：A 内多文件跨子任务交织（sitemap.ts/PostView.tsx/page.tsx 各含多项），故 A 作为一个连贯提交；B、C 各自独立提交。

## 验收标准
- [x] 测试通过（`pnpm run test:run` 288/288）
- [x] 格式化（`pnpm run format`）、类型检查（`tsc --noEmit` src 0 错；tests 17 项历史遗留）
- [ ] 构建成功（`pnpm run build`）
- [ ] 端到端手动（Rich Results 校验 JSON-LD、查看 noindex、sitemap 无 /tag/）
- [ ] 指标（部署后 28 天窗口）：Top 技术文 4%+ CTR；活跃 sitemap 0 error
