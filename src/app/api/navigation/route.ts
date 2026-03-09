import { NextRequest, NextResponse } from 'next/server';
import { resolveNavigationLocale, resolveNavigationSection } from '@/lib/navigation-config';
import { getCachedNavigationItems } from '@/lib/public-navigation';

export async function GET(req: NextRequest) {
  const locale = resolveNavigationLocale(req.nextUrl.searchParams.get('locale'));
  const section = resolveNavigationSection(req.nextUrl.searchParams.get('section'));
  const items = await getCachedNavigationItems(locale, section);

  return NextResponse.json({
    locale,
    section,
    items,
  });
}
