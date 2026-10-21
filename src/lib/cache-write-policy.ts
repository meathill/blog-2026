import { AsyncLocalStorage } from 'node:async_hooks';

type PendingWrite = () => Promise<void>;
type RequestWrites = { allowed?: boolean; notFound?: boolean; pending: PendingWrite[] };
const REQUEST_WRITES_SYMBOL = Symbol.for('meathill.blog.cache-write-policy');
const sharedStorage = globalThis as typeof globalThis & {
  [REQUEST_WRITES_SYMBOL]?: AsyncLocalStorage<RequestWrites>;
};
// OpenNext 分别编译 middleware、server 和 Worker 入口；各副本必须使用同一 ALS。
// 全局只保存上下文容器，请求数据仍由 ALS 隔离，不在全局记录当前请求。
const requestWrites = (sharedStorage[REQUEST_WRITES_SYMBOL] ??= new AsyncLocalStorage<RequestWrites>());

// 先等最终 HTTP 状态，再决定是否落盘；避免查出不存在之前的数据 fetch 已先写 R2。
export async function runWithCacheWritePolicy(render: () => Promise<Response>): Promise<Response> {
  const scope: RequestWrites = { pending: [] };
  return requestWrites.run(scope, async () => {
    let response: Response;
    try {
      response = await render();
    } catch (error) {
      scope.allowed = false;
      scope.pending.length = 0;
      throw error;
    }
    scope.allowed = response.status !== 404 && !scope.notFound;
    const pending = scope.pending.splice(0);
    if (scope.allowed) {
      const results = await Promise.allSettled(pending.map((write) => write()));
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed) console.warn(`[cache] ${failed} 次缓存写入失败，保留已生成的响应`);
    }
    return response;
  });
}

export async function writeCacheWhenAllowed(write: PendingWrite): Promise<void> {
  const scope = requestWrites.getStore();
  if (!scope || scope.allowed === true) {
    await write();
  } else if (scope.allowed === undefined) {
    // 提交发生在 OpenNext 渲染结束之后，保留原 Cloudflare / Next 异步上下文和绑定。
    scope.pending.push(AsyncLocalStorage.bind(write));
  }
  // 最终 404，包括沿用此异步上下文的 waitUntil / 流式后台任务：直接丢弃写入。
}

// 渲染器明确生成 notFound 条目时，不依赖流式响应可能已变为 200 的状态码。
export function rejectNotFoundCacheWrites(): void {
  const scope = requestWrites.getStore();
  if (!scope) return;
  scope.notFound = true;
  scope.allowed = false;
  scope.pending.length = 0;
}
