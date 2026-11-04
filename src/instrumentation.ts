// 生产错误日志钩子：Next 生产构建会 scrub 掉 RSC 渲染错误的真实信息（只留 digest），
// 此钩子把原始错误（含 digest、堆栈、cause）打进 Workers 日志，wrangler tail 可见。
// 2026-11-04 全站 ISR 500 事故中引入，保留为常驻排障设施。
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string; renderScope?: string },
) {
  const err = error as Error & { digest?: string; cause?: unknown };
  console.error(
    JSON.stringify({
      tag: 'onRequestError',
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      digest: err?.digest,
      message: err?.message,
      stack: err?.stack,
      causeMessage: err?.cause instanceof Error ? err.cause.message : String(err?.cause ?? null),
    }),
  );
}
