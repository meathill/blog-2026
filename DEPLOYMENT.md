# 部署指南

本项目使用 OpenNext 构建并部署到 Cloudflare Workers。

## 前置要求

- Node.js >= 24
- pnpm
- Wrangler CLI（可通过 `npx wrangler` 使用）
- Cloudflare 账号与对应权限

## 关键配置

- `wrangler.jsonc`：Workers 绑定（D1 / R2 / DO / vars）
- 构建时环境变量：`NEXT_PUBLIC_SITE_URL` 等 `NEXT_PUBLIC_` 变量需在构建（`pnpm build`）时提供。为了方便管理，我们也将其记录在 `wrangler.jsonc` 的 `vars` 中。
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

默认走 `master` 的 Cloudflare Workers Builds 自动链路：本地验证、按范围提交并推送，
再核对远端提交、构建结果与实际生产流量版本。当前云端配置先运行 `pnpm run cf-typegen`，
再运行 `pnpm run deploy`。手动部署仅在明确要求时执行。

```bash
pnpm test:run
pnpm typecheck
# 本地构建或在已验证的隔离副本中构建
pnpm exec opennextjs-cloudflare build
# 如确有新迁移，再按授权执行远程 migration 和验证
# 选择性 commit / push 后，检查 Workers Builds 和部署流量版本
```

缓存验收期间需要特别注意：

- 当前触发器覆盖所有路径，文档提交的 push 也会重新部署、换 build 并引入首次缓存写入。
  需要保留观察窗口时，先本地提交，等验收结束后再推送。
- 每轮按实际 build ID 和部署时间统计 `site-cache`，分开页面 `.cache` 与数据 `.fetch`；
  分开成功写入、429 等失败尝试与新路径首次初始化，不能跨 build 混算。
- 同键 uploaded/ETag、剩余 TTL、tag 失效与响应头需一起核对。Workers Cache HIT 时，
  `x-nextjs-cache` 可能是旧响应头；必须结合 `CF-Cache-Status` / Age 解释。
- 文档或代码交付都核对既有自动部署结果，不用手动部署补偿失败的 CI。

本轮验收与证据见 [R2 ISR 缓存修复收尾](docs/cache-isr-closeout-2026-10-22.md)。

## 本地预览

```bash
pnpm preview
```
