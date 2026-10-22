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

## ISR / Workers Cache 回归

缓存实现或 Next/OpenNext 升级时，先运行针对性回归，再运行全量测试与类型检查：

```bash
pnpm exec vitest run tests/lib/isr-freshness-cache.test.ts tests/lib/cache-write-policy.test.ts tests/lib/blog-incremental-cache.test.ts tests/lib/blog-r2-write.integration.test.ts tests/unit/isr-config.test.ts
pnpm test:run
pnpm typecheck
```

重点验证：冷实例读取 TTL 内缓存为 HIT、保留真实 lastModified；过期与 tag 失效仍重建；
false TTL 不被改成短缓存；不同编译模块共享请求级 ALS，404 与正常请求并发不串数据。
单模块直接导入的单测不能替代真实构建产物验证。

构建后生成本地 dry-run Worker，再用公开缓存样本做离线验证：

```bash
pnpm exec opennextjs-cloudflare build
pnpm exec wrangler deploy --dry-run --outdir /private/tmp/blog-isr-bundle
node scripts/research/verify-built-isr.ts /private/tmp/blog-isr-bundle/worker.js /path/to/public-skills.cache /path/to/result.json
```

脚本只连接临时本地 R2/D1，外部数据源被离线替代，覆盖冷读零写入、过期刷新、
404 零写入、tag 失效及打包后跨模块门禁。它捕获 DO RPC，不运行完整生产 DO 调度；
也不能用本地结果证明真实 Workers Cache 命中，后者需少量公开 GET 与线上对象元数据验证。
运行脚本需要已核对结构的非压缩 dry-run 产物；构建升级改变结构时应先检查记录器。

排查与验收不读取项目 `.env` / `.dev.vars`。需要避免构建工具自动加载这些文件时，
使用不含环境文件的临时源码副本、同版本依赖与本地绑定，先执行 `cf-typegen`。
参考[已通过的实际产物验证](docs/cache-evidence/fixed-isr-build-2026-10-21.json)及
[本轮收尾记录](docs/cache-isr-closeout-2026-10-22.md)。
