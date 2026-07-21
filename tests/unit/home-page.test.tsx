import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Home, { generateMetadata } from '../../src/app/[locale]/(public)/page';
import { SITE_URL } from '../../src/lib/constants';

// 首页各版块与 WP/D1 有数据依赖，测试只关心 head 与 JSON-LD 注入
vi.mock('../../src/components/home/Hero', () => ({ default: () => null }));
vi.mock('../../src/components/home/ValueStrip', () => ({ default: () => null }));
vi.mock('../../src/components/home/Products', () => ({ default: () => null }));
vi.mock('../../src/components/home/Solutions', () => ({ default: () => null }));
vi.mock('../../src/components/home/Tools', () => ({ default: () => null }));
vi.mock('../../src/components/home/RecentPosts', () => ({ default: () => null }));
vi.mock('../../src/components/home/ContactCTA', () => ({ default: () => null }));

function params(locale: string) {
  return { params: Promise.resolve({ locale }) };
}

describe('Home generateMetadata', () => {
  it('zh 首页 canonical 为站点根，含 zh/en/x-default hreflang', async () => {
    const metadata = await generateMetadata(params('zh'));
    expect(metadata.alternates?.canonical).toBe(SITE_URL);
    expect(metadata.alternates?.languages).toEqual({
      zh: SITE_URL,
      en: `${SITE_URL}/en`,
      'x-default': SITE_URL,
    });
  });

  it('en 首页 canonical 为 /en', async () => {
    const metadata = await generateMetadata(params('en'));
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en`);
  });
});

describe('Home JSON-LD 注入', () => {
  it('注入 Organization 与 WebSite 两段 JSON-LD', async () => {
    const html = renderToStaticMarkup(await Home(params('zh')));
    const scripts = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/g) ?? [];
    expect(scripts).toHaveLength(2);
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain(`"@id":"${SITE_URL}/#organization"`);
    expect(html).toContain('search?q={search_term_string}');
  });
});
