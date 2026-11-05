import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const { mockIntlMiddleware } = vi.hoisted(() => ({
  mockIntlMiddleware: vi.fn(),
}));

vi.mock('next-intl/middleware', () => ({
  default: () => mockIntlMiddleware,
}));

vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  },
}));

// Import after mocks
import middleware from '@/middleware';

describe('Middleware', () => {
  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    mockIntlMiddleware.mockClear();
  });

  // --- 已有用例 (已修正为 async) ---

  it('should redirect .html paths to canonical paths', async () => {
    const req = new NextRequest(new URL('/en/tech/article.html', BASE_URL));
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(res?.status).toBe(301);
    // Issue #19：博客内容无 en 版，一步直达中文 canonical，消除 301 重定向链
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect .html/amp paths to canonical paths', async () => {
    const req = new NextRequest(new URL('/tech/article.html/amp', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should redirect /amp suffix paths to canonical paths', async () => {
    const req = new NextRequest(new URL('/tech/article/amp', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should redirect legacy paths (segment >= 2) to /posts/', async () => {
    const req = new NextRequest(new URL('/en/tech/article', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    // Issue #19：博客内容无 en 版，一步直达中文 canonical，消除 301 重定向链
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should redirect legacy paths without locale to /posts/', async () => {
    const req = new NextRequest(new URL('/tech/article', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should NOT redirect standard paths like /about', async () => {
    const req = new NextRequest(new URL('/en/about', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it.each(['/friend', '/en/friend', '/zh/friend'])('友链页 %s 不进入旧文章重定向', async (pathname) => {
    const req = new NextRequest(new URL(pathname, BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalledWith(req);
  });

  // 博客内容（posts/category/tag/search）无英文版，/en 形态一律 301 去掉前缀归一回中文页
  it('should 301 /en blog-content paths to zh paths (strip en prefix)', async () => {
    const cases: Array<[string, string]> = [
      ['/en/posts', '/posts'],
      ['/en/posts/', '/posts/'],
      ['/en/posts/tech/article', '/posts/tech/article'],
      [
        '/en/posts/安全和架构/zeabur-hacked-plaintext-api-keys-and-zero-trust-hsm',
        '/posts/安全和架构/zeabur-hacked-plaintext-api-keys-and-zero-trust-hsm',
      ],
      ['/en/posts/page/12', '/posts/page/12'],
      ['/en/posts/author/meathill', '/posts/author/meathill'],
      ['/en/category/cloudflare', '/category/cloudflare'],
      ['/en/category/cloudflare/page/2', '/category/cloudflare/page/2'],
      ['/en/tag/memory', '/tag/memory'],
      ['/en/tag/memory/page/3', '/tag/memory/page/3'],
      ['/en/search', '/search'],
    ];
    for (const [path, target] of cases) {
      const res = await middleware(new NextRequest(new URL(path, BASE_URL)));

      expect(res?.status).toBe(301);
      expect(res?.headers.get('Location')).toBe(`${BASE_URL}${encodeURI(target)}`);
    }
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should drop query params when stripping /en prefix', async () => {
    const req = new NextRequest(new URL('/en/posts/tech/article?utm_source=x', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should NOT strip /en prefix for paths that merely start with blog prefixes', async () => {
    const req = new NextRequest(new URL('/en/postsfoo', BASE_URL));
    const res = await middleware(req);

    // 顶部 slug 不在 TOP_LEVEL_ROUTES 里，走通用 legacy 逻辑，但绝不能命中博客内容拦截
    expect(res?.headers.get('Location')).not.toBe(`${BASE_URL}/postsfoo`);
  });

  it('should NOT redirect /posts paths', async () => {
    const req = new NextRequest(new URL('/posts/tech/article', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect /solutions (top-level route, not a legacy category)', async () => {
    const req = new NextRequest(new URL('/solutions', BASE_URL));
    const res = await middleware(req);
    // 不应被当成 legacy 分类重定向到 /category/solutions
    expect(res?.headers.get('Location')).not.toBe(`${BASE_URL}/category/solutions`);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect /solutions/:slug detail paths', async () => {
    const req = new NextRequest(new URL('/solutions/cloudflare-fullstack', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should redirect /tags/xxx to /tag/xxx directly without locale prefix', async () => {
    const req = new NextRequest(new URL('/tags/memory', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/tag/memory`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect /en/tags/xxx to /tag/xxx directly (flatten 301 chain)', async () => {
    const req = new NextRequest(new URL('/en/tags/memory', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/tag/memory`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should NOT redirect /tag/xxx', async () => {
    const req = new NextRequest(new URL('/tag/memory', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should redirect /page/3 to /posts/page/3', async () => {
    const req = new NextRequest(new URL('/page/3', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/page/3`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect /en/page/3 to /posts/page/3 directly (flatten 301 chain)', async () => {
    const req = new NextRequest(new URL('/en/page/3', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/page/3`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect /sponsors to GitHub Sponsors', async () => {
    const req = new NextRequest(new URL('/sponsors', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe('https://github.com/sponsors/meathill');
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect author archive paths to /posts/author/:slug/page/:num', async () => {
    const req = new NextRequest(new URL('/author/meathill/page/24', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/author/meathill/page/24`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect /en/author archive paths directly to /posts/author/:slug/page/:num', async () => {
    const req = new NextRequest(new URL('/en/author/meathill/page/24', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/author/meathill/page/24`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should drop legacy query params when redirecting author archive paths', async () => {
    const req = new NextRequest(new URL('/author/meathill/page/64?ak_action=reject_mobile', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/author/meathill/page/64`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should drop legacy query params when redirecting /page/:num', async () => {
    const req = new NextRequest(new URL('/page/54?callback=ngg-ajax', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/page/54`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // --- 新增用例：Feed Rewrite ---

  it('should rewrite /tag/foo/feed to /feed/tag/foo', async () => {
    const req = new NextRequest(new URL('/tag/foo/feed', BASE_URL));
    const res = await middleware(req);

    // rewrite 不会改变 status，但 NextResponse.rewrite 会设置 x-middleware-rewrite header
    expect(res).toBeInstanceOf(NextResponse);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should rewrite /category/life/feed to /feed/category/life', async () => {
    const req = new NextRequest(new URL('/category/life/feed', BASE_URL));
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // --- 新增用例：Category Pagination and Single-Segment ---

  it('should redirect /tech/page/22 to /category/tech/page/22', async () => {
    const req = new NextRequest(new URL('/tech/page/22', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/category/tech/page/22`);
  });

  // /tech 是产品栏目根路径，交给 intlMiddleware 正常渲染，不再重定向
  it('should NOT redirect /tech (top-level route, renders normally)', async () => {
    const req = new NextRequest(new URL('/tech', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should still redirect /tech/article to /posts/tech/article', async () => {
    const req = new NextRequest(new URL('/tech/article', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  // --- 新增用例：/tech 子栏目放行 ---

  it('should NOT redirect /tech/compare (valid tech section)', async () => {
    const req = new NextRequest(new URL('/tech/compare', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect /en/tech/guides (valid tech section with locale prefix)', async () => {
    const req = new NextRequest(new URL('/en/tech/guides', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should redirect /tech/compare/foo (3 segments) to /posts/tech/compare/foo', async () => {
    const req = new NextRequest(new URL('/tech/compare/foo', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/compare/foo`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // Issue #11：img_* 是已删除的旧站附件残留 slug（媒体库无对应 media），直接 410，
  // 不再 301 到 /posts/img_* 转一圈形成 broken redirect。
  it('should return 410 for legacy attachment slugs like /img_0226', async () => {
    const req = new NextRequest(new URL('/img_0226', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(410);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should return 410 for /en/img_0215, /posts/img_0224 and /en/posts/img_0224', async () => {
    for (const path of ['/en/img_0215', '/posts/img_0224', '/en/posts/img_0224']) {
      const req = new NextRequest(new URL(path, BASE_URL));
      const res = await middleware(req);

      expect(res?.status).toBe(410);
    }
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // Issue #11：已删除的 honey 旧文（拼写错误的重复文）→ 301 到同主题存活文
  // Issue #19：博客内容无 en 版，带 /en 请求一步直达中文 canonical，消除 301 重定向链
  it('should 301 deleted honey legacy URLs to the surviving phu-quoc article', async () => {
    const cases: Array<[string, string]> = [
      ['/honey-moon-in-phu-guoc-vietenam', '/posts/travel/second-time-to-phu-quoc-island'],
      ['/en/honey-moon-in-phu-guoc-vietenam', '/posts/travel/second-time-to-phu-quoc-island'],
      ['/posts/honey-moon-in-phu-guoc-vietenam', '/posts/travel/second-time-to-phu-quoc-island'],
      ['/en/posts/honey-moon-in-phu-guoc-vietenam', '/posts/travel/second-time-to-phu-quoc-island'],
    ];
    for (const [path, target] of cases) {
      const req = new NextRequest(new URL(path, BASE_URL));
      const res = await middleware(req);

      expect(res?.status).toBe(301);
      expect(res?.headers.get('Location')).toBe(`${BASE_URL}${target}`);
    }
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // Issue #11：已删除的 wordpressmysql8 旧文（.html / 多段 legacy / posts 内形态）→ 301 到 lnmp 存活文
  // Issue #19：博客内容无 en 版，带 /en 请求一步直达中文 canonical
  it('should 301 deleted wordpressmysql8 legacy URLs to the surviving lnmp article', async () => {
    const cases: Array<[string, string]> = [
      ['/internet/wp/wordpressmysql8.html', '/posts/serverside/setting-lnmp-on-ubuntu-16-04'],
      ['/internet/wp/wordpressmysql8', '/posts/serverside/setting-lnmp-on-ubuntu-16-04'],
      ['/posts/internet/wp/wordpressmysql8', '/posts/serverside/setting-lnmp-on-ubuntu-16-04'],
      ['/en/internet/wp/wordpressmysql8.html', '/posts/serverside/setting-lnmp-on-ubuntu-16-04'],
    ];
    for (const [path, target] of cases) {
      const req = new NextRequest(new URL(path, BASE_URL));
      const res = await middleware(req);

      expect(res?.status).toBe(301);
      expect(res?.headers.get('Location')).toBe(`${BASE_URL}${target}`);
    }
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // Issue #11：已删除的 gitbook 旧文无对等继任页 → 直接 410
  it('should return 410 for deleted gitbook legacy URLs', async () => {
    for (const path of [
      '/gitbook-webpack-for-multi-pages',
      '/gitbook-webpack-for-multi-pages/',
      '/en/gitbook-webpack-for-multi-pages',
      '/posts/gitbook-webpack-for-multi-pages',
    ]) {
      const req = new NextRequest(new URL(path, BASE_URL));
      const res = await middleware(req);

      expect(res?.status).toBe(410);
    }
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // Issue #13：两条 GSC 旧文死链 → 301 到现存文章
  // Issue #19：博客无 en 版，带 /en 请求一步直达中文 canonical
  it('should 301 issue #13 legacy article URLs to their live successors', async () => {
    const rn = '/posts/app/2024-how-to-setup-react-native-develop-environment-in-china-mainland';
    const sso = '/posts/chrome/chrome-extension-sso-fix-err_blocked_by_client';
    const cases: Array<[string, string]> = [
      ['/posts/2024-how-to-setup-react-native-development-environment-in-china-mainland', rn],
      ['/2024-how-to-setup-react-native-development-environment-in-china-mainland', rn],
      ['/en/posts/2024-how-to-setup-react-native-development-environment-in-china-mainland', rn],
      ['/en/posts/chrome/chrome-extension-sso-fix-error_blocked_by_client', sso],
      ['/posts/chrome/chrome-extension-sso-fix-error_blocked_by_client', sso],
    ];
    for (const [path, target] of cases) {
      const res = await middleware(new NextRequest(new URL(path, BASE_URL)));

      expect(res?.status).toBe(301);
      expect(res?.headers.get('Location')).toBe(`${BASE_URL}${target}`);
    }
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // Issue #13：/posts/page/1 → 301 /posts；Issue #19 起 /en/posts/page/1 也直接归一到 /posts
  it('should 301 /posts/page/1 to /posts (with locale prefix)', async () => {
    const cases: Array<[string, string]> = [
      ['/posts/page/1', '/posts'],
      ['/zh/posts/page/1', '/posts'],
      ['/en/posts/page/1', '/posts'],
    ];
    for (const [path, target] of cases) {
      const res = await middleware(new NextRequest(new URL(path, BASE_URL)));

      expect(res?.status).toBe(301);
      expect(res?.headers.get('Location')).toBe(`${BASE_URL}${target}`);
    }
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should pass /posts/page/2 and /posts/page/10 through to intl middleware', async () => {
    for (const path of ['/posts/page/2', '/posts/page/10']) {
      await middleware(new NextRequest(new URL(path, BASE_URL)));
    }
    expect(mockIntlMiddleware).toHaveBeenCalledTimes(2);
  });

  // --- 新增用例：attachment_id ---

  it('should return 404 for ?attachment_id when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

    const req = new NextRequest(new URL('/?attachment_id=9999', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(404);
    vi.restoreAllMocks();
  });

  it('should return 404 for ?attachment_id when API returns 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

    const req = new NextRequest(new URL('/?attachment_id=9999', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(404);
    vi.restoreAllMocks();
  });

  it('should redirect for ?attachment_id when API returns source_url', async () => {
    vi.stubEnv('CF_ACCESS_CLIENT_ID', 'test-client-id');
    vi.stubEnv('CF_ACCESS_CLIENT_SECRET', 'test-client-secret');
    vi.stubEnv('WORDPRESS_API_URL', 'https://blog.meathill.com/wp-json/wp/v2');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ source_url: 'https://blog.meathill.com/uploads/img.jpg' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const req = new NextRequest(new URL('/?attachment_id=2035', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe('https://blog.meathill.com/uploads/img.jpg');
    expect(fetchSpy).toHaveBeenCalledWith('https://blog.meathill.com/wp-json/wp/v2/media/2035', {
      headers: expect.objectContaining({
        'CF-Access-Client-Id': 'test-client-id',
        'CF-Access-Client-Secret': 'test-client-secret',
        'Content-Type': 'application/json',
        'User-Agent': 'Next.js Worker',
      }),
    });

    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // --- Issue #18: Markdown Content Negotiation ---

  it('当请求内容页且带 Accept: text/markdown 时 rewrite 到 /api/markdown-negotiation 并带 Vary: Accept', async () => {
    const req = new NextRequest(new URL('/posts/tech/my-post', BASE_URL), {
      headers: { Accept: 'text/markdown, text/html;q=0.9' },
    });
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(res?.headers.get('Vary')).toContain('Accept');
    expect(res?.headers.get('x-middleware-rewrite')).toContain(
      '/api/markdown-negotiation?path=%2Fposts%2Ftech%2Fmy-post',
    );
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('当普通浏览器请求内容页时返回页面并补充 Vary: Accept 响应头', async () => {
    mockIntlMiddleware.mockReturnValueOnce(new NextResponse('ok', { status: 200 }));

    const req = new NextRequest(new URL('/posts/tech/my-post', BASE_URL), {
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9' },
    });
    const res = await middleware(req);

    expect(mockIntlMiddleware).toHaveBeenCalled();
    expect(res?.headers.get('Vary')).toContain('Accept');
  });

  it('非协商路径（如关于页）不强制添加 Vary: Accept', async () => {
    mockIntlMiddleware.mockReturnValueOnce(new NextResponse('ok', { status: 200 }));

    const req = new NextRequest(new URL('/about', BASE_URL), {
      headers: { Accept: 'text/html' },
    });
    const res = await middleware(req);

    expect(mockIntlMiddleware).toHaveBeenCalled();
    expect(res?.headers.get('Vary')).toBeNull();
  });
});
