import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock('@/i18n/routing', () => ({
  usePathname: () => window.location.pathname,
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'zh',
  useTranslations: () => (key: string) => ({ label: '语言', en: 'English', zh: '中文' })[key as 'label'],
}));

import LanguageSwitcher from '@/components/LanguageSwitcher';

describe('LanguageSwitcher 保留 query string', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('切语言时把当前 query 一起带上（如 /search?q=...）', () => {
    window.history.replaceState(null, '', '/search?q=cloudflare');

    render(<LanguageSwitcher />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });

    expect(replaceMock).toHaveBeenCalledWith('/search?q=cloudflare', { locale: 'en' });
  });

  it('没有 query 时行为不变', () => {
    window.history.replaceState(null, '', '/about');

    render(<LanguageSwitcher />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });

    expect(replaceMock).toHaveBeenCalledWith('/about', { locale: 'en' });
  });

  it('在文章页（/posts 开头）隐藏切换器，避免切 en 后被 301 弹回', () => {
    window.history.replaceState(null, '', '/posts/tech/demo-article');

    const { container } = render(<LanguageSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });
});
