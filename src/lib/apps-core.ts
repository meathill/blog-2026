import { and, desc, eq, like, or } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { apps, appImages, appTags, appTranslations, tags } from '@/db/schema';
import { getDb } from '@/lib/db';
import { buildAppSlug } from '@/lib/app-slug';
import { getFeaturedAppsTag } from '@/lib/public-apps';

export type AppStatus = 'published' | 'draft' | 'archived';
export type AppImageType = 'cover' | 'screenshot';
export type AppLocale = 'en' | 'zh';

export interface AppRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  content: string | null;
  icon: string | null;
  url: string | null;
  repoUrl: string | null;
  status: AppStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface AppImageRow {
  id: string;
  appId: string;
  url: string;
  alt: string | null;
  type: AppImageType | null;
  sortOrder: number | null;
  createdAt: Date;
}

export interface AppTagRow {
  id: string;
  name: string;
  slug: string;
}

export interface AppTranslationRow {
  id: string;
  appId: string;
  locale: string;
  name: string | null;
  description: string | null;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppFull extends AppRow {
  images: AppImageRow[];
  tags: AppTagRow[];
  translations: AppTranslationRow[];
}

export interface CreateAppInput {
  name: string;
  description?: string | null;
  content?: string | null;
  icon?: string | null;
  url?: string | null;
  repoUrl?: string | null;
  slug?: string;
  status?: AppStatus;
  tagIds?: string[];
  translations?: Array<{
    locale: AppLocale;
    name?: string | null;
    description?: string | null;
    content?: string | null;
  }>;
  images?: Array<{
    url: string;
    alt?: string | null;
    type?: AppImageType;
    sortOrder?: number;
  }>;
}

export interface UpdateAppPatch {
  name?: string;
  description?: string | null;
  content?: string | null;
  icon?: string | null;
  url?: string | null;
  repoUrl?: string | null;
  slug?: string;
  status?: AppStatus;
}

const APP_REVALIDATE_PATHS = ['/admin', '/app', '/en/app', '/', '/en'];

export function revalidateAfterAppMutation(slug?: string | null, prevSlug?: string | null) {
  for (const p of APP_REVALIDATE_PATHS) revalidatePath(p);
  for (const s of [slug, prevSlug]) {
    if (!s) continue;
    revalidatePath(`/app/${s}`);
    revalidatePath(`/en/app/${s}`);
  }
  revalidateTag(getFeaturedAppsTag('zh'), 'max');
  revalidateTag(getFeaturedAppsTag('en'), 'max');
}

async function ensureUniqueSlug(rawSlug: string, ignoreId?: string): Promise<string> {
  const db = await getDb();
  let candidate = rawSlug || 'app';
  let suffix = 1;
  while (true) {
    const existing = await db.select({ id: apps.id }).from(apps).where(eq(apps.slug, candidate)).limit(1);
    if (existing.length === 0 || existing[0].id === ignoreId) return candidate;
    suffix += 1;
    candidate = `${rawSlug}-${suffix}`;
  }
}

export async function listApps(
  opts: { status?: AppStatus; tagSlug?: string; search?: string; limit?: number; offset?: number } = {},
): Promise<Array<AppRow & { tags: AppTagRow[] }>> {
  const db = await getDb();
  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = opts.offset ?? 0;

  const conditions = [] as ReturnType<typeof eq>[];
  if (opts.status) conditions.push(eq(apps.status, opts.status));
  if (opts.search) {
    const term = `%${opts.search}%`;
    const cond = or(like(apps.name, term), like(apps.description, term), like(apps.slug, term));
    if (cond) conditions.push(cond as never);
  }

  let appIds: string[] | undefined;
  if (opts.tagSlug) {
    const tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, opts.tagSlug)).limit(1);
    if (tagRow.length === 0) return [];
    const tagId = tagRow[0].id;
    const links = await db.select({ appId: appTags.appId }).from(appTags).where(eq(appTags.tagId, tagId));
    appIds = links.map((r) => r.appId);
    if (appIds.length === 0) return [];
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select().from(apps).where(where).orderBy(desc(apps.updatedAt)).limit(limit).offset(offset);

  const filtered = appIds ? rows.filter((r) => appIds!.includes(r.id)) : rows;
  const tagMap = await getTagsForApps(filtered.map((r) => r.id));
  return filtered.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [] }));
}

async function getTagsForApps(appIds: string[]): Promise<Map<string, AppTagRow[]>> {
  const map = new Map<string, AppTagRow[]>();
  if (appIds.length === 0) return map;
  const db = await getDb();
  const rows = await db
    .select({ appId: appTags.appId, id: tags.id, name: tags.name, slug: tags.slug })
    .from(appTags)
    .innerJoin(tags, eq(appTags.tagId, tags.id))
    .orderBy(tags.name);
  for (const r of rows) {
    if (!appIds.includes(r.appId)) continue;
    const list = map.get(r.appId) ?? [];
    list.push({ id: r.id, name: r.name, slug: r.slug });
    map.set(r.appId, list);
  }
  return map;
}

async function loadFullApp(row: AppRow): Promise<AppFull> {
  const db = await getDb();
  const [images, tagRows, translations] = await Promise.all([
    db.select().from(appImages).where(eq(appImages.appId, row.id)).orderBy(appImages.sortOrder),
    db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(appTags)
      .innerJoin(tags, eq(appTags.tagId, tags.id))
      .where(eq(appTags.appId, row.id))
      .orderBy(tags.name),
    db.select().from(appTranslations).where(eq(appTranslations.appId, row.id)),
  ]);
  return { ...row, images, tags: tagRows, translations };
}

export async function getAppById(id: string): Promise<AppFull | null> {
  const db = await getDb();
  const rows = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
  if (rows.length === 0) return null;
  return loadFullApp(rows[0]);
}

export async function getAppBySlug(slug: string): Promise<AppFull | null> {
  const db = await getDb();
  const rows = await db.select().from(apps).where(eq(apps.slug, slug)).limit(1);
  if (rows.length === 0) return null;
  return loadFullApp(rows[0]);
}

export async function createAppCore(input: CreateAppInput): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const baseSlug = input.slug?.trim() || buildAppSlug(input.name);
  const slug = await ensureUniqueSlug(baseSlug);
  const now = new Date();
  const status: AppStatus = input.status ?? 'draft';

  await db.insert(apps).values({
    id,
    slug,
    name: input.name,
    description: input.description ?? null,
    content: input.content ?? null,
    icon: input.icon ?? null,
    url: input.url ?? null,
    repoUrl: input.repoUrl ?? null,
    status,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === 'published' ? now : null,
  });

  if (input.tagIds && input.tagIds.length > 0) {
    await setAppTagsCore(id, input.tagIds);
  }

  if (input.translations && input.translations.length > 0) {
    for (const t of input.translations) {
      await upsertAppTranslationCore({ appId: id, ...t });
    }
  }

  if (input.images && input.images.length > 0) {
    for (const img of input.images) {
      await addAppImageCore({ appId: id, ...img });
    }
  }

  return { id, slug };
}

export async function updateAppCore(id: string, patch: UpdateAppPatch): Promise<{ slug: string; prevSlug: string }> {
  const db = await getDb();
  const existing = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
  if (existing.length === 0) throw new Error(`App not found: ${id}`);
  const prev = existing[0];

  let nextSlug = prev.slug;
  if (patch.slug !== undefined && patch.slug.trim() && patch.slug !== prev.slug) {
    nextSlug = await ensureUniqueSlug(patch.slug.trim(), id);
  }

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.content !== undefined) set.content = patch.content;
  if (patch.icon !== undefined) set.icon = patch.icon;
  if (patch.url !== undefined) set.url = patch.url;
  if (patch.repoUrl !== undefined) set.repoUrl = patch.repoUrl;
  if (nextSlug !== prev.slug) set.slug = nextSlug;
  if (patch.status !== undefined) {
    set.status = patch.status;
    if (patch.status === 'published' && prev.status !== 'published' && !prev.publishedAt) {
      set.publishedAt = new Date();
    }
  }

  await db.update(apps).set(set).where(eq(apps.id, id));
  return { slug: nextSlug, prevSlug: prev.slug };
}

export async function deleteAppCore(id: string): Promise<{ slug: string } | null> {
  const db = await getDb();
  const existing = await db.select({ slug: apps.slug }).from(apps).where(eq(apps.id, id)).limit(1);
  if (existing.length === 0) return null;
  await db.delete(appImages).where(eq(appImages.appId, id));
  await db.delete(appTags).where(eq(appTags.appId, id));
  await db.delete(appTranslations).where(eq(appTranslations.appId, id));
  await db.delete(apps).where(eq(apps.id, id));
  return { slug: existing[0].slug };
}

export async function setAppTagsCore(appId: string, tagIds: string[]): Promise<void> {
  const db = await getDb();
  await db.delete(appTags).where(eq(appTags.appId, appId));
  if (tagIds.length === 0) return;
  const unique = [...new Set(tagIds)];
  await db.insert(appTags).values(unique.map((tagId) => ({ appId, tagId })));
}

export async function listAppImagesCore(appId: string): Promise<AppImageRow[]> {
  const db = await getDb();
  return db.select().from(appImages).where(eq(appImages.appId, appId)).orderBy(appImages.sortOrder);
}

export async function addAppImageCore(input: {
  appId: string;
  url: string;
  alt?: string | null;
  type?: AppImageType;
  sortOrder?: number;
}): Promise<{ id: string }> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.insert(appImages).values({
    id,
    appId: input.appId,
    url: input.url,
    alt: input.alt ?? null,
    type: input.type ?? 'screenshot',
    sortOrder: input.sortOrder ?? 0,
    createdAt: new Date(),
  });
  return { id };
}

export async function removeAppImageCore(imageId: string): Promise<{ appId: string } | null> {
  const db = await getDb();
  const existing = await db
    .select({ appId: appImages.appId })
    .from(appImages)
    .where(eq(appImages.id, imageId))
    .limit(1);
  if (existing.length === 0) return null;
  await db.delete(appImages).where(eq(appImages.id, imageId));
  return existing[0];
}

export async function upsertAppTranslationCore(input: {
  appId: string;
  locale: AppLocale;
  name?: string | null;
  description?: string | null;
  content?: string | null;
}): Promise<void> {
  const db = await getDb();
  const existing = await db
    .select({ id: appTranslations.id })
    .from(appTranslations)
    .where(and(eq(appTranslations.appId, input.appId), eq(appTranslations.locale, input.locale)))
    .limit(1);
  const now = new Date();
  if (existing.length > 0) {
    await db
      .update(appTranslations)
      .set({
        name: input.name ?? null,
        description: input.description ?? null,
        content: input.content ?? null,
        updatedAt: now,
      })
      .where(eq(appTranslations.id, existing[0].id));
  } else {
    await db.insert(appTranslations).values({
      id: crypto.randomUUID(),
      appId: input.appId,
      locale: input.locale,
      name: input.name ?? null,
      description: input.description ?? null,
      content: input.content ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function deleteAppTranslationCore(appId: string, locale: AppLocale): Promise<void> {
  const db = await getDb();
  await db.delete(appTranslations).where(and(eq(appTranslations.appId, appId), eq(appTranslations.locale, locale)));
}
