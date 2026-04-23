import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = process.env.NEXT_PUBLIC_SEARCH_API_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SEARCH_API_URL = 'https://mui-search.example.com';
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SEARCH_API_URL = ORIGINAL_ENV;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('mui-search client', () => {
  it('stripFragment 去掉 #section 还原 base slug', async () => {
    const { __internals } = await import('@/lib/mui-search/client');
    expect(__internals.stripFragment('my-post')).toBe('my-post');
    expect(__internals.stripFragment('my-post#section-a')).toBe('my-post');
    expect(__internals.stripFragment('')).toBe('');
  });

  it('dedupeByBaseSlug 保留首次出现的 chunk', async () => {
    const { __internals } = await import('@/lib/mui-search/client');
    const raw = [
      { id: '1', slug: 'post-a#intro', title: 'A', content: 'a1', score: 0.9 },
      { id: '2', slug: 'post-a#section', title: 'A', content: 'a2', score: 0.8 },
      { id: '3', slug: 'post-b', title: 'B', content: 'b', score: 0.7 },
    ];
    const deduped = __internals.dedupeByBaseSlug(raw);
    expect(deduped.map((r) => r.slug)).toEqual(['post-a', 'post-b']);
    expect(deduped[0]!.id).toBe('1');
  });

  it('searchContent 构造正确的 URL 并解析响应', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: '42',
              slug: 'hello-world#intro',
              title: 'Hello',
              content: 'world',
              score: 0.95,
              locale: 'zh',
              publishedAt: '2024-06-01T00:00:00',
              categoryName: '前端',
              readingTimeMinutes: 3,
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { searchContent } = await import('@/lib/mui-search/client');
    const { results, total } = await searchContent({ query: 'hello', locale: 'zh', limit: 5 });

    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0]!;
    const url = new URL(call[0] as string);
    expect(url.host).toBe('mui-search.example.com');
    expect(url.pathname).toBe('/api/search');
    expect(url.searchParams.get('q')).toBe('hello');
    expect(url.searchParams.get('locale')).toBe('zh');
    expect(url.searchParams.get('limit')).toBe('5');

    expect(total).toBe(1);
    expect(results).toHaveLength(1);
    expect(results[0]!.slug).toBe('hello-world');
    expect(results[0]!.categoryName).toBe('前端');
    expect(results[0]!.readingTimeMinutes).toBe(3);
  });

  it('searchContent 空 query 直接返回空结果，不发请求', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { searchContent } = await import('@/lib/mui-search/client');
    const result = await searchContent({ query: '   ' });
    expect(result).toEqual({ results: [], total: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('trackClick 优先用 sendBeacon', async () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { sendBeacon } as unknown as Navigator);

    const { trackClick } = await import('@/lib/mui-search/client');
    trackClick({ query: 'q', contentId: '1', contentTitle: 't', locale: 'zh' });

    expect(sendBeacon).toHaveBeenCalledOnce();
    const url = sendBeacon.mock.calls[0]![0] as string;
    expect(url).toBe('https://mui-search.example.com/api/click');
  });

  it('trackClick 失败时不抛异常', async () => {
    vi.stubGlobal('navigator', { sendBeacon: vi.fn().mockReturnValue(false) } as unknown as Navigator);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { trackClick } = await import('@/lib/mui-search/client');
    expect(() => trackClick({ query: 'q', contentId: '1', contentTitle: 't' })).not.toThrow();
  });
});
