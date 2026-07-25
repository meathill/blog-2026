# WIP: 升级项目依赖至最新版 & 清理废弃 Notion 模块

## 任务分解 (TODO)

- [x] 移除 Notion 相关依赖及废弃代码与测试
- [x] 执行 `pnpm up --latest` 升级所有依赖
- [x] 校验并测试 `@google/genai` 升级至 2.13.0 后的兼容性
- [x] 运行 TypeScript 类型检查与单元测试 (`pnpm test:run`) - 388/388 全部通过
- [x] 运行 Biome 格式化 (`pnpm run format`)
- [x] 运行项目构建 (`pnpm run build`) - 成功完成 Next.js 打包构建
