'use server';

import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

async function checkAuth() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function createApp(formData: FormData) {
  await checkAuth();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const content = formData.get('content') as string;
  const url = formData.get('url') as string;
  const repoUrl = formData.get('repoUrl') as string;
  const icon = formData.get('icon') as string;
  const status = formData.get('status') as 'published' | 'draft' | 'archived';
  const slug = (formData.get('slug') as string) || slugify(name);

  const db = await getDb();
  await db.insert(apps).values({
    id: crypto.randomUUID(),
    name,
    description,
    content,
    slug,
    url,
    repoUrl,
    icon,
    status: status || 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/admin');
  revalidatePath('/app');
  redirect('/admin');
}

export async function updateApp(id: string, formData: FormData) {
  await checkAuth();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const content = formData.get('content') as string;
  const url = formData.get('url') as string;
  const repoUrl = formData.get('repoUrl') as string;
  const icon = formData.get('icon') as string;
  const status = formData.get('status') as 'published' | 'draft' | 'archived';
  const slug = formData.get('slug') as string;

  const db = await getDb();
  await db
    .update(apps)
    .set({
      name,
      description,
      content,
      slug,
      url,
      repoUrl,
      icon,
      status,
      updatedAt: new Date(),
    })
    .where(eq(apps.id, id));

  revalidatePath('/admin');
  revalidatePath('/app');
  revalidatePath(`/app/${slug}`);
  redirect('/admin');
}

export async function deleteApp(id: string) {
  await checkAuth();
  const db = await getDb();
  await db.delete(apps).where(eq(apps.id, id));
  revalidatePath('/admin');
  revalidatePath('/app');
}
