import { describe, it, expect } from 'vitest';
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from '@/lib/seo/jsonld';
import { SITE_URL } from '@/lib/constants';

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
