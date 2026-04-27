import type { NavItem } from '@/components/layout/header/types';
import { getHeaderNavItems } from '@/components/layout/header/nav-items';

interface HeaderNavLabels {
  about: string;
  apps: string;
  skills: string;
  tech: string;
  works: string;
  resources: string;
}

interface FooterNavLabels {
  archives: string;
  apps: string;
  skills: string;
  about: string;
  sponsor: string;
}

export type NavigationSection = 'header' | 'footer';

export interface NavigationConfigBySection {
  header: NavItem[];
  footer: NavItem[];
}

const DEFAULT_LABELS_BY_LOCALE: Record<string, HeaderNavLabels> = {
  zh: {
    about: '关于',
    apps: '应用',
    skills: 'Skills',
    tech: '技术',
    works: '作品',
    resources: '资源',
  },
  en: {
    about: 'About',
    apps: 'Apps',
    skills: 'Skills',
    tech: 'Tech',
    works: 'Works',
    resources: 'Resources',
  },
};

const DEFAULT_FOOTER_LABELS_BY_LOCALE: Record<string, FooterNavLabels> = {
  zh: {
    archives: '归档',
    apps: '应用',
    skills: 'Skills',
    about: '关于',
    sponsor: '赞助',
  },
  en: {
    archives: 'Archives',
    apps: 'Apps',
    skills: 'Skills',
    about: 'About',
    sponsor: 'Sponsor',
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

export function resolveNavigationSection(input: string | null | undefined): NavigationSection {
  return input === 'footer' ? 'footer' : 'header';
}

function getDefaultHeaderNavigationItems(locale: string): NavItem[] {
  const labels = DEFAULT_LABELS_BY_LOCALE[locale] ?? DEFAULT_LABELS_BY_LOCALE.zh;
  return getHeaderNavItems(labels);
}

function getDefaultFooterNavigationItems(locale: string): NavItem[] {
  const labels = DEFAULT_FOOTER_LABELS_BY_LOCALE[locale] ?? DEFAULT_FOOTER_LABELS_BY_LOCALE.zh;
  return [
    { href: '/posts', label: labels.archives },
    { href: '/app', label: labels.apps },
    { href: '/skills', label: labels.skills },
    { href: '/about', label: labels.about },
    { href: 'https://github.com/sponsors/meathill', label: labels.sponsor, external: true },
  ];
}

export function getDefaultNavigationItems(locale: string, section: NavigationSection = 'header'): NavItem[] {
  if (section === 'footer') {
    return getDefaultFooterNavigationItems(locale);
  }
  return getDefaultHeaderNavigationItems(locale);
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

function parseUnknownItems(candidate: unknown): NavItem[] {
  if (!Array.isArray(candidate)) {
    throw new Error('导航配置必须是数组');
  }
  return candidate.map((item) => sanitizeNavItem(item));
}

export function parseNavigationConfigJson(itemsJson: string, locale: string): NavigationConfigBySection {
  let parsed: unknown;
  try {
    parsed = JSON.parse(itemsJson);
  } catch {
    throw new Error('JSON 格式错误');
  }

  if (Array.isArray(parsed)) {
    return {
      header: parseUnknownItems(parsed),
      footer: getDefaultNavigationItems(locale, 'footer'),
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('导航配置必须是对象或数组');
  }

  const candidate = parsed as {
    header?: unknown;
    footer?: unknown;
  };

  const header = candidate.header ? parseUnknownItems(candidate.header) : getDefaultNavigationItems(locale, 'header');
  const footer = candidate.footer ? parseUnknownItems(candidate.footer) : getDefaultNavigationItems(locale, 'footer');

  return {
    header,
    footer,
  };
}

export function formatNavigationConfigJson(config: NavigationConfigBySection): string {
  return JSON.stringify(config);
}
