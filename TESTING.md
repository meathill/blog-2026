# 测试指南

本项目使用 `Vitest + Testing Library`。

## 运行测试

```bash
# 监听模式
pnpm test

# 单次执行
pnpm test:run

# 覆盖率
pnpm test:coverage
```

## 测试目录

测试文件统一放在 `tests/` 目录：

```text
tests/
├── app/         # route / action 相关
├── lib/         # 工具与服务层
└── unit/        # 页面和组件的单元测试
```

命名规则：`*.test.ts` 或 `*.test.tsx`。

## 重点覆盖范围

- `src/lib/**`：业务规则、第三方 API 适配
- `src/app/api/**`：接口路由
- `src/middleware.ts`：路由重写/重定向规则

## 覆盖率门槛

在 `vitest.config.ts` 中配置覆盖率阈值，目的是防止覆盖率持续回退。

说明：当前仓库仍存在较多历史页面/UI 文件未覆盖，阈值先以“防回退”为目标，后续逐步提高。

## Mock 约定

基础 mock 在 `vitest.setup.ts`：

- `next/navigation`
- `next/image`
- `next/link`
- `IntersectionObserver`
