import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/navigation', () => ({
  defineRouting: (config: unknown) => config,
  createNavigation: () => ({
    Link: ({ prefetch, href, children }: { prefetch?: boolean; href: string; children: React.ReactNode }) =>
      React.createElement('a', { href, 'data-prefetch': String(prefetch) }, children),
    redirect: vi.fn(),
    usePathname: () => '/',
    useRouter: () => ({ replace: vi.fn() }),
  }),
}));

import { Link } from '@/i18n/routing';

describe('i18n Link', () => {
  it('默认关闭预取，显式 true 仍然保留', () => {
    render(
      <>
        <Link href="/about">关于</Link>
        <Link href="/skills" prefetch>
          技能
        </Link>
      </>,
    );

    expect(screen.getByRole('link', { name: '关于' })).toHaveAttribute('data-prefetch', 'false');
    expect(screen.getByRole('link', { name: '技能' })).toHaveAttribute('data-prefetch', 'true');
  });
});
