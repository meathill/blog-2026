'use server';

import { getDb } from '@/lib/db';
import { navigationConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  formatNavigationConfigJson,
  formatNavigationItemsJson,
  getDefaultNavigationItems,
  parseNavigationConfigJson,
  parseNavigationItemsJson,
  resolveNavigationLocale,
  resolveNavigationSection,
} from '@/lib/navigation-config';

function getDefaultNavigationConfig(locale: 'zh' | 'en') {
  return {
    header: getDefaultNavigationItems(locale, 'header'),
    footer: getDefaultNavigationItems(locale, 'footer'),
  };
}

function normalizeItemsForSection(items: ReturnType<typeof parseNavigationItemsJson>, section: 'header' | 'footer') {
  if (section === 'header') {
    return items;
  }

  return items.map((item) => {
    if (item.external) {
      return {
        href: item.href,
        label: item.label,
        external: true,
      };
    }
    return {
      href: item.href,
      label: item.label,
    };
  });
}

async function checkAuth() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
}

function buildRedirectUrl(params: {
  locale: 'zh' | 'en';
  section: 'header' | 'footer';
  saved?: '1';
  reset?: '1';
  error?: string;
}): string {
  const search = new URLSearchParams();
  search.set('locale', params.locale);
  search.set('section', params.section);
  if (params.saved) {
    search.set('saved', params.saved);
  }
  if (params.reset) {
    search.set('reset', params.reset);
  }
  if (params.error) {
    search.set('error', params.error);
  }
  return `/admin/navigation?${search.toString()}`;
}

export async function getHeaderNavigation(localeInput: string) {
  const locale = resolveNavigationLocale(localeInput);
  const db = await getDb();
  const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();

  if (!row) {
    return getDefaultNavigationItems(locale, 'header');
  }

  try {
    const config = parseNavigationConfigJson(row.items, locale);
    return config.header;
  } catch {
    return getDefaultNavigationItems(locale, 'header');
  }
}

export async function getFooterNavigation(localeInput: string) {
  const locale = resolveNavigationLocale(localeInput);
  const db = await getDb();
  const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();

  if (!row) {
    return getDefaultNavigationItems(locale, 'footer');
  }

  try {
    const config = parseNavigationConfigJson(row.items, locale);
    return config.footer;
  } catch {
    return getDefaultNavigationItems(locale, 'footer');
  }
}

export async function getNavigationEditorData(
  localeInput: string | null | undefined,
  sectionInput: string | null | undefined,
) {
  await checkAuth();

  const locale = resolveNavigationLocale(localeInput);
  const section = resolveNavigationSection(sectionInput);
  const db = await getDb();
  const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();
  const defaultItems = getDefaultNavigationItems(locale, section);

  if (!row) {
    return {
      locale,
      section,
      hasCustomConfig: false,
      itemsJson: formatNavigationItemsJson(defaultItems),
    };
  }

  try {
    const config = parseNavigationConfigJson(row.items, locale);
    const parsedItems = normalizeItemsForSection(config[section], section);
    return {
      locale,
      section,
      hasCustomConfig: JSON.stringify(parsedItems) !== JSON.stringify(defaultItems),
      itemsJson: formatNavigationItemsJson(parsedItems),
    };
  } catch {
    return {
      locale,
      section,
      hasCustomConfig: true,
      itemsJson: formatNavigationItemsJson(defaultItems),
    };
  }
}

export async function saveNavigationConfig(formData: FormData) {
  await checkAuth();

  const locale = resolveNavigationLocale(formData.get('locale') as string | null | undefined);
  const section = resolveNavigationSection(formData.get('section') as string | null | undefined);
  const itemsJson = (formData.get('itemsJson') as string | null)?.trim() ?? '';

  try {
    const parsedItems = normalizeItemsForSection(parseNavigationItemsJson(itemsJson), section);
    const db = await getDb();
    const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();

    let currentConfig = getDefaultNavigationConfig(locale);
    if (row) {
      try {
        currentConfig = parseNavigationConfigJson(row.items, locale);
      } catch {
        currentConfig = getDefaultNavigationConfig(locale);
      }
    }

    const nextConfig = {
      ...currentConfig,
      [section]: parsedItems,
    };

    const normalizedJson = formatNavigationConfigJson(nextConfig);
    await db
      .insert(navigationConfigs)
      .values({
        locale,
        items: normalizedJson,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: navigationConfigs.locale,
        set: {
          items: normalizedJson,
          updatedAt: new Date(),
        },
      });

    revalidatePath('/');
    revalidatePath('/en');
    revalidatePath('/admin/navigation');
    redirect(buildRedirectUrl({ locale, section, saved: '1' }));
  } catch (error) {
    if (error instanceof Error && (error as any).digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    const message = error instanceof Error ? error.message : '保存失败';
    redirect(buildRedirectUrl({ locale, section, error: message }));
  }
}

export async function resetNavigationConfig(formData: FormData) {
  await checkAuth();

  const locale = resolveNavigationLocale(formData.get('locale') as string | null | undefined);
  const section = resolveNavigationSection(formData.get('section') as string | null | undefined);

  try {
    const db = await getDb();
    const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();

    let currentConfig = getDefaultNavigationConfig(locale);
    if (row) {
      try {
        currentConfig = parseNavigationConfigJson(row.items, locale);
      } catch {
        currentConfig = getDefaultNavigationConfig(locale);
      }
    }

    const nextConfig = {
      ...currentConfig,
      [section]: getDefaultNavigationItems(locale, section),
    };

    await db
      .insert(navigationConfigs)
      .values({
        locale,
        items: formatNavigationConfigJson(nextConfig),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: navigationConfigs.locale,
        set: {
          items: formatNavigationConfigJson(nextConfig),
          updatedAt: new Date(),
        },
      });

    revalidatePath('/');
    revalidatePath('/en');
    revalidatePath('/admin/navigation');
    redirect(buildRedirectUrl({ locale, section, reset: '1' }));
  } catch (error) {
    if (error instanceof Error && (error as any).digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    const message = error instanceof Error ? error.message : '保存失败';
    redirect(buildRedirectUrl({ locale, section, error: message }));
  }
}
