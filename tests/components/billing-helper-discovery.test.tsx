import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Products from '@/components/home/Products';
import Footer from '@/components/layout/Footer';

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'zh',
  getTranslations: async () => (key: string) => key,
}));
vi.mock('@/lib/public-apps', () => ({ getCachedFeaturedApps: async () => [] }));
vi.mock('@/components/ProductCard', () => ({ default: () => null }));
vi.mock('@/components/LanguageSwitcher', () => ({ default: () => null }));
vi.mock('meathill-brand-react', () => ({
  BrandFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
}));
vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('账单助手可发现性', () => {
  it('没有后台推荐产品时，首页仍保留账单助手入口', async () => {
    render(await Products());
    expect(screen.getByRole('link', { name: /Cloudflare 账单助手/ })).toHaveAttribute(
      'href',
      '/cloudflare-billing-helper',
    );
  });

  it('不依赖后台导航配置，页脚始终保留产品入口', async () => {
    render(await Footer({ navItems: [] }));
    expect(screen.getByRole('link', { name: 'billing_helper' })).toHaveAttribute('href', '/cloudflare-billing-helper');
  });
});
