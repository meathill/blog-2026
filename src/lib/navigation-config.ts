import type { NavItem } from '@/components/layout/header/types';
import { getHeaderNavItems } from '@/components/layout/header/nav-items';

interface HeaderNavLabels {
  about: string;
  apps: string;
  tech: string;
  works: string;
  resources: string;
}

const DEFAULT_LABELS_BY_LOCALE: Record<string, HeaderNavLabels> = {
  zh: {
    about: '关于',
    apps: '应用',
    tech: '技术',
    works: '作品',
    resources: '资源',
  },
  en: {
    about: 'About',
    apps: 'Apps',
    tech: 'Tech',
    works: 'Works',
    resources: 'Resources',
  },
};

function sanitizeNavItem(rawItem: unknown): NavItem {
  if (typeof rawItem !== 'object' || rawItem === null) {
    throw new Error('导航项必须是对象');
  }

  const candidate = rawItem as {
    href?: unknown;
    label?: unknown;
    external?: unknown;
    children?: unknown;
  };

  if (typeof candidate.href !== 'string' || !candidate.href.trim()) {
    throw new Error('导航项缺少有效 href');
  }
  if (typeof candidate.label !== 'string' || !candidate.label.trim()) {
    throw new Error('导航项缺少有效 label');
  }

  const item: NavItem = {
    href: candidate.href.trim(),
    label: candidate.label.trim(),
  };

  if (candidate.external === true) {
    item.external = true;
  }

  if (candidate.children !== undefined) {
    if (!Array.isArray(candidate.children)) {
      throw new Error('children 必须是数组');
    }
    const children = candidate.children.map((child) => sanitizeNavItem(child));
    if (children.length > 0) {
      item.children = children;
    }
  }

  return item;
}

export function resolveNavigationLocale(input: string | null | undefined): 'zh' | 'en' {
  return input === 'en' ? 'en' : 'zh';
}

export function getDefaultNavigationItems(locale: string): NavItem[] {
  const labels = DEFAULT_LABELS_BY_LOCALE[locale] ?? DEFAULT_LABELS_BY_LOCALE.zh;
  return getHeaderNavItems(labels);
}

export function parseNavigationItemsJson(itemsJson: string): NavItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(itemsJson);
  } catch {
    throw new Error('JSON 格式错误');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('导航配置必须是数组');
  }

  return parsed.map((item) => sanitizeNavItem(item));
}

export function formatNavigationItemsJson(items: NavItem[]): string {
  return JSON.stringify(items, null, 2);
}
