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
