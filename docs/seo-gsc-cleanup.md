# GSC & 服务器 SEO 清理手册（Issue #4）

面向人工执行：清理 Google Search Console 里的历史 sitemap，并在 WordPress 服务器上停掉旧 sitemap、把 `blog.meathill.com` 的历史公开 URL 收敛到 `meathill.com` 规范页。代码改动（noindex / sitemap 收口 / 结构化数据）已在仓库完成，本手册是 **GSC UI + 服务器** 两侧的配套动作。

> GSC 集成只能 list/submit，**不能删除 sitemap**，也改不了 `blog.meathill.com` 服务器，故这部分必须手动 + 服务器执行。

---

## 一、GSC：退役历史 sitemap

Property：`sc-domain:meathill.com`（域名属性，聚合所有子域）。Search Console → Sitemaps。

**保留**
- `https://meathill.com/sitemap.xml` —— 当前活跃（实测 1002 URL / 0 error / 近期被抓取）
- `https://tools.meathill.com/sitemap.xml` —— 工具站，当前在用

**删除**（逐条点开 → 移除 sitemap）
- `https://seo.meathill.com/sitemap.xml` （1 error，2025-08 后未更新）
- `https://blog.meathill.com/sitemap.xml` （2 warnings；旧 WP sitemap，见第二节停用）
- `https://shop.meathill.com/sitemap.xml` （sitemap index，21 warnings/1 error，2020）
- `http://blog.meathill.com/sitemap.xml` （http，2017）
- `http://blog.meathill.com/news-sitemap.xml` （http，2 errors，2017）
- `http://www.meathill.com/wp-content/plugins/simple-google-sitemap-xml/sitemap.xml` （2013）

> 在 GSC 删除只是从报告移除；要让 Google 真正放弃这些 URL，需配合第二节让旧 sitemap 返回 410。

删除后：重新提交 `https://meathill.com/sitemap.xml`（Sitemaps 里再 Add 一次同地址）触发刷新。

---

## 二、服务器：停掉旧 sitemap + 收敛 `blog.meathill.com`

⚠️ **关键约束**：`blog.meathill.com` 同时是 meathill.com 仍在调用的 **REST API 后端 + 媒体源 + 后台**。任何重定向/屏蔽都必须保留：
`/wp-json/`、`/wp-admin/`、`/wp-login.php`、`/wp-content/`、`/wp-includes/`、`xmlrpc.php`。

### 2.1 停用 WordPress 自带 sitemap
```bash
# 登录服务器、在 WP 根目录
wp plugin list --status=active            # 找出产出 sitemap 的插件
# 例如 Google XML Sitemaps / Yoast / simple-google-sitemap-xml 之类：
wp plugin deactivate <sitemap-plugin-slug>
# WordPress 5.5+ 有核心 sitemap（/wp-sitemap.xml），如不需要可关闭：
# add_filter('wp_sitemaps_enabled', '__return_false');  （放主题 functions.php 或 mu-plugin）
```
配合 web server 对 `*sitemap*.xml`、`/news-sitemap.xml` 返回 **410**（见 2.2 片段），确保彻底退役。

### 2.2 收敛历史公开 URL（301）+ 旧 sitemap（410）
配置片段见 `scripts/seo/server/`：
- `blog-redirect.nginx.conf` —— nginx 版
- `blog-redirect.htaccess` —— Apache 版
- `blog-noindex.conf` —— **过渡方案**：不做 301，只对公开前台加 `X-Robots-Tag: noindex`（风险更低，先观察再升级到 301）

规则要点（两版一致）：
1. **先**放行 API/后台/媒体（命中即停，不重定向）。
2. `*sitemap*.xml`、`news-sitemap.xml` → **410**。
3. `/<path>.html/attachment/*` → `https://meathill.com/posts/<path>`（须排在普通 `.html` 规则之前；否则会落到首页兜底）。
4. `/<slug>.html` → `https://meathill.com/posts/<slug>`（Next.js 的 `posts/[...slug]` 会再 301 补全分类路径）。
5. `/category/*`→meathill `/category/*`；`/tag/*`→`/tag/*`；`/author/*`→`/posts/author/*`。
6. 其余公开路径 → `https://meathill.com/`（兜底，避免 301 指向 404）。

> 应用前务必把片段里“保留块”改成与你现有 server 配置一致（fastcgi/proxy 到 PHP-FPM 的写法），并先在测试环境验证。

---

## 三、验证

```bash
# 1) API / 媒体 / 后台未被误伤（应 200）
curl -sI https://blog.meathill.com/wp-json/wp/v2/posts?per_page=1 | head -1
curl -sI https://blog.meathill.com/wp-content/uploads/ | head -1     # 200/403 皆可，关键是非 301
curl -sI https://blog.meathill.com/wp-login.php | head -1

# 2) 历史公开 URL → 301 到 meathill.com
curl -sI https://blog.meathill.com/some-old-post.html | grep -i location

# 3) 旧 sitemap → 410
curl -sI https://blog.meathill.com/sitemap.xml | head -1
curl -sI https://blog.meathill.com/news-sitemap.xml | head -1

# 4) 旧 attachment → 301 到父文（不是首页）
curl -sI https://blog.meathill.com/tech/some-post.html/attachment/image-1 | grep -i location
```

GSC 侧（部署后几天）：
- URL 检查工具抽查规范文章页（应「已编入索引」），tag / attachment 页应识别为 `noindex`。
- `https://meathill.com/sitemap.xml` 的 `lastDownloaded` 刷新、0 error，且不再含 `/tag/` URL。
- 覆盖率报告里 `blog.meathill.com/*` 重复 URL 逐步减少。

---

## 执行记录（2026-06-05，服务器侧已完成）

服务器 `34.177.119.169`（host `vps`）实际架构：**Cloudflare Tunnel → Caddy `:8080` → PHP-FPM 8.5 → WordPress `/var/www/blog`**；无 WP-CLI。

已完成：
- **B 文案**：用 `scripts/seo/runner.php` 跑 `apply.php`，6 篇文章 title/excerpt/FAQ/延伸阅读 全部更新并 `verify.php` 校验通过（excerpt 原为空，现 90–111 字）。备份在服务器 `~/seo-backup-20260605` 与 `/tmp/seo/backup`。
- **C2 服务器收敛**：安装 `scripts/seo/server/blog-redirect.Caddyfile`（origin 纵深防御）。origin 实测：`/wp-json`/媒体/验证文件 200；`*sitemap*.xml` 410；`.html`/`category`/`tag`/`author`/兜底 301。
  - ⚠️ 该 Caddy 含 `admin off`，**用 `systemctl restart caddy`**（非 reload）。原配置备份在 `/etc/caddy/Caddyfile.bak-issue4`，回滚：`sudo cp /etc/caddy/Caddyfile.bak-issue4 /etc/caddy/Caddyfile && sudo systemctl restart caddy`。
  - **Cloudflare 边缘已有 blog→meathill 跳转**：边缘 `/sitemap.xml`、`.html`、`/` 均已 301 到 meathill；origin 规则为冗余保险。旧 sitemap 在边缘以 301 退役（GSC 仍需手动删条目，见第一节）。

仍需手动：
- **C1（GSC）**：删 6 份历史 sitemap 条目——**仅 Search Console UI 可能可点「移除」**；API 不支持删除。若 UI 也无入口/灰掉，只能依赖源站 410 + 时间自然淡出，不必再当阻塞项。
- 可选：Cloudflare 控制台清一次缓存；wp-admin → Jetpack → Traffic 关掉 "Generate XML sitemaps"（origin 已 410，非必须）。

## 执行记录（2026-07-09）

- 仓库：`aa77784` description/attachment/getPostPath；`e117a91` 第 1 周草稿。
- 服务器 `meathill@34.177.119.169`：已覆盖 `/etc/caddy/Caddyfile`（备份 `Caddyfile.bak-issue4-20260709145246`），`systemctl restart caddy`。
  - origin 实测：`/wp-json` 200；`/sitemap.xml` 410；`/tech/...html/attachment/...` → `301 Location: https://meathill.com/posts/tech/...`（父文，非首页）。

## Issue #5 手动操作清单（2026-07-21）

代码侧（首页 canonical/JSON-LD、IndexNow、localeCookie/bfcache、og-image）已入库。以下需人工执行：

### 部署后立即
1. `curl -sI https://meathill.com/` —— 确认响应**不再带 `set-cookie: NEXT_LOCALE`**，cache-control 不再是 `no-store`（localeCookie 关闭生效，bfcache 恢复）。
2. `curl https://meathill.com/a44ae7d8815444ca6d7b7692ab26cf0b.txt` —— 应 200 且内容为 key 本身（IndexNow 验证文件）。
3. `curl -s https://meathill.com/ | grep -o 'ld+json'` —— 首页应有两段 JSON-LD；再用 [Rich Results Test](https://search.google.com/test/rich-results) / validator.schema.org 校验 WebSite/Organization。
4. `curl -sI https://meathill.com/api/og/home` —— 200，image/jpeg（原 /og-image.png 404 的替代）。
5. 首跑 `pnpm indexnow -- --since 30` 做一次批量提交（200/202 均为成功）。

### GSC（已结案，2026-07-21）
6. ~~UI 删除历史 sitemap~~ —— **实测 UI 也没有移除入口**（issue #5 确认）。最终结论：不再尝试删除，依赖源站 410（已就位）+ 时间自然淡出；此项永久关闭，后续不必再碰。
7. GSC 报告里这些条目属展示噪音，不影响 meathill.com 主 sitemap 的抓取与收录。

### Bing Webmaster
8. 确认 meathill.com 已验证、sitemap 已提交；IndexNow 首次提交数日后在「IndexNow」面板确认已收到。

### 内容更新期间（逐篇，配合 scripts/seo/README.md 的工作流）
9. 每篇应用后：GSC URL 检查 → 请求重新编入索引；`pnpm indexnow -- /posts/{category}/{slug}`。
10. 服务器跑 `wp eval-file scripts/seo/export-meta.php`，把 `backup/meta-<date>.json` 传回本地，供 Bing description 补全分析。

### 4–6 周后复盘
11. 以 issue #5 表格为基线（cf-worker-2026：441 展示/14.1 名等）对比 GSC 28 天窗口，回填 issue。

## 四、验收指标（部署 + 清理后，延后测量）
- Top 技术文（Next.js/CF Worker、Hyperdrive、Vercel-vs-CF、R2 等）在之后 28 天窗口回到 **4%+ CTR**（主要由 `scripts/seo/` 文案更新驱动）。
- 活跃 HTTPS sitemap 0 error 且近期被抓取（基本已满足）。
- 低价值归档/附件不再主导 index 噪音（noindex + sitemap 收口 + 旧站收敛共同作用）。
