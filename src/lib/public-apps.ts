import { apps, appTags, appTranslations, tags } from '@/db/schema';
import { getDb } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { and, desc, eq, inArray } from 'drizzle-orm';

const FEATURED_APPS_CACHE_SECONDS = 900;

export interface PublicAppTag {
  id: string;
  name: string;
  slug: string;
}

export interface PublicAppCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  content: string | null;
  icon: string | null;
  url: string | null;
  repoUrl: string | null;
  status: 'published' | 'draft' | 'archived';
}

function resolvePublicLocale(localeInput: string) {
  return localeInput === 'en' ? 'en' : 'zh';
}

export function getFeaturedAppsTag(localeInput: string) {
  const locale = resolvePublicLocale(localeInput);
  return `home:featured-apps:${locale}`;
}

export async function getPublicAppTagsMap(appIds: string[]) {
  if (appIds.length === 0) {
    return new Map<string, PublicAppTag[]>();
  }

  const db = await getDb();
  const rows = await db
    .select({
      appId: appTags.appId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(appTags)
    .innerJoin(tags, eq(appTags.tagId, tags.id))
    .where(inArray(appTags.appId, appIds))
    .orderBy(tags.name);

  const tagMap = new Map<string, PublicAppTag[]>();
  for (const row of rows) {
    const tagList = tagMap.get(row.appId) ?? [];
    tagList.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
    });
    tagMap.set(row.appId, tagList);
  }

  return tagMap;
}

export async function getPublicAppTags(appId: string) {
  const tagMap = await getPublicAppTagsMap([appId]);
  return tagMap.get(appId) ?? [];
}

export async function getCachedFeaturedApps(localeInput: string) {
  const locale = resolvePublicLocale(localeInput);

  return unstable_cache(
    async () => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(apps)
        .leftJoin(appTranslations, and(eq(appTranslations.appId, apps.id), eq(appTranslations.locale, locale)))
        .where(eq(apps.status, 'published'))
        .orderBy(desc(apps.createdAt))
        .limit(3);

      const tagMap = await getPublicAppTagsMap(rows.map(({ apps: app }) => app.id));

      return rows.map(({ apps: app, app_translations: translation }) => ({
        app: {
          ...app,
          name: translation?.name || app.name,
          description: translation?.description || app.description,
          content: translation?.content || app.content,
        } satisfies PublicAppCardData,
        tags: tagMap.get(app.id) ?? [],
      }));
    },
    ['featured-apps', locale],
    {
      revalidate: FEATURED_APPS_CACHE_SECONDS,
      tags: [getFeaturedAppsTag(locale)],
    },
  )();
}
