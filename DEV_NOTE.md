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
- 性能优化：第三方脚本延迟加载、首页图片 loader 适配。

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

## 已知限制与解法

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

### Middleware 是 async

`src/middleware.ts` 现在是 `async function`（为支持 `?attachment_id` 的 fetch 调用）。
测试中需要 `await middleware(req)`。

### 公共常量

`SITE_URL` 统一从 `src/lib/constants.ts` 导出，避免各文件重复写 `process.env.NEXT_PUBLIC_SITE_URL || '...'`。

## SEO 约定（Issue #4）

- **结构化数据**：`src/lib/seo/jsonld.ts` 提供 `buildArticleJsonLd`(BlogPosting) / `buildBreadcrumbJsonLd` / `buildFaqJsonLd`，在 `PostView` 以 `<script type="application/ld+json">` 注入（写法对齐 skills 详情页）。JSON-LD 的 `url`/面包屑须与页面 canonical 一致（按 `post.categories[0]` 取主分类）。
- **FAQ 富结果约定**：文章正文里 `<h2>常见问题（FAQ）</h2>` + 若干 `<h3>`问 `<p>`答，会被 `extractFaq`（`src/lib/post-utils.ts`）解析成 FAQPage；无该区块则不注入。写文案时遵守此结构即可自动出富结果。
- **新鲜度**：`WPPost.modified`（WP REST 默认返回）驱动 sitemap `lastModified`、文章页「更新于」（晚于发布 1 天才显示）、OG `modifiedTime`、JSON-LD `dateModified`。
- **noindex 策略**：tag / 作者归档 / search / 分页归档（`/page/N`）/ 分类分页 / attachment 一律 `robots: { index:false, follow:true }`；分类首页、`/posts` 归档首页保留索引。
- **sitemap 收口**：`src/app/sitemap.ts` 不再收录 tag 页（薄内容）；robots 额外 disallow `/search`。
- **内容文案更新链路**：历史文章在 WordPress，用 `scripts/seo/`（wp-cli `eval-file`，幂等、dry-run、不改 slug）在服务器更新 title/excerpt + 插入 FAQ/延伸阅读。meta description 来自 `post.excerpt`（`buildPostDescription`）。
- ⚠️ **`blog.meathill.com` 双角色**：既是历史公开站，又是 meathill.com 的 REST API 后端 + 媒体源。做旧站收敛（301/410/noindex，见 `scripts/seo/server/` 与 `docs/seo-gsc-cleanup.md`）时必须保留 `/wp-json/`、`/wp-admin/`、`/wp-content/`。
- **GSC 清理**：GSC MCP 只能 list/submit、不能删 sitemap；历史 sitemap 退役按 `docs/seo-gsc-cleanup.md` 手动执行。

## TiDB 降载与 blog.meathill.com 边缘收口（2026-06-11）

WP 的 DB 在 TiDB Cloud，账单暴涨后做的收口。脚本与权限清单见 `scripts/cloudflare/README.md`。

**当时真正打 TiDB 的两个口子（已堵）：**
1. wp-json 零边缘缓存（WP 对 REST 发 `no-store`）→ Cache Rule `blog2026_wpjson_edge_cache`
   override_origin **24h**（override 完全无视 origin cache-control，官方文档已核实），
   排除带 `authorization` 头的请求，4xx/5xx 不缓存。
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
- **wp-json 全量在 Cloudflare Access 后面**（app "blog api"，destinations `/wp-json` + `/wp-json/*`，
  service token policy "Allow worker"，`service_auth_401_redirect: true`）。只有带 service token 的
  Worker 能调用，匿名 401。Access 在 Cache 之前执行，带 token 的请求照常命中边缘缓存。
  ⚠️ Access destinations 不得覆盖 `/feed*`、`/wp-content/uploads*`（都是匿名 fetch）。
- Smart Tiered Cache 已开。

**坑与约定：**
- Rulesets API 的 `PUT entrypoint` 会**替换整个 rules 数组**，必须 GET→按 `ref` 合并→PUT
  （脚本已封装，规则 ref：`blog2026_*`）。
- Page Rules 接口不支持 account-owned token（盘点脚本已做非致命处理）。
- wrangler 走系统代理会连不上 Cloudflare API，跑 wrangler/部署前 `env -u HTTPS_PROXY ...` 清代理；
  多账号 OAuth 需 `CLOUDFLARE_ACCOUNT_ID=fdc63ee...` 跳过交互选择。
- **wp-cron.php 被边缘 301，WP loopback cron 已失效**（定时发布等）。如需恢复：服务器
  system cron 定时 `curl -H "Host: blog.meathill.com" http://127.0.0.1:8080/wp-cron.php`。
- 发布时效：边缘 **24h** + ISR 300s——发文后**必须 purge** 才能及时可见（free plan 无
  prefix purge，用 Purge Everything：dashboard → Caching → Purge，或 API `purge_cache`
  `{"purge_everything":true}`）。purge-on-publish 自动化待接入发文流程（需带
  Zone.Cache Purge 权限的 token 作为 Worker secret）。
- Worker 每次 deploy 会换 build id → ISR 缓存整体失效 → 部署后有一波回源/RU 尖峰;
  wp-json 边缘缓存(24h)能吸收大部分,属预期现象。

