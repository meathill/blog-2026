# 开发笔记

记录开发过程中需要长期关注的事项。


## 技术选型

### Next.js 16 + OpenNext

- 使用 `@opennextjs/cloudflare` 适配 Cloudflare Workers
- 支持 Node.js 运行时（比 Edge 运行时功能更完整）
- 配置文件：`open-next.config.ts`、`wrangler.jsonc`

### TailwindCSS v4

- 使用 `@tailwindcss/postcss` 而非 v3 的配置方式
- CSS 变量定义在 `src/app/globals.css`
- 设计系统支持自动深浅色切换（`prefers-color-scheme`）

### 测试框架

- 使用 Vitest + Testing Library
- 配置文件：`vitest.config.ts`、`vitest.setup.ts`
- 测试文件放在源码同目录，使用 `.test.ts` 后缀


## 已知问题

### 1. OpenNext 类型报错

`open-next.config.ts` 需要包含 `default` 属性：

```typescript
export default {
  default: {},
} satisfies OpenNextConfig;
```


## 后续计划

1. **WordPress API 集成** - 从原博客获取文章数据
2. **搜索功能** - 可考虑使用 Algolia 或 Pagefind
3. **评论系统** - 可集成 Awesome Comment 或其他方案

## 代码结构变更

### WordPress API 模块 (`src/lib/wordpress/`)

原 `src/lib/wordpress.ts` 已拆分为模块化结构：
- `types.ts` - 接口定义
- `client.ts` - API 客户端与认证
- `posts.ts` - 文章与媒体操作
- `taxonomies.ts` - 分类与标签操作
- `index.ts` - 统一导出
