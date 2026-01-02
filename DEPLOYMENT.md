# 部署指南

本项目使用 OpenNext 部署到 Cloudflare Workers。


## 前置要求

1. Node.js >= 24
2. pnpm
3. Cloudflare 账号


## 本地预览

```bash
# 构建并启动本地 Workers 环境
pnpm preview
```


## 部署到 Cloudflare

### 首次部署

1. 登录 Cloudflare：
   ```bash
   npx wrangler login
   ```

2. 创建 KV 命名空间（用于缓存）：
   ```bash
   npx wrangler kv:namespace create NEXT_CACHE_WORKERS_KV
   ```

3. 将返回的 ID 填入 `wrangler.jsonc` 中的 `kv_namespaces[0].id`

4. 部署：
   ```bash
   pnpm deploy
   ```

### 后续部署

```bash
pnpm deploy
```


## 环境变量

如需配置环境变量，在 Cloudflare Dashboard 中设置，或创建 `.dev.vars` 文件用于本地开发。


## 域名配置

部署完成后，在 Cloudflare Dashboard 中配置自定义域名：
1. 进入 Workers & Pages
2. 选择 `blog-2026` 项目
3. 设置 → 域和路由 → 添加自定义域名
