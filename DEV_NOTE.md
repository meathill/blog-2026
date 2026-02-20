# 开发笔记

记录需要长期关注的工程约定与关键设计。

## 运行时与部署

- 运行时：Node.js（Cloudflare `nodejs_compat`）
- 部署：OpenNext + Cloudflare Workers
- 数据：
  - WordPress（内容主源）
  - D1（后台数据与同步备份）

## 内容同步链路

Notion 博文同步采用两阶段：

1. `Notion -> D1`：先做备份落库
2. `D1 -> WordPress`：按时间规则同步

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
- Notion 同步后台：`src/app/[locale]/admin/blog/page.tsx`

## 维护约定

- 优先抽离重复业务逻辑，再考虑样式层重构
- 基础 UI 封装（`src/components/ui/*`）视为设计系统层，非必要不频繁改动
- 大改动前先补测试，再落代码

## 已知限制与解法

### next/og (Satori) 不支持 WebP

`next/og` 的 `ImageResponse` 底层使用 Satori，只支持 PNG/JPEG。遇到 WebP 格式的 featured image 时，
通过 Cloudflare Image Resizing 在边缘转换为 PNG：

```
原始：https://blog.meathill.com/wp-content/uploads/2024/03/1-2.webp
转换：https://blog.meathill.com/cdn-cgi/image/format=png,width=1200/wp-content/uploads/2024/03/1-2.webp
```

实现位置：`src/app/api/og/post/route.tsx`

### Feed 代理

站内 RSS feed 通过 `src/app/feed/[[...path]]/route.ts` 代理到源站 WordPress：

- 从 `WORDPRESS_API_URL` 推导 origin（取 `new URL(apiUrl).origin`）
- 中间件将 `/tag/xxx/feed` 等路径 rewrite 为 `/feed/tag/xxx`

### Middleware 是 async

`src/middleware.ts` 现在是 `async function`（为支持 `?attachment_id` 的 fetch 调用）。
测试中需要 `await middleware(req)`。

### 公共常量

`SITE_URL` 统一从 `src/lib/constants.ts` 导出，避免各文件重复写 `process.env.NEXT_PUBLIC_SITE_URL || '...'`。

