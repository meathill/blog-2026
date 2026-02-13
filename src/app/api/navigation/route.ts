import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { navigationConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  getDefaultNavigationItems,
  parseNavigationConfigJson,
  resolveNavigationLocale,
  resolveNavigationSection,
} from '@/lib/navigation-config';

export async function GET(req: NextRequest) {
  const locale = resolveNavigationLocale(req.nextUrl.searchParams.get('locale'));
  const section = resolveNavigationSection(req.nextUrl.searchParams.get('section'));
  const db = await getDb();
  const row = await db.select().from(navigationConfigs).where(eq(navigationConfigs.locale, locale)).get();

  if (!row) {
    return NextResponse.json({
      locale,
      section,
      source: 'default',
      items: getDefaultNavigationItems(locale, section),
    });
  }

  try {
    const config = parseNavigationConfigJson(row.items, locale);
    return NextResponse.json({
      locale,
      section,
      source: 'custom',
      items: config[section],
    });
  } catch {
    return NextResponse.json({
      locale,
      section,
      source: 'default',
      items: getDefaultNavigationItems(locale, section),
    });
  }
}
