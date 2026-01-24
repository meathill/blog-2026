'use server';

import { getDb } from '@/lib/db';
import { tags, appTags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Get all tags
export async function getTags() {
  const db = await getDb();
  return db.select().from(tags).orderBy(tags.name);
}

// Get tags for a specific app
export async function getAppTags(appId: string) {
  const db = await getDb();
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(appTags)
    .innerJoin(tags, eq(appTags.tagId, tags.id))
    .where(eq(appTags.appId, appId));
  return result;
}

// Create a new tag
export async function createTag(formData: FormData) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  if (!name?.trim()) throw new Error('Tag name is required');

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');

  const db = await getDb();
  const id = crypto.randomUUID();

  await db.insert(tags).values({
    id,
    name: name.trim(),
    slug,
    createdAt: new Date(),
  });

  revalidatePath('/admin');
  return { id, name: name.trim(), slug };
}

// Delete a tag
export async function deleteTag(id: string) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const db = await getDb();

  // First remove all app-tag associations
  await db.delete(appTags).where(eq(appTags.tagId, id));
  // Then delete the tag
  await db.delete(tags).where(eq(tags.id, id));

  revalidatePath('/admin');
}

// Update app tags (replace all tags for an app)
export async function updateAppTags(appId: string, tagIds: string[]) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');

  const db = await getDb();

  // Delete existing associations
  await db.delete(appTags).where(eq(appTags.appId, appId));

  // Insert new associations
  if (tagIds.length > 0) {
    await db.insert(appTags).values(
      tagIds.map((tagId) => ({
        appId,
        tagId,
      })),
    );
  }

  revalidatePath('/admin');
  revalidatePath(`/app`);
}
