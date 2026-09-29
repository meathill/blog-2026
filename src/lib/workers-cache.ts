// Issue #14：Workers Cache（https://developers.cloudflare.com/workers/cache/）整页 HTML 边缘缓存策略。
//
// wrangler.jsonc 开 `cache.enabled` 后，Cloudflare 在执行 Worker 之前先查这层分层缓存（近用户的下层 +
// 上层 tier，带请求合并），且**先于 Smart Placement**：命中直接在离用户最近的机房返回，Worker 不运行。
// 没有「网关 entrypoint + 内层缓存 entrypoint」那套：本站开了 smart placement，网关（不缓存）会被
// 调度到远端机房运行，再经 ctx.exports 查缓存，边缘就近命中的收益全丢了。
//
// 是否缓存完全由响应头决定（RFC 9111），且**没有 Cache-Control 的 200 默认会被缓存 2 小时、404 缓存
// 3 分钟**（heuristic freshness），所以每个响应都显式写 `Cloudflare-CDN-Cache-Control`
// （优先级最高、只作用于 Cloudflare、返回客户端前被剥离；浏览器看到的 Cache-Control 保持 Next 原样）：
// - 公共 ISR 页面的 HTML 文档请求：EDGE_HTML_CACHE_CONTROL + Cache-Tag，发布时按 tag 清除；
// - 其它一切（admin、api、feed、search、login、app、RSC、带查询串、非 GET/HEAD、非 200、动态渲染、
//   带登录/预览 cookie、Set-Cookie……）：no-store。
//
// 失效：publishBlogPost 在 waitUntil 里延迟 EDGE_PURGE_DELAY_MS 调 `ctx.cache.purge({ tags })`
// （Workers Cache 自带全球 Instant Purge，不需要 zone token；zone 的 purge_everything 对它无效）。
// purge 固定按 Free 档限流，失败时由 max-age 兜底新鲜度。部署会换 Worker 版本，缓存键默认含版本，
// 新版本从空缓存开始（cross_version_cache 保持关闭），不会用旧版本 HTML 引用已删除的静态资源。
//
// 排查：`cf-cache-status`（HIT/MISS/UPDATING/EXPIRED/BYPASS）+ `x-edge-cache`（本策略判定，随缓存存储）。

/** 所有进边缘缓存的 HTML 都带这个 tag，发布时整体清除（tag 匹配不区分大小写，必须是可打印 ASCII）。 */
export const EDGE_HTML_CACHE_TAG = 'html';

/**
 * 边缘 TTL：1 小时新鲜 + 1 天 stale-while-revalidate（过期后先给旧页、后台回源刷新，回源通常命中 ISR）。
 * - 发布有 purge，TTL 只决定「WP 后台直接改文 / 导航改动 / purge 被限流」时最多晚多久可见。
 * - 不用 s-maxage：文档明确 s-maxage / must-revalidate 会禁用 stale-while-revalidate 与 stale-if-error。
 */
export const EDGE_HTML_CACHE_CONTROL = 'max-age=3600, stale-while-revalidate=86400';
export const EDGE_NO_STORE = 'no-store';
export const EDGE_POLICY_HEADER = 'x-edge-cache';

/**
 * Next 的 revalidateTag 在 Server Action 结束时才统一落盘（D1 tag cache），立即 purge 可能让紧随其后的
 * 请求把失效前的 ISR 页重新写回边缘（再活 max-age）。延迟几秒再 purge 规避竞态（waitUntil 上限 30s）。
 */
export const EDGE_PURGE_DELAY_MS = 3_000;

// 公共 ISR 页面白名单（对应 app/[locale]/(public) 下按需 ISR 的路由）；默认语言 zh 无前缀。
// 不含：search / login / app（动态）、admin、api、feed、sitemap/robots（走各自缓存）。
const CACHEABLE_PAGE_RE = /^(?:\/(?:zh|en))?(?:\/(?:posts|category|tag|skills|solutions|tech)(?:\/[^?#]*)?|\/about)?$/;

// 带这些请求头的是 RSC 导航 / Server Action / ISR 重验证 / 鉴权请求，不写入 HTML 边缘缓存。
const BYPASS_REQUEST_HEADERS = [
  'rsc',
  'next-router-prefetch',
  'next-router-state-tree',
  'next-router-segment-prefetch',
  'next-action',
  'x-prerender-revalidate',
  'authorization',
];

// 缓存键不含请求头（Cookie、RSC 等都不在键里），缓存又在 Worker 之前查——所以要用 Vary 把这些请求
// 隔开：缓存变体只对「不带该头」的请求命中。关键是 x-prerender-revalidate：OpenNext DO 队列经
// WORKER_SELF_REFERENCE（service binding，同样先查 Workers Cache）发起 ISR 重验证，不隔开会被缓存截胡。
const EXTRA_VARY = [
  'rsc',
  'next-router-prefetch',
  'next-router-state-tree',
  'next-router-segment-prefetch',
  'next-action',
  'x-prerender-revalidate',
];

// 带 better-auth 会话（含 __Secure- 前缀）或 Next 预览 cookie 的请求，其响应不写入边缘缓存。
// 公共页不读 cookie（ISR），普通 cookie（_ga 等）不影响缓存。注意 Cookie 不在缓存键里，登录用户访问
// 公共页仍可能命中已缓存的公共 HTML——内容对所有人相同，是安全的；本判定保证「个性化渲染」永不入缓存。
const BYPASS_COOKIE_RE =
  /(?:^|;\s*)(?:__Secure-|__Host-)?(?:better-auth\.[^=]+|__prerender_bypass|__next_preview_data)=/;

// 只缓存「新鲜」的 ISR 结果；STALE 是过期旧页（后台正在重生成），缓存它会让旧页在边缘再活 max-age。
const CACHEABLE_NEXT_CACHE_STATES = new Set(['HIT', 'MISS']);

export function hasBypassCookie(request: Request): boolean {
  return BYPASS_COOKIE_RE.test(request.headers.get('cookie') ?? '');
}

export function isEdgeCacheablePath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname.endsWith('/')) return false; // Next 会 308 去掉尾斜杠
  if (/\/feed$/.test(pathname)) return false; // /tag/x/feed 等被 middleware rewrite 到 feed 路由
  return CACHEABLE_PAGE_RE.test(pathname);
}

export function isEdgeCacheableRequest(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const url = new URL(request.url);
  if (url.search !== '') return false; // 查询串（utm、_rsc、?s=）一律不缓存
  if (!isEdgeCacheablePath(url.pathname)) return false;
  if (hasBypassCookie(request)) return false;
  return !BYPASS_REQUEST_HEADERS.some((name) => request.headers.has(name));
}

export function isEdgeCacheableResponse(response: Response): boolean {
  if (response.status !== 200) return false;
  if (!(response.headers.get('content-type') ?? '').startsWith('text/html')) return false;
  // 只缓存 ISR 结果：Next 对 ISR 页带 x-nextjs-cache，动态渲染没有该头
  if (!CACHEABLE_NEXT_CACHE_STATES.has((response.headers.get('x-nextjs-cache') ?? '').toUpperCase())) return false;
  if (response.headers.has('set-cookie')) return false;
  if (/\b(?:private|no-store)\b/i.test(response.headers.get('cache-control') ?? '')) return false;
  return (response.headers.get('vary') ?? '').trim() !== '*';
}

function mergeVary(existing: string | null, dropAcceptEncoding: boolean): string {
  const values = (existing ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    // Workers Cache 按 Accept-Encoding 原文分变体（不归一化），Worker 输出未压缩时这个 Vary 只会打散命中率
    .filter((value) => !(dropAcceptEncoding && value.toLowerCase() === 'accept-encoding'));
  const lower = new Set(values.map((value) => value.toLowerCase()));
  for (const name of EXTRA_VARY) {
    if (!lower.has(name)) values.push(name);
  }
  return values.join(', ');
}

/** 给 Worker 的最终响应写上边缘缓存策略。返回新的 Response（原响应头可能不可变）。 */
export function applyEdgeCachePolicy(request: Request, response: Response): Response {
  const cacheable = isEdgeCacheableRequest(request) && isEdgeCacheableResponse(response);
  const headers = new Headers(response.headers);
  headers.delete('cdn-cache-control');
  if (cacheable) {
    headers.set('cloudflare-cdn-cache-control', EDGE_HTML_CACHE_CONTROL);
    headers.set('cache-tag', EDGE_HTML_CACHE_TAG);
    headers.set('vary', mergeVary(headers.get('vary'), !headers.has('content-encoding')));
    headers.set(EDGE_POLICY_HEADER, 'cache');
  } else {
    headers.set('cloudflare-cdn-cache-control', EDGE_NO_STORE);
    headers.delete('cache-tag');
    headers.set(EDGE_POLICY_HEADER, 'bypass');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// 本地最小类型：不依赖 wrangler 生成的 env.d.ts（已 gitignore）。ctx.cache 只在开启 Workers Cache 的
// entrypoint 上存在（本地 dev / 未开启时为 undefined）。
export type EdgeCacheContext = {
  cache?: {
    purge(options: { tags?: string[] }): Promise<{ success: boolean; errors?: { code: number; message: string }[] }>;
  };
};

export async function purgeEdgeHtmlCache(ctx: EdgeCacheContext, delayMs = 0): Promise<boolean> {
  if (!ctx.cache?.purge) {
    console.warn('[workers-cache] ctx.cache 不可用（未开启 Workers Cache？），跳过边缘 purge');
    return false;
  }
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  try {
    const result = await ctx.cache.purge({ tags: [EDGE_HTML_CACHE_TAG] });
    if (!result.success) console.error('[workers-cache] purge 失败', result.errors);
    return result.success;
  } catch (error) {
    console.error('[workers-cache] purge 异常', error);
    return false;
  }
}
