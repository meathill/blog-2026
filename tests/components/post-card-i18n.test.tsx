import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTranslator } from 'next-intl';
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';
import PostCard from '@/components/PostCard';
import type { WPPost } from '@/lib/wordpress/types';

const state = vi.hoisted(() => ({ locale: 'zh' }));

vi.mock('next-intl/server', () => ({
  getTranslations: async (options: string | { locale: string; namespace: string }) => {
    const locale = typeof options === 'string' ? state.locale : options.locale;
    const namespace = typeof options === 'string' ? options : options.namespace;
    return createTranslator({
      locale,
      messages: (locale === 'en' ? enMessages : zhMessages) as Record<string, Record<string, string>>,
      namespace,
    });
  },
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/wordpress', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/wordpress')>()),
}));

function parseMarkup(element: React.ReactElement) {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

const post = {
  id: 1,
  slug: 'hello-world',
  date: '2026-01-01',
  title: { rendered: 'Hello World' },
  excerpt: { rendered: 'An intro post' },
  content: { rendered: '<p>body</p>' },
  categories: [1],
  tags: [],
  featured_media: 0,
} as unknown as WPPost;

describe.each([
  { locale: 'zh', unit: '1 分钟', more: '阅读全文' },
  { locale: 'en', unit: '1 min read', more: 'Read more' },
])('PostCard 双语文案（$locale）', ({ locale, unit, more }) => {
  beforeEach(() => {
    state.locale = locale;
  });

  it('阅读时长与悬浮文案按 locale 输出', async () => {
    const html = parseMarkup(await PostCard({ post }));

    expect(html.body.textContent).toContain(unit);
    expect(html.body.textContent).toContain(more);
    // 非重点文章不显示「推荐 / Featured」标记
    expect(html.body.textContent).not.toContain('Featured');
    expect(html.body.textContent).not.toContain('推荐');
  });

  it('重点文章显示 featured 标记', async () => {
    const html = parseMarkup(await PostCard({ post, featured: true }));
    expect(html.body.textContent).toContain(locale === 'en' ? 'Featured' : '推荐');
  });
});
