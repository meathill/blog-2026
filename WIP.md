# WIP

## 任务
- 把 Notion 同步到 WordPress 的流程改为：`Notion -> D1 备份 -> WordPress`。
- D1 与 WordPress 同步判定规则沿用时间字段：`last_update_time` 和 `published_at`。

## Todo
- [x] 新增/扩展测试，覆盖 D1 判定规则与同步流程调用顺序。
- [x] 在 D1 schema 中新增 Notion 博文备份表。
- [x] 实现 D1 备份仓储层（upsert、查询待同步、标记 published_at）。
- [x] 改造 `src/lib/sync-service.ts`，先落库再从 D1 同步到 WordPress。
- [x] 更新迁移文件。
- [x] 执行测试并根据结果修正。

## 验收标准
- [x] 点击后台 blog 同步按钮时，流程按 `Notion -> D1 -> WordPress` 执行。
- [x] 仅当 `last_update_time > published_at`（含首次 `published_at` 为空）时才向 WordPress 推送。
- [x] 推送成功后更新 D1 的 `published_at`，并将 Notion 状态更新为 `Published`。
