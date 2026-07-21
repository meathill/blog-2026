import { describe, it, expect, vi } from 'vitest';
import { SITE_URL } from '../../src/lib/constants';
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';

// 回归背景：页面级 generateMetadata 曾 hardcode 中文文案，且 canonical 恒指 zh URL，
// 导致 /en 页面 title/description 为中文、canonical 指向 zh 版（issue #5）
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const all = (locale === 'en' ? enMessages : zhMessages) as Record<string, Record<string, string>>;
    const ns = all[namespace];
    if (!ns) throw new Error(`namespace ${namespace} 不存在于 messages/${locale}.json`);
    return (key: string, values?: Record<string, string | number>) => {
      let message = ns[key];
      if (message === undefined) throw new Error(`key ${namespace}.${key} 不存在于 messages/${locale}.json`);
      for (const [k, v] of Object.entries(values ?? {})) {
        message = message.replaceAll(`{${k}}`, String(v));
      }
      return message;
    };
  },
}));

// routing.ts 会经 createNavigation 拉入 next/navigation，vitest 下 ESM 解析失败，mock 掉
vi.mock('next-intl/navigation', () => ({
  createNavigation: () => ({}),
}));

vi.mock('../../src/lib/wordpress', () => ({
  getPosts: vi.fn(),
  getCategories: vi.fn(),
  getCategoryBySlug: vi.fn(async () => ({ id: 1, name: 'Cloudflare', slug: 'cloudflare' })),
  getTagBySlug: vi.fn(async () => ({ id: 2, name: 'Workers', slug: 'workers' })),
  getUserBySlug: vi.fn(async () => ({ id: 3, name: 'Meathill', slug: 'meathill' })),
  getPostsByCategory: vi.fn(),
  getPostsByTag: vi.fn(),
  calculateReadingTime: vi.fn(() => 1),
  formatDate: vi.fn(() => ''),
  stripHtml: vi.fn((s: string) => s),
}));
vi.mock('../../src/components/posts/post-list', () => ({ PostList: () => null }));
vi.mock('../../src/components/posts/post-list-item', () => ({ PostListItem: () => null }));
vi.mock('../../src/components/Pagination', () => ({ Pagination: () => null }));
vi.mock('../../src/components/home/TagCloud', () => ({ default: () => null }));
vi.mock('../../src/components/search/search-results-client', () => ({ SearchResultsClient: () => null }));
vi.mock('../../src/components/AwesomeComment', () => ({ default: () => null }));
vi.mock('../../src/actions/about', () => ({ getAboutContent: vi.fn() }));

import { generateMetadata as postsMetadata } from '../../src/app/[locale]/(public)/posts/page';
import { generateMetadata as postsPageNumMetadata } from '../../src/app/[locale]/(public)/posts/page/[num]/page';
import { generateMetadata as searchMetadata } from '../../src/app/[locale]/(public)/search/page';
import { generateMetadata as aboutMetadata } from '../../src/app/[locale]/(public)/about/page';
import { generateMetadata as categoryMetadata } from '../../src/app/[locale]/(public)/category/[...slug]/page';
import { generateMetadata as tagMetadata } from '../../src/app/[locale]/(public)/tag/[slug]/page';
import { generateMetadata as authorMetadata } from '../../src/app/[locale]/(public)/posts/author/[slug]/page';

function params<T extends Record<string, unknown>>(value: T) {
  return { params: Promise.resolve(value) };
}

describe('posts 列表页 metadata', () => {
  it('en 返回英文文案，canonical 指向 /en/posts', async () => {
    const metadata = await postsMetadata(params({ locale: 'en' }));
    expect(metadata.title).toBe('Tech Insights');
    expect(metadata.description).toMatch(/Cloudflare full-stack/);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/posts`);
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/en/posts`);
  });

  it('zh 返回中文文案，canonical 指向 /posts，hreflang 双语齐全', async () => {
    const metadata = await postsMetadata(params({ locale: 'zh' }));
    expect(metadata.title).toBe('技术洞察');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/posts`);
    expect(metadata.alternates?.languages).toEqual({
      zh: `${SITE_URL}/posts`,
      en: `${SITE_URL}/en/posts`,
    });
  });
});

describe('posts 归档分页 metadata', () => {
  it('en 分页标题为英文并插入页码，canonical 带 /en 前缀', async () => {
    const metadata = await postsPageNumMetadata(params({ locale: 'en', num: '3' }));
    expect(metadata.title).toBe('Post Archive - Page 3');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/posts/page/3`);
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it('zh 分页标题为中文并插入页码', async () => {
    const metadata = await postsPageNumMetadata(params({ locale: 'zh', num: '3' }));
    expect(metadata.title).toBe('文章归档 - 第 3 页');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/posts/page/3`);
  });
});

describe('search 页 metadata', () => {
  it('en 无关键词返回英文标题，canonical 带 /en', async () => {
    const metadata = await searchMetadata({
      ...params({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata.title).toBe('Search Posts');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/search`);
  });

  it('en 带关键词时标题为英文并插入关键词', async () => {
    const metadata = await searchMetadata({
      ...params({ locale: 'en' }),
      searchParams: Promise.resolve({ q: 'cloudflare' }),
    });
    expect(metadata.title).toBe('Search: cloudflare');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/search?q=cloudflare`);
  });

  it('zh 带关键词时标题为中文', async () => {
    const metadata = await searchMetadata({
      ...params({ locale: 'zh' }),
      searchParams: Promise.resolve({ q: 'cloudflare' }),
    });
    expect(metadata.title).toBe('搜索: cloudflare');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/search?q=cloudflare`);
  });
});

describe('about 页 metadata', () => {
  it('en 返回英文 title/description（title 不再自带品牌名，交给根 template）', async () => {
    const metadata = await aboutMetadata(params({ locale: 'en' }));
    expect(metadata.title).toBe('About Me');
    expect(metadata.description).toMatch(/20\+ years of full-stack experience/);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/about`);
  });

  it('zh 返回中文 title/description', async () => {
    const metadata = await aboutMetadata(params({ locale: 'zh' }));
    expect(metadata.title).toBe('关于我');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/about`);
  });
});

describe('category 页 metadata', () => {
  it('en 标题为英文并插入分类名，canonical 带 /en', async () => {
    const metadata = await categoryMetadata(params({ locale: 'en', slug: ['cloudflare'] }));
    expect(metadata.title).toBe('Cloudflare - Category');
    expect(metadata.description).toBe('Browse all posts in the Cloudflare category');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/category/cloudflare`);
  });

  it('zh 分页标题为中文并插入页码，分页 noindex', async () => {
    const metadata = await categoryMetadata(params({ locale: 'zh', slug: ['cloudflare', 'page', '2'] }));
    expect(metadata.title).toBe('Cloudflare - 文章分类 - 第 2 页');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/category/cloudflare/page/2`);
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

describe('tag / author 页 metadata', () => {
  it('en tag 页标题为英文并插入标签名', async () => {
    const metadata = await tagMetadata(params({ locale: 'en', slug: 'workers' }));
    expect(metadata.title).toBe('Workers - Tag');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/tag/workers`);
  });

  it('zh author 页标题为中文并插入作者名', async () => {
    const metadata = await authorMetadata(params({ locale: 'zh', slug: 'meathill' }));
    expect(metadata.title).toBe('Meathill 的文章归档');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/posts/author/meathill`);
  });

  it('en author 页标题为英文，canonical 带 /en', async () => {
    const metadata = await authorMetadata(params({ locale: 'en', slug: 'meathill' }));
    expect(metadata.title).toBe('Posts by Meathill');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/posts/author/meathill`);
  });
});
