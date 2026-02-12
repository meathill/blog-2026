import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { navigationConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getDefaultNavigationItems, parseNavigationItemsJson, resolveNavigationLocale } from '@/lib/navigation-config';

export async function GET(req: NextRequest) {
  const locale = resolveNavigationLocale(req.nextUrl.searchParams.get('locale'));
  const db = await getDb();
  const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();

  if (!row) {
    return NextResponse.json({
      locale,
      source: 'default',
      items: getDefaultNavigationItems(locale),
    });
  }

  try {
    return NextResponse.json({
      locale,
      source: 'custom',
      items: parseNavigationItemsJson(row.items),
    });
  } catch {
    return NextResponse.json({
      locale,
      source: 'default',
      items: getDefaultNavigationItems(locale),
    });
  }
}
