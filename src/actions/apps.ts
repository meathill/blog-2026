'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import {
  createAppCore,
  deleteAppCore,
  revalidateAfterAppMutation,
  setAppTagsCore,
  updateAppCore,
  type AppStatus,
} from '@/lib/apps-core';

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
  const status = formData.get('status') as AppStatus;
  const slug = (formData.get('slug') as string) || undefined;
  const featured = formData.get('featured') === 'on';
  const sortOrder = Number(formData.get('sortOrder')) || 0;
  const tagIds = (formData.get('tagIds') as string)?.split(',').filter(Boolean) || [];

  const { slug: createdSlug } = await createAppCore({
    name,
    description,
    content,
    url,
    repoUrl,
    icon,
    status: status || 'draft',
    featured,
    sortOrder,
    slug,
    tagIds,
  });

  revalidateAfterAppMutation(createdSlug);
  redirect('/admin');
}

export async function updateApp(id: string, formData: FormData) {
  try {
    await checkAuth();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const content = formData.get('content') as string;
    const url = formData.get('url') as string;
    const repoUrl = formData.get('repoUrl') as string;
    const icon = formData.get('icon') as string;
    const status = formData.get('status') as AppStatus;
    const slug = formData.get('slug') as string;
    const featured = formData.get('featured') === 'on';
    const sortOrder = Number(formData.get('sortOrder')) || 0;
    const tagIds = (formData.get('tagIds') as string)?.split(',').filter(Boolean) || [];

    const { slug: nextSlug, prevSlug } = await updateAppCore(id, {
      name,
      description,
      content,
      url,
      repoUrl,
      icon,
      status,
      featured,
      sortOrder,
      slug,
    });

    await setAppTagsCore(id, tagIds);

    revalidateAfterAppMutation(nextSlug, prevSlug);
    redirect('/admin');
  } catch (e) {
    console.error('Failed to update app:', e);
    throw e;
  }
}

export async function deleteApp(id: string) {
  await checkAuth();
  const result = await deleteAppCore(id);
  revalidateAfterAppMutation(result?.slug ?? null);
}
