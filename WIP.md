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

## Follow-up（2026-03-15）
- [x] 保存草稿 / 发布补充可见的 pending 状态与成功 toast
- [x] 为博客编辑表单接入 AI 元数据生成（slug / 摘要 / tags）
- [x] 清理旧的 query 参数成功提示，统一为客户端反馈
- [x] 补充 AI 元数据与编辑器交互相关测试并重新验证

## Follow-up 验收记录
- 博客编辑表单已改为客户端接管保存 / 发布状态，按钮提供 spinner，成功后统一使用 toast 反馈。
- 已新增 AI 元数据链路：基于标题与正文 Markdown 生成 `slug`、`excerpt`、`tags`，并在服务端清洗后回填表单。
- 已补充 `tests/lib/blog-ai.test.ts`，并保持全量测试通过。
- 已通过构建：`pnpm build`。

## AI 配置统一（2026-03-15）
- [x] 将博客 AI helper 改为统一读取 `AI_MODEL`
- [x] 根据 model 自动判定 `OpenAI / Gemini` provider
- [x] 分别使用 `OPENAI_API_KEY` 与 `GEMINI_API_KEY`
- [x] 补充 provider 选择与配置解析测试并重新验证

## AI 配置统一验收记录
- 已将博客 AI 配置收敛为统一环境变量入口：`AI_MODEL`、`OPENAI_API_KEY`、`GEMINI_API_KEY`，并支持 `OPENAI_BASE_URL`、`GEMINI_BASE_URL` 覆盖默认端点。
- 已按 `AI_MODEL` 自动识别 provider：`gemini*` 走 Gemini `generateContent`，其余模型默认走 OpenAI `chat/completions`。
- 已补充 `tests/lib/blog-ai.test.ts`，覆盖 provider 识别、配置解析和现有元数据清洗逻辑。
- 验证通过：`pnpm test:run`、`pnpm build`。

## AI SDK 对齐（2026-03-15）
- [x] 用 `openai` SDK 替换 OpenAI 的手写 fetch 调用
- [x] 用 `@google/genai` 替换 Gemini 的手写 fetch 调用
- [x] 保持统一环境变量与 `AI_MODEL -> provider` 判定逻辑不变
- [x] 补充 / 更新测试并重新验证构建

## AI SDK 对齐验收记录
- 已将博客 AI 元数据生成从手写 `fetch` 切换到官方 SDK：OpenAI 使用 `openai`，Gemini 使用 `@google/genai`。
- 统一环境变量入口保持不变：继续通过 `AI_MODEL` 判定 provider，并分别读取 `OPENAI_API_KEY` 与 `GEMINI_API_KEY`。
- Gemini 端点配置已适配 SDK：支持把原有 `GEMINI_BASE_URL` 解析为 `baseUrl + apiVersion`，兼容默认端点和自定义代理。
- 已补充 / 更新 `tests/lib/blog-ai.test.ts`，并通过全量验证：`pnpm test:run`、`pnpm build`。

## Sidebar 交互微调（2026-03-15）
- [x] 将博客编辑 sidebar 的主操作按钮改为左对齐
- [x] 在“操作”区补充显式的“AI 处理”按钮，基于标题和正文回填元数据
- [x] 补充针对 sidebar 的交互测试并重新验证

## Sidebar 交互微调验收记录
- 已将 sidebar 中的保存、发布、返回和公开预览入口统一改为左对齐，减少操作区视觉漂移。
- 已将 AI 元数据入口提升到“操作”区，按钮文案改为“AI 处理”，并保留对 slug、摘要、标签的回填能力。
- 已移除正文区域上方重复的 AI 助手卡片，避免编辑区出现重复入口。
- 已新增 `tests/components/admin/blog-editor-sidebar.test.tsx`，并通过全量验证：`pnpm test:run`、`pnpm build`。

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

# 导航 Dropdown 自动关闭修复（2026-03-21）

## 背景
- 桌面端 Header 导航使用原生 `<details>` 实现 dropdown
- 多个菜单展开后不会自动关闭，导致浮层重叠，影响导航可用性

## Todo
- [x] 改为受控的桌面端 dropdown 状态，同一时间只允许一个菜单展开
- [x] 支持移出菜单区域或点击外部区域后自动关闭
- [x] 补充桌面导航交互测试并验证

## 验收记录
- 已将桌面端导航从原生 `<details>` 改为受控 dropdown，同一时间只允许一个菜单展开。
- 已支持鼠标移出菜单区域、点击导航外部区域以及按下 `Escape` 后自动关闭 dropdown。
- 已新增 `tests/components/desktop-nav.test.tsx`，并通过针对性验证：`pnpm test:run tests/components/desktop-nav.test.tsx`。
