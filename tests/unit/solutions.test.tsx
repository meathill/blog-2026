import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTranslator } from 'next-intl';
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';
import Solutions from '@/components/home/Solutions';
import SolutionsListPage from '@/app/[locale]/(public)/solutions/page';
import SolutionDetailPage, { generateMetadata } from '@/app/[locale]/(public)/solutions/[slug]/page';
import { SITE_URL } from '@/lib/constants';
import { getCategoryBySlug, getPostsByCategory } from '@/lib/wordpress';

const state = vi.hoisted(() => ({ locale: 'zh' }));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getLocale: async () => state.locale,
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
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={state.locale === 'en' ? `/en${href}` : href}>{children}</a>
  ),
}));

vi.mock('@/lib/wordpress', () => ({
  getCategoryBySlug: vi.fn(),
  getPostsByCategory: vi.fn(),
}));
vi.mock('@/components/PostCard', () => ({ default: () => null }));

function parseMarkup(element: ReactNode) {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

describe.each([
  { locale: 'zh', title: '美国公司注册与出海收款', prefix: '' },
  { locale: 'en', title: 'US Company Formation & Global Payments', prefix: '/en' },
])('美国公司注册方案（$locale）', ({ locale, title, prefix }) => {
  beforeEach(() => {
    state.locale = locale;
    vi.clearAllMocks();
  });

  it('首页与方案列表展示第四项服务，并链接到对应语言的详情页', async () => {
    const pages = [await Solutions(), await SolutionsListPage({ params: Promise.resolve({ locale }) })];
    for (const element of pages) {
      const page = parseMarkup(element);
      expect(page.querySelectorAll('h3')).toHaveLength(4);
      expect(page.querySelector(`a[href="${prefix}/solutions/us-company-registration"]`)?.textContent).toBe(title);
    }
  });

  it('详情页列出注册与收款协助内容，并提供带服务主题的邮件咨询入口', async () => {
    const page = parseMarkup(
      await SolutionDetailPage({ params: Promise.resolve({ locale, slug: 'us-company-registration' }) }),
    );
    expect(page.querySelector('h1')?.textContent).toBe(title);
    expect(page.body.textContent).toContain('LLC');
    expect(page.body.textContent).toContain('EIN');
    expect(page.body.textContent).toContain('Stripe');
    expect(page.querySelector('a[href^="mailto:"]')?.getAttribute('href')).toBe(
      `mailto:meathill@gmail.com?subject=${encodeURIComponent(title)}`,
    );
    expect(getCategoryBySlug).not.toHaveBeenCalled();
    expect(getPostsByCategory).not.toHaveBeenCalled();
  });

  it('详情页元数据使用当前语言，并保留中英文 canonical 与 hreflang', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale, slug: 'us-company-registration' }) });
    expect(metadata.title).toBe(title);
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${prefix}/solutions/us-company-registration`);
    expect(metadata.alternates?.languages).toEqual({
      zh: `${SITE_URL}/solutions/us-company-registration`,
      en: `${SITE_URL}/en/solutions/us-company-registration`,
      'x-default': `${SITE_URL}/solutions/us-company-registration`,
    });
  });

  it('详情页回答费用、交付周期、材料和审核问题，并链接到真实办理与报价来源', async () => {
    const page = parseMarkup(
      await SolutionDetailPage({ params: Promise.resolve({ locale, slug: 'us-company-registration' }) }),
    );
    const pricing = page.querySelector('#company-pricing');
    expect(pricing?.textContent).toContain('$499');
    expect(pricing?.textContent).toContain('+$99');
    expect(pricing?.textContent).toContain('$399');
    expect(pricing?.textContent).toMatch(/可选|Optional/);

    const timeline = page.querySelector('#company-timeline');
    expect(timeline?.textContent).toMatch(/约两周|about two weeks/);
    expect(timeline?.textContent).toMatch(/1–2.*工作日|1–2 business days/);
    expect(timeline?.textContent).toMatch(/审核|review/);
    expect(page.querySelector('#company-requirements')?.textContent).toMatch(/护照|passport/);
    expect(page.querySelector('#company-requirements')?.textContent).toMatch(/地址证明|proof of address/);
    expect(page.querySelector('#company-faq')?.textContent).toContain('SSN');
    expect(page.querySelector('#company-faq')?.textContent).toContain('$150');
    expect(page.querySelector('a[href="https://incorporate.mizufinancial.com/"]')).not.toBeNull();
    const sourcePrefix = locale === 'en' ? '' : '/zh';
    expect(page.querySelector(`a[href="https://mizufinancial.com${sourcePrefix}/pricing"]`)).not.toBeNull();
    expect(page.querySelectorAll('h1')).toHaveLength(1);
  });
});

it('其他技术方案保留原来的交付内容，不展示公司注册的价格或办理入口', async () => {
  state.locale = 'zh';
  vi.mocked(getCategoryBySlug).mockResolvedValue(null);
  const page = parseMarkup(
    await SolutionDetailPage({ params: Promise.resolve({ locale: 'zh', slug: 'cloudflare-fullstack' }) }),
  );
  expect(page.querySelector('h1')?.textContent).toBe('Cloudflare 全栈架构与迁移');
  expect(page.body.textContent).toContain('我能交付');
  expect(page.querySelector('#company-pricing')).toBeNull();
  expect(page.querySelector('a[href="https://incorporate.mizufinancial.com/"]')).toBeNull();
});
