import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DesktopNav } from '@/components/layout/header/desktop-nav';
import type { NavItem } from '@/components/layout/header/types';

vi.mock('@/i18n/routing', () => ({
  Link({ href, children, ...props }: { href: string; children: ReactNode; className?: string; onClick?: () => void }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

describe('DesktopNav', () => {
  it('切换不同 dropdown 时应自动关闭前一个菜单', () => {
    render(<DesktopNav items={createItems()} />);

    fireEvent.click(screen.getByRole('button', { name: '技术' }));
    expect(screen.getByRole('link', { name: 'JavaScript' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '作品' }));

    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'JavaScript' })).not.toBeInTheDocument();
  });

  it('点击导航外部时应关闭已展开的菜单', () => {
    render(<DesktopNav items={createItems()} />);

    fireEvent.click(screen.getByRole('button', { name: '技术' }));
    expect(screen.getByRole('link', { name: 'JavaScript' })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('link', { name: 'JavaScript' })).not.toBeInTheDocument();
  });
});

function createItems(): NavItem[] {
  return [
    {
      href: '/posts/tech',
      label: '技术',
      children: [
        { href: '/posts/javascript', label: 'JavaScript' },
        { href: '/posts/ai', label: 'AI' },
      ],
    },
    {
      href: '/apps',
      label: '作品',
      children: [
        { href: '/apps/github', label: 'GitHub' },
        { href: '/apps/aigazou', label: 'AIGAZOU' },
      ],
    },
    {
      href: '/about',
      label: '关于',
    },
  ];
}
