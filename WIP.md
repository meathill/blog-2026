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

# GSC 404 修复（2026-03-09）

## 背景
- 数据来源：`Coverage Drilldown Mar 9 2026.zip`
- 筛选条件：`上次抓取日期 >= 2026-03-01`
- 本轮只处理“线上今天仍稳定 404，且目标可确定”的 URL

## 确定项
- [x] 修复 `/sponsors`：直接跳转到 `https://github.com/sponsors/meathill`
- [x] 修复旧主归档 `/page/*`：保留入口，但统一丢弃 legacy query，并将越界分页收敛到最后一页
- [x] 修复旧作者归档 `/author/:slug/page/:num`：跳转到 `/posts/author/:slug/page/:num`
- [x] 修复 `/?attachment_id=*`：复用 WordPress Access 头，恢复附件跳转
- [x] 更新 middleware 与分页测试
- [x] 运行 `pnpm test:run`

## 暂不处理
- `/:locale/projects/*`
- 无法确认目标的单段历史 slug
- `/path/*` 与明显畸形路径
- 线上已复核不再是 404 的旧 URL

## 验收记录
- 新增 `src/lib/wordpress/access.ts`，统一提供 middleware 可复用的 WordPress Access 头与 API URL 解析
- `src/middleware.ts` 已补齐 `/sponsors`、`/author/:slug/page/:num`、`/page/:num` 的 legacy redirect，并统一清掉 legacy query
- `src/app/[locale]/(public)/posts/page/[num]/page.tsx` 已在越界时重定向到最后一页归档
- 新增页面级测试：`tests/unit/posts-archive-page.test.tsx`
- 全量测试通过：`pnpm test:run`（`30 files / 177 tests`）
- 初次解析 GSC 导出时，本轮确定项共 25 条 URL：`/sponsors` 1 条、`/page/*` 21 条、`/author/*/page/*` 2 条、`/?attachment_id=*` 1 条
- 最终复核时，原始 zip 已不在 `/Users/meathill/Downloads/Coverage Drilldown Mar 9 2026.zip`，因此未能再次复跑同一路径上的筛选脚本
