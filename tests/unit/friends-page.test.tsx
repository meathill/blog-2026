import { render, screen } from '@testing-library/react';
import { createTranslator } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';
import FriendsPage, { generateMetadata } from '@/app/[locale]/(public)/friend/page';
import Footer from '@/components/layout/Footer';
import { SITE_URL } from '@/lib/constants';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async (options: 'Footer' | { locale: string; namespace: 'Friends' }) => {
    const { locale, namespace } = typeof options === 'string' ? { locale: 'zh', namespace: options } : options;
    return createTranslator({ locale, namespace, messages: locale === 'en' ? enMessages : zhMessages });
  },
}));

vi.mock('meathill-brand-react', () => ({
  BrandFooter: ({ children }: { children: ReactNode }) => <footer>{children}</footer>,
}));
vi.mock('@/components/LanguageSwitcher', () => ({ default: () => null }));
vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

describe('友链页', () => {
  it.each([
    ['zh', '友情链接', '/friend'],
    ['en', 'Friends', '/en/friend'],
  ])('%s 页面展示 Roland 并声明对应语言的 canonical', async (locale, title, path) => {
    const props = { params: Promise.resolve({ locale }) };
    render(await FriendsPage(props));

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Roland' });
    expect(link).toHaveAttribute('href', 'https://ro.cafe');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const metadata = await generateMetadata(props);
    expect(metadata.title).toBe(title);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${path}`);
    expect(metadata.alternates?.languages).toEqual({
      zh: `${SITE_URL}/friend`,
      en: `${SITE_URL}/en/friend`,
      'x-default': `${SITE_URL}/friend`,
    });
  });

  it.each([0, 5])('footer 有 %i 个后台导航项时仍显示友链入口', async (count) => {
    const navItems = Array.from({ length: count }, (_, index) => ({ href: `/item-${index}`, label: `导航 ${index}` }));
    render(await Footer({ navItems }));
    expect(screen.getByRole('link', { name: '友链' })).toHaveAttribute('href', '/friend');
  });
});
