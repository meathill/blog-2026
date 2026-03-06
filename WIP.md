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
