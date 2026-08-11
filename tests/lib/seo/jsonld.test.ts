import { describe, expect, it } from 'vitest';
import { SITE_URL } from '@/lib/constants';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/lib/seo/jsonld';

describe('seo/jsonld', () => {
  describe('buildArticleJsonLd', () => {
    const base = {
      title: '在 Cloudflare Worker 上部署 Next.js',
      description: '最佳实践',
      url: `${SITE_URL}/posts/next-js/best-practice`,
      datePublished: '2026-01-01T00:00:00',
      dateModified: '2026-05-01T00:00:00',
      locale: 'zh',
    };

    it('生成 BlogPosting 并带规范字段', () => {
      const result = buildArticleJsonLd(base);
      expect(result['@type']).toBe('BlogPosting');
      expect(result.headline).toBe(base.title);
      expect(result.url).toBe(base.url);
      expect(result.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': base.url });
      expect(result.datePublished).toBe(base.datePublished);
      expect(result.dateModified).toBe(base.dateModified);
      expect(result.inLanguage).toBe('zh-CN');
      expect(result.author).toMatchObject({ '@type': 'Person', url: SITE_URL });
    });

    it('dateModified 缺省时回退到 datePublished', () => {
      const result = buildArticleJsonLd({ ...base, dateModified: undefined });
      expect(result.dateModified).toBe(base.datePublished);
    });

    it('en locale 输出 en-US', () => {
      const result = buildArticleJsonLd({ ...base, locale: 'en' });
      expect(result.inLanguage).toBe('en-US');
    });

    it('提供 image 时输出 image 数组，否则省略', () => {
      const withImage = buildArticleJsonLd({ ...base, image: 'https://img/x.png' });
      expect(withImage.image).toEqual(['https://img/x.png']);
      const without = buildArticleJsonLd(base);
      expect('image' in without).toBe(false);
    });

    it('提供 keywords 时输出，空数组省略', () => {
      const withKw = buildArticleJsonLd({ ...base, keywords: ['cloudflare', 'next.js'] });
      expect(withKw.keywords).toEqual(['cloudflare', 'next.js']);
      const without = buildArticleJsonLd({ ...base, keywords: [] });
      expect('keywords' in without).toBe(false);
    });
  });

  describe('buildBreadcrumbJsonLd', () => {
    it('按顺序生成 ListItem，position 从 1 递增', () => {
      const result = buildBreadcrumbJsonLd([
        { name: '首页', url: SITE_URL },
        { name: 'Next.js', url: `${SITE_URL}/category/next-js` },
        { name: '文章标题', url: `${SITE_URL}/posts/next-js/x` },
      ]);
      expect(result['@type']).toBe('BreadcrumbList');
      expect(result.itemListElement).toHaveLength(3);
      expect(result.itemListElement[0]).toEqual({ '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL });
      expect(result.itemListElement[2].position).toBe(3);
    });

    it('过滤 name 为空/空白的条目并重排 position', () => {
      const result = buildBreadcrumbJsonLd([
        { name: '首页', url: SITE_URL },
        { name: '', url: `${SITE_URL}/category/empty` },
        { name: '   ', url: `${SITE_URL}/category/blank` },
        { name: '文章标题', url: `${SITE_URL}/posts/x` },
      ]);
      expect(result.itemListElement).toHaveLength(2);
      expect(result.itemListElement.map((item) => item.position)).toEqual([1, 2]);
      expect(result.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: '文章标题',
        item: `${SITE_URL}/posts/x`,
      });
    });
  });

  describe('buildOrganizationJsonLd', () => {
    it('生成 Organization，@id 供 WebSite 引用，sameAs 含社交链接', () => {
      const result = buildOrganizationJsonLd();
      expect(result['@type']).toBe('Organization');
      expect(result['@id']).toBe(`${SITE_URL}/#organization`);
      expect(result.url).toBe(SITE_URL);
      expect(result.logo).toBe(`${SITE_URL}/favicon.webp`);
      expect(result.sameAs).toContain('https://github.com/meathill');
    });
  });

  describe('buildWebSiteJsonLd', () => {
    it('生成 WebSite，publisher 通过 @id 引用 Organization，SearchAction 指向站内搜索', () => {
      const result = buildWebSiteJsonLd('zh');
      expect(result['@type']).toBe('WebSite');
      expect(result.url).toBe(SITE_URL);
      expect(result.inLanguage).toBe('zh-CN');
      expect(result.publisher).toEqual({ '@id': `${SITE_URL}/#organization` });
      expect(result.potentialAction.target).toBe(`${SITE_URL}/search?q={search_term_string}`);
      expect(result.potentialAction['query-input']).toBe('required name=search_term_string');
    });

    it('en locale 输出 en-US', () => {
      expect(buildWebSiteJsonLd('en').inLanguage).toBe('en-US');
    });
  });

  describe('buildItemListJsonLd', () => {
    it('生成 ItemList，与 solutions 列表页原内联结构一致', () => {
      const baseUrl = SITE_URL;
      const result = buildItemListJsonLd({
        name: 'Solutions 标题',
        description: 'Solutions 简介',
        items: [
          { url: `${baseUrl}/solutions/foo`, name: 'Foo 方案' },
          { url: `${baseUrl}/solutions/bar`, name: 'Bar 方案' },
        ],
      });
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Solutions 标题',
        description: 'Solutions 简介',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: `${baseUrl}/solutions/foo`, name: 'Foo 方案' },
          { '@type': 'ListItem', position: 2, url: `${baseUrl}/solutions/bar`, name: 'Bar 方案' },
        ],
      });
    });

    it('生成 ItemList，与 skills 列表页原内联结构一致', () => {
      const baseUrl = SITE_URL;
      const result = buildItemListJsonLd({
        name: 'Skills 标题',
        description: 'Skills 简介',
        items: [{ url: `${baseUrl}/skills/foo`, name: 'Foo Skill' }],
      });
      expect(result).toEqual({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Skills 标题',
        description: 'Skills 简介',
        itemListElement: [{ '@type': 'ListItem', position: 1, url: `${baseUrl}/skills/foo`, name: 'Foo Skill' }],
      });
    });

    it('空 items 时 itemListElement 为空数组', () => {
      const result = buildItemListJsonLd({ name: 'Empty', description: 'Empty desc', items: [] });
      expect(result.itemListElement).toEqual([]);
    });

    it('过滤 name 为空的条目并重排 position', () => {
      const result = buildItemListJsonLd({
        name: '列表',
        description: 'desc',
        items: [
          { url: `${SITE_URL}/solutions/foo`, name: 'Foo 方案' },
          { url: `${SITE_URL}/solutions/empty`, name: '' },
          { url: `${SITE_URL}/solutions/bar`, name: 'Bar 方案' },
        ],
      });
      expect(result.itemListElement).toHaveLength(2);
      expect(result.itemListElement.map((item) => item.position)).toEqual([1, 2]);
      expect(result.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        url: `${SITE_URL}/solutions/bar`,
        name: 'Bar 方案',
      });
    });

    it('全部 name 为空时 itemListElement 为空数组', () => {
      const result = buildItemListJsonLd({
        name: 'Empty',
        description: 'desc',
        items: [{ url: `${SITE_URL}/x`, name: '  ' }],
      });
      expect(result.itemListElement).toEqual([]);
    });
  });

  describe('buildFaqJsonLd', () => {
    it('空数组返回 null（不产出空 schema）', () => {
      expect(buildFaqJsonLd([])).toBeNull();
    });

    it('生成 FAQPage，问答映射为 Question/Answer', () => {
      const result = buildFaqJsonLd([{ question: 'Q1?', answer: 'A1.' }]);
      expect(result).not.toBeNull();
      expect(result!['@type']).toBe('FAQPage');
      expect(result!.mainEntity).toHaveLength(1);
      expect(result!.mainEntity[0]).toEqual({
        '@type': 'Question',
        name: 'Q1?',
        acceptedAnswer: { '@type': 'Answer', text: 'A1.' },
      });
    });
  });
});
