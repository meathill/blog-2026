'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { type BlogPostRecord, buildBlogSlug, normalizeBlogPostStatus, parseBlogStringListInput } from '@/lib/blog-post';
import { syncBlogPostToWordPress } from '@/lib/blog-sync';
import {
  type SaveBlogPostInput,
  createBlogPostRecord,
  getBlogPostRecord,
  listBlogPostRecords,
  markBlogPostPublished,
  updateBlogPostRecord,
} from '@/lib/blog-storage';

export async function listBlogPosts(options?: { page?: number; pageSize?: number }) {
  await checkAuth();
  return listBlogPostRecords(options);
}

export async function getBlogPost(id: string) {
  await checkAuth();
  return getBlogPostRecord(id);
}

export async function createBlogPost(formData: FormData) {
  await checkAuth();

  const payload = await parseBlogPostFormData(formData);
  const id = await createBlogPostRecord(payload);

  revalidateBlogAdminPaths();
  redirect(`/admin/blog/${id}?saved=1`);
}

export async function updateBlogPost(formData: FormData) {
  await checkAuth();

  const id = readRequiredString(formData, 'id', '文章 ID 缺失。');
  const payload = await parseBlogPostFormData(formData);
  await updateBlogPostRecord(id, payload);

  revalidateBlogAdminPaths();
  redirect(`/admin/blog/${id}?saved=1`);
}

export async function publishBlogPost(formData: FormData) {
  await checkAuth();

  const id = await saveBlogPostForPublishing(formData);
  const post = await getBlogPostRecord(id);

  if (!post) {
    throw new Error('文章不存在。');
  }

  const { env } = await getCloudflareContext({ async: true });
  const now = post.publishedAt ?? new Date();
  const syncResult = await syncBlogPostToWordPress(env, {
    ...post,
    status: 'published',
    publishedAt: now,
  });

  const syncedAt = new Date();
  await markBlogPostPublished(id, {
    status: 'published',
    wpPostId: syncResult.wpPostId,
    wpSyncedAt: syncedAt,
    publishedAt: now,
  });

  revalidateBlogAdminPaths();
  const search = syncResult.warning ? '?published=1&warning=cover-image' : '?published=1';
  redirect(`/admin/blog/${id}${search}`);
}

async function saveBlogPostForPublishing(formData: FormData): Promise<string> {
  const id = readOptionalString(formData, 'id');
  const payload = await parseBlogPostFormData(formData, 'published');

  if (id) {
    await updateBlogPostRecord(id, payload);
    return id;
  }

  return createBlogPostRecord(payload);
}

async function parseBlogPostFormData(
  formData: FormData,
  forcedStatus?: BlogPostRecord['status'],
): Promise<SaveBlogPostInput> {
  const { buildBlogContentSnapshot } = await import('@/lib/blog-content');
  const title = readRequiredString(formData, 'title', '标题不能为空。');
  const slug = buildBlogSlug(title, readOptionalString(formData, 'slug'));
  const excerpt = readOptionalString(formData, 'excerpt') || '';
  const coverImage = readOptionalString(formData, 'coverImage') || null;
  const categories = parseBlogStringListInput(readOptionalString(formData, 'categoriesInput'));
  const tags = parseBlogStringListInput(readOptionalString(formData, 'tagsInput'));
  const status = forcedStatus ?? normalizeBlogPostStatus(readOptionalString(formData, 'status'));
  const content = await buildBlogContentSnapshot(readOptionalString(formData, 'blocksJson'));

  return {
    title,
    slug,
    excerpt,
    coverImage,
    categories,
    tags,
    status,
    blocksJson: content.blocksJson,
    markdown: content.markdown,
    html: content.html,
  };
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

function revalidateBlogAdminPaths() {
  revalidatePath('/admin/blog');
}

function readOptionalString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function readRequiredString(formData: FormData, key: string, message: string): string {
  const value = readOptionalString(formData, key);
  if (!value) {
    throw new Error(message);
  }

  return value;
}
