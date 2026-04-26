# 博客 2026

基于 `Next.js 16 + OpenNext + Cloudflare` 的个人博客项目。

## 项目目标

- 前端页面与交互使用 Next.js 重构
- 使用 WordPress 作为 Headless CMS 数据源
- 部分后台能力（如应用管理、同步备份）落在 Cloudflare D1
- 统一部署到 Cloudflare Workers

## 核心能力

- 文章列表、详情、分类、标签、搜索
- Admin 博客编辑器：集成 BlockNote 所见即所得编辑器，支持图文混排与自动保存
- AI 辅助创作：基于 OpenAI/Gemini 自动生成文章 slug、摘要、标签
- Open Graph 动态图片：基于 Satori 与边缘图片处理动态生成
- 后台 Notion 同步：`Notion -> D1 备份 -> WordPress`（遗留功能，目前主推后台编辑器）
- 应用（Apps）管理与标签管理

## 技术栈

- Next.js 16
- OpenNext (`@opennextjs/cloudflare`)
- Tailwind CSS v4
- Drizzle ORM + Cloudflare D1
- OpenAI & Google Generative AI SDKs
- Vitest + Testing Library

## 本地开发

```bash
pnpm install
pnpm dev
```

## 常用命令

```bash
# 构建
pnpm build

# 预览（Cloudflare Workers 本地预览）
pnpm preview

# 测试
pnpm test
pnpm test:run
pnpm test:coverage

# 生成/执行 D1 迁移
pnpm db:generate
pnpm db:migrate:local
pnpm db:migrate:prod

# 部署
pnpm deploy
```

## 文档索引

- `TESTING.md`：测试策略与覆盖率
- `DEPLOYMENT.md`：部署流程
- `DEV_NOTE.md`：开发中长期约定与关键决策
- `WIP.md`：当前任务拆解
- `TODO.md`：长期维护事项
