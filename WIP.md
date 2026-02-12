# WIP

## 任务
- 进行一轮项目维护审计后的落地整改，覆盖：
- 文档清理、合并、补充
- 测试覆盖治理
- 大文件拆分与复用抽离
- 手搓实现替换为第三方能力

## Todo
- [x] 更新 README/TESTING/DEPLOYMENT/DEV_NOTE，修正与当前代码不一致的信息。
- [x] 新增 TODO.md，记录长期维护计划。
- [x] 先补测试：为 slug 与 tag 归一化/解析新增单元测试。
- [x] 抽离 `app slug` 与 `tag slug` 复用逻辑，替换重复实现。
- [x] 抽离文章列表项复用组件，减少分类/标签页面重复代码。
- [x] 在 Vitest 配置中增加 coverage 阈值，防止回退。
- [x] 执行测试与覆盖率检查，确保通过。

## 验收标准
- [x] 文档与当前工程结构一致，不含明显过期指引。
- [x] 测试命令与覆盖率门槛可直接执行并生效。
- [x] `src/actions/apps.ts` 不再手写 slug 规则。
- [x] `tag` 路由页面不再重复 slug 归一化逻辑。
- [x] 分类/标签文章列表渲染复用统一组件。

## 第二轮维护（已完成）
- [x] 拆分 `src/components/layout/Header.tsx`：导航数据、桌面菜单、移动菜单解耦。
- [x] 保持 Header 行为一致（桌面下拉、移动折叠、外链/内链渲染）。
- [x] 检查样式变量使用，补齐缺失的 `--accent-dark` 主题变量定义。
- [x] 同步链路新增失败重试与幂等日志（按 slug 防止重复创建）。
- [x] 执行 `pnpm test:run` 与 `pnpm build`，确认通过。

## 第三轮维护（已完成）
- [x] 为 `src/actions/apps.ts`、`src/actions/tags.ts`、`src/actions/upload.ts` 新增单元测试。
- [x] 上调全局 coverage 阈值，并新增 `src/lib/**` 与 `src/app/api/**` 分目录阈值。
- [x] 执行 `pnpm test:run` 与 `pnpm test:coverage`，确认阈值生效且通过。
- [x] 统一文章列表展示组件，覆盖 `posts/search` 页面并补组件单测。

## 第四轮维护（已完成）
- [x] Notion 同步流程改为先写入 D1 备份，再基于 `last_update_time` 与 `published_at` 决定是否推送 WordPress。
- [x] 文章详情页分类与标签补齐链接（正文 meta 与 footer 标签区）。
- [x] 导航编辑迁移到 `/admin/navigation`，支持按 `zh/en` 保存、恢复默认，并在前台 Header 动态读取。
- [x] 新增 `navigation_configs` 表迁移与导航配置解析单测。
- [x] 执行 `pnpm test:run` 与 `pnpm build`，确认通过。
