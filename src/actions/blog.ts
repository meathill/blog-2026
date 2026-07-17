'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { type BlogMetadataAiEnv, generateBlogMetadataSuggestion } from '@/lib/blog-ai';
import { buildBlogContentSnapshot } from '@/lib/blog-content';
import { type BlogPostRecord, buildBlogSlug, normalizeBlogPostStatus, parseBlogStringListInput } from '@/lib/blog-post';
import {
  createBlogPostRecord,
  deleteBlogPostRecord,
  getBlogPostRecord,
  listBlogPostRecords,
  markBlogPostPublished,
  type SaveBlogPostInput,
  updateBlogPostRecord,
} from '@/lib/blog-storage';
import { syncBlogPostToWordPress } from '@/lib/blog-sync';
import { purgeCloudflareCache } from '@/lib/cloudflare-purge';
import { regeneratePostOg } from '@/lib/og/post-image';

export async function listBlogPosts(options?: { page?: number; pageSize?: number; search?: string }) {
  await checkAuth();
  return listBlogPostRecords(options);
}

export async function getBlogPost(id: string) {
  await checkAuth();
  return getBlogPostRecord(id);
}

export interface BlogEditorMutationResult {
  id: string;
  slug: string;
  status: 'saved' | 'published';
  warning?: 'cover-image-upload-failed' | 'cache-purge-failed';
}

export async function createBlogPost(formData: FormData): Promise<BlogEditorMutationResult> {
  await checkAuth();

  const payload = await parseBlogPostFormData(formData);
  const id = await createBlogPostRecord(payload);

  revalidateBlogAdminPaths(id);

  return {
    id,
    slug: payload.slug,
    status: 'saved',
  };
}

export async function updateBlogPost(formData: FormData): Promise<BlogEditorMutationResult> {
  await checkAuth();

  const id = readRequiredString(formData, 'id', '文章 ID 缺失。');
  const payload = await parseBlogPostFormData(formData);
  await updateBlogPostRecord(id, payload);

  revalidateBlogAdminPaths(id);

  return {
    id,
    slug: payload.slug,
    status: 'saved',
  };
}

export async function deleteBlogPost(id: string): Promise<void> {
  await checkAuth();

  await deleteBlogPostRecord(id);
  revalidateBlogAdminPaths(id);
}

export async function publishBlogPost(formData: FormData): Promise<BlogEditorMutationResult> {
  await checkAuth();

  const { id, slug } = await saveBlogPostForPublishing(formData);
  const post = await getBlogPostRecord(id);

  if (!post) {
    throw new Error('文章不存在。');
  }

  const { env, ctx } = await getCloudflareContext({ async: true });
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

  // wp-json 边缘缓存 TTL 24h,发文时效靠这里的 purge(失败不阻断发布,给 UI 提示)
  const purgeResult = await purgeCloudflareCache(env);
  if (!purgeResult.success) {
    console.error('[publish] 边缘缓存清理失败:', purgeResult.warning);
  }

  revalidateBlogAdminPaths(id);
  revalidatePath('/');
  revalidatePath('/posts');
  revalidatePath('/feed');

  // purge 之后后台重渲 OG 图并写入 R2,保证发文后被 X 抓取时即时命中(best-effort,失败不阻断发布)。
  ctx.waitUntil(
    regeneratePostOg(slug).catch((error: unknown) => {
      console.error('[publish] OG 图预热失败:', error);
    }),
  );

  return {
    id,
    slug,
    status: 'published',
    warning: syncResult.warning ?? (purgeResult.success ? undefined : 'cache-purge-failed'),
  };
}

export async function generateBlogMetadata(formData: FormData) {
  await checkAuth();

  const title = readRequiredString(formData, 'title', '请先填写标题。');
  const locale = readOptionalString(formData, 'locale') || 'zh';
  const markdown = readRequiredString(formData, 'markdown', '正文内容不能为空。');
  const { env } = await getCloudflareContext({ async: true });

  return generateBlogMetadataSuggestion(env as BlogMetadataAiEnv, {
    locale,
    title,
    markdown,
  });
}

async function saveBlogPostForPublishing(formData: FormData): Promise<{ id: string; slug: string }> {
  const id = readOptionalString(formData, 'id');
  const payload = await parseBlogPostFormData(formData, 'published');

  if (id) {
    await updateBlogPostRecord(id, payload);
    return { id, slug: payload.slug };
  }

  return {
    id: await createBlogPostRecord(payload),
    slug: payload.slug,
  };
}

async function parseBlogPostFormData(
  formData: FormData,
  forcedStatus?: BlogPostRecord['status'],
): Promise<SaveBlogPostInput> {
  const title = readRequiredString(formData, 'title', '标题不能为空。');
  const slug = buildBlogSlug(title, readOptionalString(formData, 'slug'));
  const excerpt = readOptionalString(formData, 'excerpt') || '';
  const coverImage = readOptionalString(formData, 'coverImage') || null;
  const categories = parseBlogStringListInput(readOptionalString(formData, 'categoriesInput'));
  const tags = parseBlogStringListInput(readOptionalString(formData, 'tagsInput'));
  const status = forcedStatus ?? normalizeBlogPostStatus(readOptionalString(formData, 'status'));
  const html = readOptionalString(formData, 'html');
  const markdown = readOptionalString(formData, 'markdown');
  const content = buildBlogContentSnapshot(readOptionalString(formData, 'blocksJson'), html, markdown);

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

function revalidateBlogAdminPaths(id?: string) {
  revalidatePath('/admin/blog');
  revalidatePath('/admin/blog/new');

  if (id) {
    revalidatePath(`/admin/blog/${id}`);
  }
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
