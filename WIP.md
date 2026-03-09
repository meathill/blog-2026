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
