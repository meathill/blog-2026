# 开发笔记

记录需要长期关注的工程约定与关键设计。

## 运行时与部署

- 运行时：Node.js（Cloudflare `nodejs_compat`）
- 部署：OpenNext + Cloudflare Workers
- 数据：
  - WordPress（内容主源）
  - D1（后台数据与同步备份）

博文写作与发布有两条链路：

1. **后台编辑器（推荐）**：使用 `/admin/blog` 内置的 BlockNote 编辑器。文章内容以 Block JSON 格式存储在 D1，同时生成 Markdown/HTML 快照，并同步至 WordPress。
2. **Notion 同步（遗留）**：`Notion -> D1 备份 -> WordPress`。适用于批量迁移或习惯 Notion 写作的场景。

时间规则：

- 当 `published_at` 为空时，视为待首次发布
- 仅当 `last_update_time > published_at + 60s` 才重新同步

## 代码组织

### WordPress 模块

`src/lib/wordpress/`：

- `client.ts`：请求与认证
- `posts.ts`：文章与媒体
- `taxonomies.ts`：分类与标签
- `types.ts`：类型定义
- `index.ts`：统一导出

### 测试

- 测试目录统一为 `tests/`
- 使用 `vitest.config.ts` 控制 include 与 coverage

## 已落地特性

- 动态 OG 图：`src/app/api/og/post/route.tsx`
- 旧链接重定向：`src/middleware.ts`
- 博客后台编辑器：`/admin/blog`，支持 AI 元数据生成。
- 博客后台搜索 + WordPress 老文章导入：`/admin/blog` 支持按标题/Slug/摘要搜索本地 D1 文章；
  有搜索词时联合搜索 WordPress，展示尚未导入本地的老文章，点「导入并编辑」写入 D1（`wpPostId` 已关联）
  后跳转编辑器；后续编辑发布走既有的 D1→WP 同步（`syncBlogPostToWordPress` 见 `wpPostId` 会走
  update 而非 create），不需要单独的"同步回 WordPress"逻辑。
- 性能优化：第三方脚本延迟加载、首页图片 loader 适配。
- 代码块编辑器增强：语言选择、文件名标注、mermaid 图表（编辑器内实时预览 + 发布页渲染成图），
  详见「已知限制与解法」的「代码块 codeBlock 是本地 fork」条目。

## 关键设计策略

### AI 服务

统一通过 `AI_MODEL` 环境变量控制 provider。
- `gemini*`：使用 `@google/genai`。
- 其他：使用 `openai` SDK（兼容 OpenAI 格式的代理）。

### 性能优化 (Web Vitals)

- **第三方脚本**：Google Adsense/GA 等脚本在 `ThirdPartyScripts` 组件中延迟加载。在用户滚动超过首屏或空闲时才注入。
- **图片加载**：全站 `next/image` 使用自定义 `image-loader.ts`，对接 Cloudflare 的 `/cdn-cgi/image/` 路径，实现边缘裁剪与格式转换。

### 环境变量

- `NEXT_PUBLIC_` 变量：应在构建时提供，以便注入代码。同时在 `wrangler.jsonc` 的 `vars` 中保留一份记录，方便在 Cloudflare Dashboard 管理。
- **运行时变量/Secrets**：通过 `getCloudflareContext()` 获取。

## 维护约定

- 优先抽离重复业务逻辑，再考虑样式层重构
- 基础 UI 封装（`src/components/ui/*`）视为设计系统层，非必要不频繁改动
- 大改动前先补测试，再落代码

## 数据库迁移（D1 + Drizzle）

- **迁移以 `migrations/*.sql` 文件 + wrangler 为准，不是 drizzle journal**。历史上 journal
  （`migrations/meta/_journal.json`）只更新到 `0004`，但 `0005`/`0006` 等文件已通过
  `wrangler d1 migrations apply` 应用。因此**不要跑 `drizzle-kit generate`**（会按 0004 快照重新 diff，
  生成重复建表语句导致 apply 失败）。新增列时**手写下一个 `NNNN_xxx.sql`**（ALTER TABLE …，
  用 `--> statement-breakpoint` 分隔），再 `pnpm db:migrate:local` / `db:migrate:prod` 应用。
- `apps.featured`（boolean/integer）+ `apps.sort_order`（integer）于 `0006_app_featured.sql` 加入，
  用于首页「重点产品」：`getCachedFeaturedApps` 取 `featured=1` 按 `sort_order` 排序（缓存 15min，
  发布后用 `revalidateAfterAppMutation` 失效）。后台 `/admin/apps` 可勾选 Featured + 设排序。

## 已知限制与解法

### 代码块 codeBlock 是本地 fork（语言/文件名/mermaid，2026-07-20）

`src/lib/blog-code-block.ts` 整份 fork 自 `@blocknote/core` 的 `src/blocks/Code/block.ts`（用
`createBlockConfig`/`createBlockSpec`/`createExtension`/`getLanguageId` 这些公开导出搭的，不是碰内部私有
API）。原因：BlockNote 的 `createCodeBlockSpec()` propSchema 写死只有 `language`，没有扩展点，加不了
`filename` 字段，只能整份 fork 才能塞进文件名 UI + mermaid 实时预览面板。**没有复用上游的
`lazyShikiPlugin`**：它要求显式传 `createHighlighter`，本项目从未配置过，一直是空转 no-op，去掉不算功能
倒退，也省得引入 shiki 依赖。

- **BlockNote 精确锁定在 `0.51.4`，没跟到 `0.52.0`**：`0.52.0`（发布于同一天）把 `codeBlock` 的
  `content` 类型从 `"inline"` 改成新引入的 `"plain"`（字符串），官方自己标注「breaking-ish」。这正是
  fork 的那个块类型，以后升级 BlockNote 到 `0.52+` 时，需要把 `blog-code-block.ts` 的
  `content`/`parseContent` 从 inline-array 语义迁移到 plain-string 语义，重新对比一遍上游
  `Code/block.ts` 的改动，不能直接改版本号了事。
- 语言 id 直接对齐 highlight.js 自己的语言名（`src/config/code-block-languages.ts` 和
  `src/config/highlight-languages.json`/`CodeHighlight.tsx` 的 `ALIASES` 共用同一套词表），编辑器和
  前端高亮之间不设翻译层。默认语言 key 保留 BlockNote 自己的硬编码值 `'text'`（没有改成
  `'plaintext'`），避免历史草稿/文章重新打开编辑器时下拉选项错位。
- **`mermaid` 只在浏览器端动态 import**（`src/lib/mermaid-render.ts`，`import('mermaid')` 在
  `'use client'` 组件的 `useEffect`/DOM 事件回调里触发），不会被 Cloudflare Workers 运行时求值，不会
  踩 `turndown` 那种 CJS-under-Workers 的坑（见下面「HTML → Markdown 转换」条目）。
- 文件名走 `data-filename` 属性 + CSS `::before`（`pre[data-filename]::before`），复用了
  `.wp-block-code[title]::before` 已有的视觉方案（同一份声明块，只有 `content: attr(...)` 不同）。

### 动态 OG 图（next/og + Cloudflare IMAGES binding）

实现位置：`src/app/api/og/post/route.tsx`

两个关键约束需要在 Worker 内同时处理：

1. **Satori 不支持 WebP**：`next/og` 底层 Satori 只接受 PNG/JPEG。WordPress featured image 经常是 WebP，必须先转码再喂给 Satori。
2. **`global_fetch_strictly_public` 禁止子请求回打同 zone CDN**：所以**不能**用 `https://blog.meathill.com/cdn-cgi/image/...` 这种 URL；得改用 `env.IMAGES` binding 在 Worker 内直接转码。

#### 输入侧（喂给 Satori 的封面图）

```ts
env.IMAGES.input(stream)
  .transform({ width: 1200, height: 630, fit: 'cover' })
  .output({ format: 'image/png' })
```

裁到 1200×630（OG 画布尺寸）省 base64 体积和 Satori 解码内存。

#### 输出侧（最终响应给社交平台）

`next/og` 的 `ImageResponse` **始终输出 PNG**，没有参数能改。带照片的 1200×630 合成图 PNG 普遍 ~1MB，超过 WhatsApp 300KB 严格上限会触发预览降级（不带图甚至不显示卡片）。

解法：把 `ImageResponse` 的 PNG 再走一次 IMAGES binding 转 JPEG@82：

```ts
const transformed = await env.IMAGES.input(pngStream).output({
  format: 'image/jpeg', quality: 82,
});
return new Response(transformed.image(), {
  headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': '...' },
});
```

实测体积可降到 150–280KB，稳过各家平台。

#### 各平台 OG 图体积红线（参考）

- WhatsApp：< 300KB（严格）/ < 600KB（推荐）——最严
- Twitter/X：< 5MB
- Facebook：< 8MB
- LinkedIn：< 5MB

按 WhatsApp 卡线就够了。

### Feed 代理

站内 RSS feed 通过 `src/app/feed/[[...path]]/route.ts` 代理到源站 WordPress：

- 从 `WORDPRESS_API_URL` 推导 origin（取 `new URL(apiUrl).origin`）
- 中间件将 `/tag/xxx/feed` 等路径 rewrite 为 `/feed/tag/xxx`
- 回源 URL 用**无尾斜杠**形态（`/feed`、`/tag/x/feed`）：带斜杠会触发 WP canonical 301
  （且 origin 不知道自己在 https 后面，Location 是 `http://`），Worker fetch 跟随不可靠
- ⚠️ **route 不能 `export const runtime = 'edge'`**：OpenNext Cloudflare 只打包 Node runtime
  路由，edge runtime 的 route 不进产物，线上变成裸 500（2026-06-11 踩坑，feed 自迁移
  OpenNext 起就因此是坏的）

### HTML → Markdown 转换：不要用 turndown（Workers 下会崩）

`src/lib/blog-html-to-markdown.ts`（WordPress 老文章导入用，把 `content.rendered` 转成 Markdown
再喂给已有的 `buildDraftContentFromMarkdown`）踩过的坑：

- **`turndown` 在这个项目里跑不起来**：它内部靠 `@mixmark-io/domino`（一个 DOM 实现）解析 HTML，
  而 `turndown` 的 `.mjs`/`.es.js` 构建产物里是用 CommonJS `require('@mixmark-io/domino')` 引入的——
  Cloudflare Workers 是纯 ESM 运行时，没有全局 `require`，会在 Worker 启动/首次调用时直接抛
  `ReferenceError: require is not defined`（有对应的 Cloudflare 官方 issue 可查）。`jsdom` 在
  `package.json` 里只是 `devDependencies`（Vitest 测试环境用），业务代码从不 import，同理不能拿来
  垫 DOM。
- **改用 `node-html-parser`**：纯 JS 实现（依赖只有 `css-select`/`entities`，同一类库 `cheerio` 也在用），
  ESM 构建产物里没有 `require()`，`pnpm run build` + `opennextjs-cloudflare build` 都验证过能正常打包。
  给出一棵可递归遍历的树，写法上和仓库里已有的 `markdownToBlocks`（`src/lib/mcp/blog-draft.ts`，
  遍历 `marked.lexer()` 的 token）风格一致，只是遍历对象换成 HTML 节点。
- **坑：`<pre>` 是 node-html-parser 的 "block text element"**（和 `script`/`style` 同类），默认不会把
  `<pre>` 内部解析成子节点——`pre.text` 拿到的是**未解析的原始字符串**（`<code class="...">` 标签本身
  还是字面字符）。要拿到里面 `<code>` 的语言 class/纯文本，得把 `pre.text` 再 `parse()` 一遍。
- 一般 HTML→Markdown 库都需要新增依赖，且大概率隐式依赖某种 DOM 实现——引入前先确认它在
  Workers 环境（ESM-only、无 DOM）下能不能跑，不要只看 npm 周下载量。

### wp_post_id 唯一约束：SQLite 的 UNIQUE 允许多个 NULL

`blog_posts.wp_post_id`（`schema.ts`）加 `.unique()` 防止同一篇 WordPress 文章被并发导入两次，
不需要额外写"部分唯一索引"（`WHERE wp_post_id IS NOT NULL`）——SQLite 的 `UNIQUE` 约束本来就把
每一个 `NULL` 当作互不相同的值处理，所以本地新建的草稿（`wp_post_id` 全部是 `NULL`）不会互相冲突，
只有两个真正相同的非空 `wp_post_id` 才会撞上唯一约束。踩坑记录：曾经以为需要部分索引，其实用不上。

### Middleware 是 async

`src/middleware.ts` 现在是 `async function`（为支持 `?attachment_id` 的 fetch 调用）。
测试中需要 `await middleware(req)`。

### 公共常量

`SITE_URL` 统一从 `src/lib/constants.ts` 导出，避免各文件重复写 `process.env.NEXT_PUBLIC_SITE_URL || '...'`。

## SEO 约定（Issue #4）

- **结构化数据**：`src/lib/seo/jsonld.ts` 提供 `buildArticleJsonLd`(BlogPosting) / `buildBreadcrumbJsonLd` / `buildFaqJsonLd`，在 `PostView` 以 `<script type="application/ld+json">` 注入（写法对齐 skills 详情页）。JSON-LD 的 `url`/面包屑须与页面 canonical 一致（按 `post.categories[0]` 取主分类）。
- **FAQ 富结果约定**：文章正文里 `<h2>常见问题（FAQ）</h2>` + 若干 `<h3>`问 `<p>`答，会被 `extractFaq`（`src/lib/post-utils.ts`）解析成 FAQPage；无该区块则不注入。写文案时遵守此结构即可自动出富结果。
- **新鲜度**：`WPPost.modified`（WP REST 默认返回）驱动 sitemap `lastModified`、文章页「更新于」（晚于发布 1 天才显示）、OG `modifiedTime`、JSON-LD `dateModified`。
- **noindex 策略**：tag / 作者归档 / search / 分页归档（`/page/N`）/ 分类分页一律 `robots: { index:false, follow:true }`；分类首页、`/posts` 归档首页保留索引。
- **attachment**：`/posts/.../attachment/...` **301 到父文**（不再渲染可索引页）；blog 源站 Caddy/nginx/htaccess 对 `*.html/attachment*` 同样 301 到父文路径。
- **meta description**：`buildPostDescription` **优先非空 excerpt**（≥20 字即可），截断 160；勿再要求 ≥110，否则 SEO 摘要会被正文开头顶掉。
- **站内文章链**：列表/卡片用 `getPostPath(post)` → `/posts/{category}/{slug}`，与 canonical/sitemap 一致。
- **sitemap 收口**：`src/app/sitemap.ts` 不再收录 tag 页（薄内容）；robots 额外 disallow `/search`。
- **内容日历**：`docs/blog-topics-2026-q3.md`（一周两篇 + 直播联动）。
- **内容文案更新链路**：历史文章在 WordPress，用 `scripts/seo/`（wp-cli `eval-file`，幂等、dry-run、不改 slug）在服务器更新 title/excerpt + 插入 FAQ/延伸阅读。meta description 来自 `post.excerpt`（`buildPostDescription`）。
- ⚠️ **`blog.meathill.com` 双角色**：既是历史公开站，又是 meathill.com 的 REST API 后端 + 媒体源。做旧站收敛（301/410/noindex，见 `scripts/seo/server/` 与 `docs/seo-gsc-cleanup.md`）时必须保留 `/wp-json/`、`/wp-admin/`、`/wp-content/`。
- **GSC 清理**：GSC MCP 只能 list/submit、不能删 sitemap；历史 sitemap 退役按 `docs/seo-gsc-cleanup.md` 手动执行。

### Issue #5 增补

- **首页结构化数据**：`buildOrganizationJsonLd` / `buildWebSiteJsonLd`（含 SearchAction）只注入首页（Google 建议），Organization 通过 `@id: /#organization` 被 WebSite 引用。
- **IndexNow**：发文/改文后手动 `pnpm indexnow -- /posts/{category}/{slug}`，或 `pnpm indexnow -- --since 3` 按 sitemap lastmod 批量提交。key 文件在 `public/<key>.txt`，按协议本就公开、不进 .env；key 常量在 `scripts/indexnow-submit.ts` 顶部，与文件漂移会报错。
- **站点级 OG 图**：`/api/og/home`（英文文案——Satori 默认字体无 CJK 字形），根 layout 的 openGraph/twitter 引用它；文章页仍走 `/api/og/post`。
- **localeCookie 已关**（`src/i18n/routing.ts`）：`localeDetection: false` 下 NEXT_LOCALE cookie 无用途，且 set-cookie 会让响应 `no-store`——边缘缓存失效 + bfcache 被禁。语言切换纯 URL 驱动，勿再引入 cookie。
- **正文更新链路**：整篇替换走 `scripts/seo/content/<slug>.html` + `apply-content.php`（守卫见 `scripts/seo/README.md`）；批量 title/excerpt 走 `export-meta.php` → `analyze-meta.ts` → `meta-manifest.json` → `apply-meta.php`。

## TiDB 降载与 blog.meathill.com 边缘收口（2026-06-11）

WP 的 DB 在 TiDB Cloud，账单暴涨后做的收口。脚本与权限清单见 `scripts/cloudflare/README.md`。

**当时真正打 TiDB 的两个口子（已堵）：**
1. wp-json 零边缘缓存（WP 对 REST 发 `no-store`）→ Cache Rule `blog2026_wpjson_edge_cache`
   override_origin **24h**（override 完全无视 origin cache-control，官方文档已核实），
   排除带 `authorization` 头的请求；404 缓存 5 分钟，401/403/5xx 绝不缓存
   （Access 拒绝页缓存住会把合法 Worker 一起挡掉）。
   TTL 为什么这么长：origin 日志实测（2026-06-11，12 分钟窗口 67 次回源 66 个唯一 URL）
   证明回源全是 Worker 渲染的**长尾唯一 URL**（每篇 slug、每个 tag/分类页、sitemap 分页），
   重复回源≈0，短 TTL 无意义；24h 让每个唯一 URL 每天最多打一次 TiDB。
2. wp-content 缺失文件经 Caddy `php_fastcgi` try_files 回落 index.php → 全量 WP 启动打 DB
   （bot 探测一次 = 15s 超时）→ Caddy 把 `/wp-content/*`、`/wp-includes/*` 改纯 `file_server`，
   缺失文件 4ms 静态 404。

**边缘规则现状（zone meathill.com）：**
- Single Redirect `blog -> @`：blog 全路径 301 到 meathill.com（保 SEO），例外：`/wp-json/`、
  `/wp-content/`、`/feed` 与 `/feed/` 结尾（RSS 代理依赖）。
- WAF `blog2026_wpcontent_lockdown`：block 非 uploads 的 `/wp-content/*`（封插件/主题探测）。
  ⚠️ 将来要用 wp-admin 后台需先撤此规则。
- WAF `blog2026_mainsite_scanner_block`：meathill.com 上备份/配置文件后缀
  （php/sql/bak/env/sh/gz…）、`/.git`、`.env`、`/wp-` 前缀 → 403。
  背景：漏洞扫描器 45 分钟扫了 1214 个唯一垃圾路径，每个被 catch-all 路由放大成
  2~3 个 WP 查询且 URL 唯一、缓存无法吸收（= RU 尖刺的来源）。WAF 在 Worker
  **之前**执行，403 = 零渲染零 DB。⚠️ 后缀集合不能加 xml/txt/js/css（主站合法后缀）。
- Cache Rule `blog2026_feed_edge_cache`：blog 的 `*/feed` 边缘缓存 **30d**（RSS 阅读器
  仍订着 blog 老地址直连，实测 4h 138 次全量 WP 渲染）。时效靠 purge-on-publish。
- **wp-json 全量在 Cloudflare Access 后面**（app "blog api"，destinations `/wp-json` + `/wp-json/*`，
  service token policy "Allow worker"，`service_auth_401_redirect: true`）。只有带 service token 的
  Worker 能调用，匿名 401。Access 在 Cache 之前执行，带 token 的请求照常命中边缘缓存。
  ⚠️ Access destinations 不得覆盖 `/feed*`、`/wp-content/uploads*`（都是匿名 fetch）。
- Smart Tiered Cache 已开。

**WP 对象缓存(2026-06-12,APCu drop-in):**
- TiDB SQL 统计定位单请求 ~100+ RU:autoload 全量读(30 RU/次,每请求一次)+
  逐条 options/terms/postmeta 重复读 → 装 `php8.5-apcu` + `scripts/wp/object-cache.php`
  部署到 `wp-content/object-cache.php`,重复读走本机共享内存。
- ⚠️ CLI(runner.php)下 APCu 禁用,drop-in 自动退化;**CLI 改库后要
  `systemctl restart php8.5-fpm`** 使 FPM 侧缓存失效。
- 回滚:删 `wp-content/object-cache.php` + 重启 FPM。
- **持久连接(2026-06-12)**:`DB_HOST` 改为 `p:gateway01...`(mysqli 持久连接,
  FPM 每 worker 复用)。效果:wp-json 时延 1.3s → 0.3s(省掉每请求对 TiDB 网关的
  TLS+会话初始化;serverless 对新连接的会话开销按 RU 计费,是 SQL 之外 RU 的主要
  嫌疑)。备份 `wp-config.php.bak-pconn`;回滚 = 还原 + 重启 FPM。
  ⚠️ 排查时实测:服务器→TiDB RTT 仅 ~13ms(同在美西),单查询很便宜,贵在连接。

**Application Passwords 401(2026-07-16,is_ssl() 反代坑):**
- 症状:后台发布 / Notion 同步 WordPress 报 `WordPress Auth Failed: 401 rest_not_logged_in`,
  `WP_APP_PASSWORD` 本身未改、未撤销。
- 根因:`wp_is_application_passwords_supported() = is_ssl() || environment==='local'`。链路是
  `Cloudflare(边缘 TLS)→ Tunnel → Caddy(auto_https off,纯 HTTP :8080)→ PHP-FPM`,Caddy 的
  `php_fastcgi` 会按自己的连接状态派生 `HTTPS`/`X-Forwarded-Proto` 这两个 FastCGI 参数,
  **`header_up` 改不动**(Caddy 对 `X-Forwarded-*` 有自己的覆盖逻辑,不管上游传了什么,PHP 收到的
  永远是 http)。于是 `is_ssl()` 恒为 false,Application Passwords 被核心整体关掉,任何 Basic Auth
  请求在校验凭证前就被拒——凭证本身完全没问题。
- 修复:`php_fastcgi` 块里用 **`env HTTPS on` + `env HTTP_X_FORWARDED_PROTO https`** 直接覆盖
  FastCGI 参数(见 `scripts/seo/server/blog-redirect.Caddyfile`);wp-config.php 层面加
  X-Forwarded-Proto 判断没用(已删除,Caddy 直接给 HTTPS=on 更权威)。
- ⚠️ 排查坑:这版 WP(6.9)里 `determine_current_user` 真正挂的是 `wp_validate_application_password`
  (不是 `wp_authenticate_application_password`),它把内部具体的 `WP_Error`(如
  `incorrect_password`)**全部吞掉**,统一对外报 `rest_not_logged_in`——"密码错" 和 "功能被关掉"
  从外部完全看不出区别,拿错密码测试区分不出问题在哪层,得直接调用
  `wp_authenticate_application_password()` 才能看到真实校验结果。

**WordPress 核心 RCE 补丁(2026-07-20,CVE-2026-63030「wp2shell」+ CVE-2026-60137):**
- 未授权(无需登录)远程代码执行漏洞链,REST API batch 接口路由混淆 + SQL 注入,影响
  6.9.0–6.9.4 / 7.0.0–7.0.1,官方 2026-07-17 发 6.9.5/7.0.2 修复,披露后几小时内即有在野利用。
  服务器当时是 6.9.0 基线(6.9.1~6.9.4 点版本从未打过),确认过暴露。
- **根因**:点版本从未自动打过,是因为 WP 的"次要/安全版本自动后台更新"机制依赖
  wp-cron,而 wp-cron 早就被边缘 301 打断了(见下一条)——不是谁忘了升级,是自动更新
  本身从来没跑起来过。
- 处理:装 wp-cli(见下)→ 备份(`/var/www/backups/2026-07-20-wp-6.9.5/`,DB dump + 
  wp-admin/wp-includes/根 PHP 打包)→ `wp core update --version=6.9.5`(锁同分支,不跳
  7.0 大版本)→ `wp core update-db`(无 schema 变更,空跑)→ 重启 php8.5-fpm → 
  `wp core verify-checksums` 确认核心文件干净。7.0 大版本升级留作单独任务
  (仓库还装了 `gutenberg` 功能插件,叠加大版本升级排查面更大)。
- **服务器现在装了 wp-cli**(`/usr/local/bin/wp` 2.12.0)。以后核心/插件/主题更新、DB
  迁移都优先用 `sudo -u www-data wp ... --path=/var/www/blog`,不必再绕
  `scripts/seo/runner.php` 那套裸 `wp-load.php` + `WP_CLI` shim(那套仍保留给
  SEO 文案脚本用,两者不冲突)。
- ⚠️ `wp db export`/`wp core update` 会在 `/var/www/.wp-cli/cache/` 建缓存目录,
  www-data 对 `/var/www` 本身无写权限,会报 permission warning(不影响功能,未处理)。
- 验证 Application Passwords 401 修复(见上)没被这次核心更新带崩:直接在服务器 CLI 跑
  `is_ssl()` 测不出真实结果(裸 CLI 天然没有 HTTPS 概念,当初就是这个坑),得走真实
  Caddy→FPM 请求路径测,且 Caddy 只把 `/wp-json* /wp-admin* /wp-login.php /wp-cron.php
  /xmlrpc.php /.well-known*` 这几个 path 转给 PHP(见 Caddyfile `@preserve`),其余一律
  redirect——改用确认 Caddyfile 里两处 `env HTTPS on` 仍在 + Caddy 自 07-16 至今没重启过,
  等价证明这个修复没受影响。
- 取证:管理员账号只有 `meathill` 一个(2011 注册,无新增);`wp-admin`/`wp-includes`
  在漏洞披露后无文件改动;access log 里搜 `batch` 无命中(但日志 50MiB 滚动,窗口不保证
  覆盖完整披露期,只能算辅助信号,不是确凿的"未失陷"证明)。
- 顺带更新了插件(akismet 5.7、gutenberg 23.5.3、jetpack 16.0.1、jetpack-boost 4.6.3、
  wp-super-cache 3.1.1),更新前打包备份到 `/var/www/backups/2026-07-20-plugins/`。
  `code-syntax-block`/`foodpack` 已是最新;`uyan` 目前是 inactive 状态,未更新。
- **`foodpack`/`code-syntax-block` 已 deactivate**(未删除文件,仅停用)。核实
  `code-syntax-block` 安全:全站发布文章走 `wp_posts.post_content` 搜索,匹配
  `wp:code-syntax*`/`class="code-syntax*` 均 0 条,没有任何已发布文章真正用过这个插件注册的
  block;`wp-block-code`(165 条)是 WordPress **核心自带**的 Code block,和这个第三方插件无关。
  代码高亮实际由前端 `highlight.js` 独立处理(见 `src/lib/wordpress/posts.ts` 的
  `processContent`),不依赖 WP 侧插件输出的 markup/CSS。
  ⚠️ 但 `PostView.tsx` 仍然直接渲染 `post.content.rendered`(wp-json 返回的服务端渲染 HTML)——
  "前端渲染不依赖 WP 了"**只对 code-syntax-block 这个具体插件成立**,WordPress 本身仍是文章
  正文内容的来源,不要泛化到"WP 插件都能随便删"。
- **核心版本决定(2026-07-20)**:暂不升级到 7.0.x,等 **7.2** 前后再评估,除非官方提前终止
  6.x 分支的安全维护(WP 历来对旧大版本长期出安全补丁,目前没有 6.x 停止维护的迹象)。

**坑与约定：**
- Rulesets API 的 `PUT entrypoint` 会**替换整个 rules 数组**，必须 GET→按 `ref` 合并→PUT
  （脚本已封装，规则 ref：`blog2026_*`）。
- Page Rules 接口不支持 account-owned token（盘点脚本已做非致命处理）。
- wrangler 走系统代理会连不上 Cloudflare API，跑 wrangler/部署前 `env -u HTTPS_PROXY ...` 清代理；
  多账号 OAuth 需 `CLOUDFLARE_ACCOUNT_ID=fdc63ee...` 跳过交互选择。
- **wp-cron.php 被边缘 301，WP loopback cron 已失效**（定时发布等）。⚠️ 服务器上**没有
  cron 守护进程**（Ubuntu 26.04 上 `crontab` 命令都不存在，只有 systemd timers，`/etc/cron.d`
  下的文件是死的没人处理）。**2026-07-20 已恢复**：`/etc/systemd/system/wp-cron.{service,timer}`，
  每 15 分钟 `curl -H "Host: blog.meathill.com" http://127.0.0.1:8080/wp-cron.php`
  （`systemctl list-timers wp-cron.timer` 查下次触发时间；`enable --now` 已生效，开机自启）。
  这样 WP 核心的"次要/安全版本自动后台更新"也能重新工作，理论上以后同类安全点版本
  不必再手动 SSH 介入。
- 发布时效：边缘 wp-json 24h / feed 30d + ISR 300s——时效由 **purge-on-publish** 保证
  （publishBlogPost 成功后自动 `purge_everything`，secret `CLOUDFLARE_PURGE_TOKEN`，
  失败不阻断发布、toast 提醒手动 Purge Everything）。
- Worker 每次 deploy 会换 build id → ISR 缓存整体失效 → 部署后有一波回源/RU 尖峰;
  wp-json 边缘缓存(24h)能吸收大部分,属预期现象。

