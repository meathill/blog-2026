// 浏览器端 mui-search 客户端：直接 fetch + sendBeacon 统计点击
// 不依赖 Cloudflare 上下文，完全跑在客户端

export interface MuiSearchResult {
  id: string;
  slug: string;
  title: string;
  content: string; // 120 字符片段
  score: number;
  locale?: string;
  url?: string;
  publishedAt?: string | null;
  categoryName?: string | null;
  readingTimeMinutes?: number | null;
}

interface RawHybridSearchResult {
  id: string;
  slug?: string;
  title: string;
  content: string;
  score: number;
  locale?: string;
  url?: string;
  publishedAt?: string | null;
  categoryName?: string | null;
  readingTimeMinutes?: number | null;
}

interface SearchResponseBody {
  success: boolean;
  data: RawHybridSearchResult[];
  message?: string;
}

interface SearchParams {
  query: string;
  locale?: string;
  limit?: number;
  signal?: AbortSignal;
}

interface ClickPayload {
  query: string;
  contentId: string;
  contentTitle: string;
  locale?: string;
}

const DEFAULT_LIMIT = 10;

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_SEARCH_API_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_SEARCH_API_URL 未配置');
  }
  return base.replace(/\/+$/, '');
}

// 把 "post-slug#fragment" 还原成 "post-slug"
function stripFragment(slug: string): string {
  const hashIndex = slug.indexOf('#');
  return hashIndex === -1 ? slug : slug.slice(0, hashIndex);
}

// 同一 post 的多个 chunk 合并为一条，保留首次出现（分数最高）
function dedupeByBaseSlug(results: RawHybridSearchResult[]): MuiSearchResult[] {
  const seen = new Map<string, MuiSearchResult>();
  for (const raw of results) {
    const baseSlug = stripFragment(raw.slug ?? '');
    if (!baseSlug || seen.has(baseSlug)) {
      continue;
    }
    seen.set(baseSlug, {
      id: raw.id,
      slug: baseSlug,
      title: raw.title,
      content: raw.content,
      score: raw.score,
      locale: raw.locale,
      url: raw.url,
      publishedAt: raw.publishedAt ?? null,
      categoryName: raw.categoryName ?? null,
      readingTimeMinutes: raw.readingTimeMinutes ?? null,
    });
  }
  return Array.from(seen.values());
}

export async function searchContent(params: SearchParams): Promise<{ results: MuiSearchResult[]; total: number }> {
  const query = params.query.trim();
  if (!query) {
    return { results: [], total: 0 };
  }

  const url = new URL(`${getApiBase()}/api/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(params.limit ?? DEFAULT_LIMIT));
  if (params.locale) {
    url.searchParams.set('locale', params.locale);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(`search API ${response.status}: ${response.statusText}`);
  }

  const body = (await response.json()) as SearchResponseBody;
  if (!body.success) {
    throw new Error(body.message ?? 'search API 返回 success=false');
  }

  const results = dedupeByBaseSlug(body.data);
  return { results, total: results.length };
}

export function trackClick(payload: ClickPayload): void {
  try {
    const url = `${getApiBase()}/api/click`;
    const json = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([json], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) {
        return;
      }
    }
    // sendBeacon 不可用或失败时，降级用 fetch keepalive
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: json,
      keepalive: true,
    }).catch(() => {
      // 埋点失败不影响用户，静默
    });
  } catch {
    // 任何异常都不阻塞主流程
  }
}

// 导出内部函数供单测使用
export const __internals = { stripFragment, dedupeByBaseSlug };
