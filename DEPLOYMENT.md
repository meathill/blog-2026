# 部署指南

本项目使用 OpenNext 构建并部署到 Cloudflare Workers。

## 前置要求

- Node.js >= 24
- pnpm
- Wrangler CLI（可通过 `npx wrangler` 使用）
- Cloudflare 账号与对应权限

## 关键配置

- `wrangler.jsonc`：Workers 绑定（D1 / R2 / DO / vars）
- `open-next.config.ts`：OpenNext 构建配置
- `migrations/`：D1 迁移文件

## 首次部署

1. 登录 Cloudflare

```bash
npx wrangler login
```

2. 安装依赖并确认测试通过

```bash
pnpm install
pnpm test:run
```

3. 构建

```bash
pnpm build
```

4. 执行生产数据库迁移

```bash
pnpm db:migrate:prod
```

5. 部署

```bash
pnpm deploy
```

## 日常发布

```bash
pnpm test:run
pnpm build
pnpm db:migrate:prod   # 如有新迁移
pnpm deploy
```

## 本地预览

```bash
pnpm preview
```

## 同步任务说明

Notion 同步接口受 `CRON_SECRET` 保护。
如果接入外部定时任务，请调用 `/api/sync-notion` 并携带对应密钥参数。
