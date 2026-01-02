博客 2026
===

这是我的博客 2026 新版。


老站
---

1. 基于 WordPress 开发
2. 使用官方模版
3. 问题：
    1. 天天被扫，烦得很
    2. 因为被扫，PHP + MySQL 压力很大
    3. 前端功能很难添加
    4. 缓存性能一般
    5. UI 比较老旧，且难以更新


目标
---

1. 使用 Next.js 重构网站页面
2. 使用老的 WordPress 作为 Headless
3. 部署在 Cloudflare Workers
4. 网站高端大气上档次，打开速度很快，还能整合各种我最近开发的玩具


技术栈
---

1. Next.js 16 + OpenNext
2. TailwindCSS v4
3. Lucide React 图标
4. Cloudflare Workers 部署


开发
---

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 本地预览 Cloudflare Workers
pnpm preview

# 部署到 Cloudflare
pnpm deploy
```


相关资料
---

- 我的博客：https://blog.meathill.com
- 个人首页：https://meathill.com
- GitHub：https://github.com/meathill
- X：https://x.com/meathill1
