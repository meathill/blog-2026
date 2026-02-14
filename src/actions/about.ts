'use server';

import { getDb } from '@/lib/db';
import { aboutContents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function checkAuth() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
}

export async function getAboutContent(localeInput: string) {
  const locale = localeInput === 'en' ? 'en' : 'zh';
  const db = await getDb();
  return await db.select().from(aboutContents).where(eq(aboutContents.locale, locale)).get();
}

export async function saveAboutContent(formData: FormData) {
  await checkAuth();

  const locale = (formData.get('locale') as string) === 'en' ? 'en' : 'zh';
  const content = (formData.get('content') as string) || '';
  const githubContent = (formData.get('githubContent') as string) || '';
  const sponsorContent = (formData.get('sponsorContent') as string) || '';

  const db = await getDb();
  await db
    .insert(aboutContents)
    .values({
      locale,
      content,
      githubContent,
      sponsorContent,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: aboutContents.locale,
      set: {
        content,
        githubContent,
        sponsorContent,
        updatedAt: new Date(),
      },
    });

  revalidatePath('/about');
  revalidatePath(`/${locale}/about`);
  revalidatePath('/admin/about');

  redirect(`/admin/about?locale=${locale}&saved=1`);
}
