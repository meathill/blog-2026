'use server';

import { getDb } from '@/lib/db';
import { navigationConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  formatNavigationItemsJson,
  getDefaultNavigationItems,
  parseNavigationItemsJson,
  resolveNavigationLocale,
} from '@/lib/navigation-config';

async function checkAuth() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
}

function buildRedirectUrl(params: { locale: 'zh' | 'en'; saved?: '1'; reset?: '1'; error?: string }): string {
  const search = new URLSearchParams();
  search.set('locale', params.locale);
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

export async function getNavigationEditorData(localeInput: string | null | undefined) {
  await checkAuth();

  const locale = resolveNavigationLocale(localeInput);
  const db = await getDb();
  const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();

  if (!row) {
    return {
      locale,
      hasCustomConfig: false,
      itemsJson: formatNavigationItemsJson(getDefaultNavigationItems(locale)),
    };
  }

  try {
    const parsedItems = parseNavigationItemsJson(row.items);
    return {
      locale,
      hasCustomConfig: true,
      itemsJson: formatNavigationItemsJson(parsedItems),
    };
  } catch {
    return {
      locale,
      hasCustomConfig: true,
      itemsJson: row.items,
    };
  }
}

export async function saveNavigationConfig(formData: FormData) {
  await checkAuth();

  const locale = resolveNavigationLocale(formData.get('locale') as string | null | undefined);
  const itemsJson = (formData.get('itemsJson') as string | null)?.trim() ?? '';

  try {
    const parsedItems = parseNavigationItemsJson(itemsJson);
    const normalizedJson = JSON.stringify(parsedItems);
    const db = await getDb();
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
    redirect(buildRedirectUrl({ locale, saved: '1' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败';
    redirect(buildRedirectUrl({ locale, error: message }));
  }
}

export async function resetNavigationConfig(formData: FormData) {
  await checkAuth();

  const locale = resolveNavigationLocale(formData.get('locale') as string | null | undefined);
  const db = await getDb();
  await db.delete(navigationConfigs).where(eq(navigationConfigs.locale, locale));

  revalidatePath('/');
  revalidatePath('/en');
  revalidatePath('/admin/navigation');
  redirect(buildRedirectUrl({ locale, reset: '1' }));
}
