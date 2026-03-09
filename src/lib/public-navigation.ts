import type { NavItem } from '@/components/layout/header/types';
import { navigationConfigs } from '@/db/schema';
import { getDb } from '@/lib/db';
import {
  getDefaultNavigationItems,
  parseNavigationConfigJson,
  resolveNavigationLocale,
  type NavigationConfigBySection,
  type NavigationSection,
} from '@/lib/navigation-config';
import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';

const NAVIGATION_CACHE_SECONDS = 900;

export function getNavigationTag(localeInput: string, section: NavigationSection) {
  const locale = resolveNavigationLocale(localeInput);
  return `nav:${locale}:${section}`;
}

export async function readNavigationConfig(localeInput: string): Promise<NavigationConfigBySection> {
  const locale = resolveNavigationLocale(localeInput);
  const db = await getDb();
  const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();

  if (!row) {
    return {
      header: getDefaultNavigationItems(locale, 'header'),
      footer: getDefaultNavigationItems(locale, 'footer'),
    };
  }

  try {
    return parseNavigationConfigJson(row.items, locale);
  } catch {
    return {
      header: getDefaultNavigationItems(locale, 'header'),
      footer: getDefaultNavigationItems(locale, 'footer'),
    };
  }
}

async function readNavigationItems(localeInput: string, section: NavigationSection): Promise<NavItem[]> {
  const locale = resolveNavigationLocale(localeInput);
  const config = await readNavigationConfig(locale);
  return config[section] ?? getDefaultNavigationItems(locale, section);
}

export async function getCachedNavigationItems(localeInput: string, section: NavigationSection) {
  const locale = resolveNavigationLocale(localeInput);

  return unstable_cache(async () => readNavigationItems(locale, section), ['navigation', locale, section], {
    revalidate: NAVIGATION_CACHE_SECONDS,
    tags: [getNavigationTag(locale, section)],
  })();
}

export async function getCachedHeaderNavigation(localeInput: string) {
  return getCachedNavigationItems(localeInput, 'header');
}

export async function getCachedFooterNavigation(localeInput: string) {
  return getCachedNavigationItems(localeInput, 'footer');
}
