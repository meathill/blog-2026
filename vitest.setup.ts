import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock Next.js 路由
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: function MockImage({
    src,
    alt,
    fill: _fill,
    preload: _preload,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    preload?: boolean;
    [key: string]: unknown;
  }) {
    return React.createElement('img', { src, alt, ...props });
  },
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return React.createElement('a', { href }, children);
  },
}));

// Mock IntersectionObserver
class IntersectionObserverMock {
  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// next-intl/server 在 jsdom（非 react-server 条件）下解析到客户端桩，setRequestLocale 会直接抛错。
// ISR 改造后所有 [locale] 页面/layout 都会调用它，这里统一桩掉；单个测试文件自行 mock 时需自带 setRequestLocale。
vi.mock('next-intl/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next-intl/server')>()),
  setRequestLocale: vi.fn(),
}));
