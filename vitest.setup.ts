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
  default: function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
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
