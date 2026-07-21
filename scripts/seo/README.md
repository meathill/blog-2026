# SEO 文章文案更新（Issue #4，wp-cli 在服务器执行）

更新 5(+1) 篇技术文章的 **标题 / meta 描述（excerpt）**，并幂等插入 **FAQ** 与 **延伸阅读（站内互链）** 区块。配合仓库前端改动：FAQ 区块会被 `extractFaq` 解析为 FAQPage 富结果；excerpt 即 meathill.com 的 meta description（见 `src/lib/wordpress/posts.ts` `buildPostDescription`）。

> ⚠️ 这些脚本操作 **生产 WordPress 内容**。请在服务器上、先 dry-run、确认 diff 后再写入。脚本**不修改 slug**，不会影响既有 URL / 排名。

## 前置条件
- 在 WordPress 所在服务器上，且 `wp`（WP-CLI）可用、指向正确站点（`wp option get siteurl` 自检）。
- 把本目录（`scripts/seo/`）传到服务器，或直接在已 checkout 仓库的机器上、于 WordPress 根目录运行。
- 涉及文章（按 `post_name`）：见 `manifest.json`。

> **没有 WP-CLI 的服务器**：用 `runner.php` 直接 bootstrap WordPress 跑同一套脚本（自带 WP_CLI 垫片），无需安装任何外部工具。以能读 `wp-config.php` 的用户运行（通常 `www-data`）：
> ```bash
> scp -r scripts/seo <host>:/tmp/seo            # 上传（含 runner.php / verify.php）
> chmod -R 777 /tmp/seo                          # 让 www-data 能写 backup/
> sudo -u www-data php /tmp/seo/runner.php export-current.php          # 备份
> sudo -u www-data php /tmp/seo/runner.php apply.php                   # dry-run
> sudo -u www-data env SEO_APPLY=1 php /tmp/seo/runner.php apply.php   # 写入
> sudo -u www-data php /tmp/seo/runner.php verify.php                  # 校验
> ```
> WordPress 路径默认 `/var/www/blog`，可用 `WP_PATH` 覆盖。

## 步骤
```bash
# 1) 备份当前内容（写入 scripts/seo/backup/，不入库）
wp eval-file scripts/seo/export-current.php

# 2) 预览将要发生的变更（dry-run，不写库）
wp eval-file scripts/seo/apply.php

# 3) 审阅无误后实际写入
SEO_APPLY=1 wp eval-file scripts/seo/apply.php

# 如需回滚
SEO_APPLY=1 wp eval-file scripts/seo/restore.php
```

## 文件
- `manifest.json` — 数据源：每篇的 `title` / `excerpt` / `faq[]` / `related[]` / `category` / `linkLabel`。**改文案改这里**。
- `apply.php` — 读 manifest，更新 title/excerpt + 幂等插入 FAQ / 延伸阅读区块。默认 dry-run，`SEO_APPLY=1` 才写库。
- `export-current.php` — 备份当前 title/excerpt/content 到 `backup/`。
- `restore.php` — 从 `backup/` 回滚。
- `backup/` — 运行时生成，已 gitignore。

### Issue #5 新增（正文加深 + Bing meta 补全）
- `apply-content.php` — 用 `content/<slug>.html` **整篇替换** post_content。守卫：manifest 有 faq/related 的文章必须保留 marker 区块；新内容变短超 30% 需 `SEO_FORCE=1`。写入会自动 bump `post_modified`（sitemap lastmod 跟着更新）。
- `content/*.html` — 每篇文章的完整新正文，**入库的唯一事实源**，文件名即 slug。改正文改这里，review diff 后再应用。
- `content/source/` — 服务器 export 回来的正文基线（对照用），gitignore。
- `export-meta.php` — 导出全站已发布文章的 title/excerpt/正文摘要到 `backup/meta-<date>.json`。
- `analyze-meta.ts` — 本地分析上述导出，列出 title/description 过短清单并生成 `meta-manifest.json` 骨架。
- `meta-manifest.json` — Bing meta 补全数据源（只含 title/excerpt）。
- `apply-meta.php` — 按 meta-manifest 批量更新 title/excerpt。`SEO_KEEP_MODIFIED=1` 可保留原 post_modified。

### 正文加深逐篇工作流（issue #5）
```bash
# 1) 服务器：导出该篇 raw 正文（export-current.php 覆盖 manifest 内全部文章）
wp eval-file scripts/seo/export-current.php
# 2) 把 backup/<slug>.content.html 传回本地，存为 scripts/seo/content/source/<slug>.html
# 3) 本地编写 scripts/seo/content/<slug>.html（保留 seo:faq / seo:related marker），diff 审阅后提交
# 4) 服务器：再备份一次 → dry-run 审 diff → 写入
wp eval-file scripts/seo/export-current.php
wp eval-file scripts/seo/apply-content.php
SEO_APPLY=1 wp eval-file scripts/seo/apply-content.php
# 5) 本地：提交 IndexNow
pnpm indexnow -- /posts/<category>/<slug>
```

## 幂等与安全
- FAQ / 延伸阅读 用 HTML 注释 marker 包裹（`<!-- seo:faq:start -->` 等），重复运行只替换区块内部，不重复追加。
- 只动 `post_title` / `post_excerpt` / `post_content`，不动 `post_name`（slug）。
- 正文主体（代码、上下文、配图）不在脚本内盲改 —— 那部分更适合在 WP 后台按 manifest 思路人工精修。脚本负责机械、高价值、低风险的 SEO 增益（标题、描述、FAQ、互链）。

## 与前端的衔接
- excerpt → meathill.com 文章 meta description + OG description。
- FAQ 区块（`<h2>常见问题（FAQ）</h2>` + `<h3>`问`<p>`答）→ 被 `extractFaq` 解析，生成 FAQPage JSON-LD。
- 延伸阅读 站内链接为相对路径 `/posts/{category}/{slug}`，与站点规范 URL 一致。
- 文章页另有 `RelatedPosts` 组件按标签/分类自动推荐，与本处手选 cluster 互链互补。
- WordPress 更新后，meathill.com 经 ISR（fetch revalidate 300s / 页面 86400s）刷新。
