# Admin 博客编辑器（2026-03-15）

## 背景
- 目标：在 `/admin` 内集成 BlockNote 所见即所得博客编辑器，替换 Notion 作为新的写作入口
- v1 保持公开站点继续读取 WordPress，不改前台文章路由
- 本地 D1 作为主数据源，文章内容以 `block JSON` 为准，同时保存 Markdown / HTML 快照

## Todo
- [x] 新增 `blog_posts` schema 与迁移
- [x] 封装 BlockNote 内容解析 / 序列化 / slug / 分类标签等博客辅助逻辑
- [x] 实现博客 server actions 与 WordPress 发布同步
- [x] 重写 `/admin/blog` 列表页并新增新建 / 编辑页面
- [x] 集成 BlockNote 编辑器、封面上传与正文图片上传
- [x] 为核心逻辑补充测试并跑构建验证

## 验收记录
- 已新增 BlockNote 编辑器、博客本地存储与 WordPress 发布链路，并保留 Notion 遗留同步工具。
- 已新增测试：`tests/lib/blog-post.test.ts`、`tests/lib/blog-blocks.test.ts`、`tests/lib/blog-markdown-paste.test.ts`，并补充 `tests/unit/wordpress-posts.test.ts`。
- 全量测试通过：`pnpm test:run`（`36 files / 217 tests`）。
- 构建通过：`pnpm build`。
- 已追加修复：Markdown 粘贴自动转 block，以及 BlockNote 浮层菜单背景样式异常。

# Web Vitals 优化（2026-03-09）

## 背景
- 目标页面：`/` 与 `/en`
- 优先问题
  - `/_next/image` 在 OpenNext Cloudflare 适配层无法按 `minimumCacheTTL` 正常生效
  - 首页导航与 `FeaturedApps` 每次请求都走实时读取
  - 首页第三方脚本、Hero 动效和全局文章样式抬高移动端首屏成本

## Todo
- [x] 新增 `image-loader.ts`，把全站 `next/image` 切到 `/cdn-cgi/image/...`
- [x] 收紧首页卡片图、文章头图、App 图标和预览图的图片参数
- [x] 抽离导航 / app tags / featured apps 读模型，并增加 cache tag 失效
- [x] 将 Header / Footer 改为服务端壳体，移除导航客户端补拉
- [x] 调整 `ThirdPartyScripts`、Hero 和文章专用样式拆分
- [x] 补充测试并运行针对性验证

## 验收记录
- 已通过针对性测试：`tests/image-loader.test.ts`、`tests/lib/public-navigation.test.ts`、`tests/lib/public-apps.test.ts`、`tests/components/third-party-scripts.test.tsx`、`tests/actions/apps.test.ts`、`tests/actions/tags.test.ts`、`tests/components/featured-image.test.tsx`
- 已通过构建：`pnpm build`

# PR #2 Review Follow-up（2026-03-09）

## 背景
- Copilot review 指出两个需要立即修正的问题
  - `deleteTag` 删除标签后没有失效 `/app` 与 `/en/app` 列表页缓存
  - 首页 `ThirdPartyScripts` 的滚动监听在越过 Hero 阈值后仍然保留
- 另有一条“抽公共 helper 去重”的建议，先按非阻塞清理项评估，不作为本轮必改项

## Todo
- [x] 为 `deleteTag` 补充 `/app` 与 `/en/app` 的 `revalidatePath`
- [x] 收紧首页 Hero 滚动监听，在命中阈值后尽快解绑
- [x] 更新 `tags` 与 `ThirdPartyScripts` 相关测试并验证
- [x] 修正首页滚动恢复场景下 `Adsense` 可能早于 `GA` 注入的问题

# Web Vitals 优化（2026-03-06）

## 背景
- 目标页面：`/en/posts/css/how-to-use-height-100-with-flex-1`
- 现状（PSI 报告）
  - 移动端 Performance 约 `70`
  - `LCP` 约 `8.9s`
  - `LCP` 元素是文章头图
  - 第三方脚本（Adsense / GA / FundingChoices）占用较多主线程与带宽

## Todo
- [x] 把第三方脚本从首屏预载改为延迟加载（用户交互或空闲后）
- [x] 调整文章头图关键加载参数（`fetchPriority` / `loading` / `quality` / `sizes`）
- [x] 延迟代码高亮核心库加载（`idle + dynamic import`）
- [x] 补充针对本次改动的测试
- [x] 运行测试并记录结果
- [x] 输出需要你配合/决策的项目

## 验收记录
- 已新增并通过测试：`ThirdPartyScripts` / `FeaturedImage` 相关用例。
- 全量测试通过：`pnpm test:run`（`29 files / 170 tests`）。
- 构建通过：`pnpm run build`。

## 需要你配合
- 确认是否接受“统计与广告延迟加载”策略（可显著改善首屏指标，但可能牺牲短停留会话统计/广告曝光）。
- 部署到线上后，提供新一轮移动端 PSI 报告链接，用于前后对比复盘。
