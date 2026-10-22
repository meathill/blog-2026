# R2 ISR 缓存修复收尾（2026-10-22）

**代码迭代已结束并上线，24 小时运行验收仍在进行。** 截至北京时间 10/22 15:35，
没有再观察到首页、skills 在一天 TTL 内持续重写；不能把当前结果等同于查清全部历史爆量。

## 当前方案

请求先经过 Workers Cache，边缘命中时不执行 Worker；边缘未命中时，Worker 读取持久 ISR，
有效条目直接返回，缺失时生成，过期时按 Next/OpenNext 的原生流程刷新。
Workers Cache 与 ISR 均已生效，后者可在另一个机房或边缘缓存被淘汰时复用已生成页面。

- `wrangler.jsonc`：`cache.enabled=true`，默认不跨版本复用；绑定 `site-cache`。
- `open-next.config.ts`：R2 + regional cache + D1 next-mode tag cache + 官方 DO queue；
  cache interception 继续关闭。`worker.ts` 仅包装请求级写入策略并导出 DO。
- 公开 ISR 页配置 `revalidate=86400`。TTL 是有效期，不保证边缘保留一天，
  也不会覆盖业务的 private/no-store、tag 失效或合法发布更新。
- 404 页面、空 WP slug/深分页结果不进入增量缓存；API、后台、登录、搜索继续保持各自缓存边界。

## 已确认的问题与修复

1. 按需路径不在 prerender manifest。冷 Next 实例未恢复路由 cacheControl，回退 1 秒，
   将仍有效的 R2 条目判为 STALE。补响应头没有修正判断，OpenNext 还会把 STALE 头改成 2 秒。
   现在读取持久化条目时恢复当前 Next 实例的路由 TTL，已有配置优先；不修改 lastModified 或伪造新鲜度。
2. middleware、server、Worker 入口分别打包，模块级 AsyncLocalStorage 变成不同实例，
   最终 HTTP 状态无法约束另一份模块的写入。现在通过 `Symbol.for` 共享同一个 ALS 容器，
   请求数据仍独立，最终 404 或明确 notFound 标记拒绝待写入内容。

修复提交：`bfa796fe2846e5a5848c20941abdc8951ce25dcf`。
生产版本：`305af306-24d0-43b1-9723-c1a0a76ad515`，100% 流量；
build：`PFf94JJlAqVr310FgZsqY`，北京时间 10/21 17:35:59 自动部署。

## 线上证据（尚未满 24 小时）

| 指标 | 修复前：16 小时 51 分 | 修复后：约 22 小时 |
| --- | ---: | ---: |
| 页面成功 Put | 10520 | 4599 |
| fetch 成功 Put | 5677 | 6451 |
| 中文首页成功 Put / Get | 429 / 471 | 1 / 385 |
| Workers Cache 命中率 | 33.8% | 44.7% |
| Worker 调用 | 15115 | 13152 |
| 平均 CPU / 调用 | 272.3 ms | 227.0 ms |
| Worker errors | 0 | 0 |

新窗口：北京时间 10/21 17:35:59–10/22 15:35；旧窗口：10/20 23:08:51–10/21 16:00。
按 Worker 调用归一，成功 Put 从每次 1.072 降至 0.840，约减少 21.6%。
窗口长度、流量组成不同，这些是观测比较，不是对照实验，也不是费用预测。
当前 CPU 仍高于停用 R2 时三天基线的每次 192.5 ms，不能直接认定恢复 R2 节省了 CPU。

- 首页、skills 的上传时间与 ETag 保持首次写入值；全局 `/_not-found` 无 Put。
- 实测边缘 `HIT`；也实测过不同机房边缘 `MISS`、ISR `HIT`，剩余 TTL 正确。
- `x-nextjs-cache` 在边缘 HIT 时可能只是缓存的旧响应头，不能把它当作本次 Worker 执行结果。
- 一个跨窗口疑似键经核对，前一时点记录为 429 失败尝试，后一时点成功；
  后续 10 分 44 秒的 6 次元数据快照未更新。没有证明提前成功重写或持续故障，未据此修改生产。

以上为 Cloudflare adaptive 统计，可能有抽样。PutObject 必须区分成功与失败，
不能把失败尝试、新路径首次写入、同分钟集中操作直接当作持续成功重写。

## 验证与收尾

647 项测试、类型检查、Next/OpenNext 构建和 Wrangler dry-run 均通过。
实际构建产物在临时本地 R2/D1 中验证：一天内冷读 HIT / 0 Put、真正过期后刷新、
404 零写入、tag 失效重建，以及入口/server 模块之间的写入保护。
`scripts/research/verify-built-isr.ts` 捕获 DO RPC，不能把它当作完整生产 DO 调度验收。
运行方式见 [TESTING.md](../TESTING.md)。

仅剩运行验收：北京时间 **10/22 17:35:59** 满 24 小时后，留出统计延迟，
按固定窗口重查成功/失败写入、同键对象、CPU 与命中率，更新本记录并停止观察自动任务。
新 build 会重置缓存观察口径；文档先本地提交，验收完成后再推送，发布方式见
[DEPLOYMENT.md](../DEPLOYMENT.md)。历史全局 404 等旧爆量样本仍有未解释部分，
这属于历史归因边界，不再作为本轮代码迭代的阻塞项。

证据：[22 小时固定快照](cache-evidence/isr-status-2026-10-22.json)、
[实际构建验证](cache-evidence/fixed-isr-build-2026-10-21.json)。
逐小时可变台账保存在工作区 `docs/cache-evidence/isr-observation-2026-10-21.json`，
不是以上两个固定快照的替代，也不能直接累加其中重叠窗口的指标。
