import { downloadAndUploadImage } from '@/lib/content-processor';
import type { BlogPostRecord } from '@/lib/blog-post';
import {
  createPost,
  getOrCreateCategory,
  getOrCreateTag,
  getPost,
  getPostById,
  updatePost,
  verifyAuth,
} from '@/lib/wordpress';

export interface BlogWordPressSyncResult {
  wpPostId: number;
  warning?: 'cover-image-upload-failed';
}

interface WordPressBlogPayload {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  status: 'publish';
  categories: number[];
  tags: number[];
  date?: string;
  featured_media?: number;
}

export async function syncBlogPostToWordPress(
  env: CloudflareEnv,
  post: BlogPostRecord,
): Promise<BlogWordPressSyncResult> {
  const authCheck = await verifyAuth(env);
  if (!authCheck.success) {
    throw new Error(`WordPress Auth Failed: ${authCheck.status} ${authCheck.body}`);
  }

  const [categoryIds, tagIds] = await Promise.all([syncCategoryIds(env, post.categories), syncTagIds(env, post.tags)]);

  let warning: BlogWordPressSyncResult['warning'];
  const featuredMediaId = await uploadCoverImage(env, post).catch((error: unknown) => {
    console.error('[Blog Sync] Failed to upload cover image:', error);
    warning = 'cover-image-upload-failed';
    return 0;
  });

  const payload: WordPressBlogPayload = {
    title: post.title,
    excerpt: post.excerpt,
    content: post.html,
    slug: post.slug,
    status: 'publish',
    categories: categoryIds,
    tags: tagIds,
  };

  if (post.publishedAt) {
    payload.date = post.publishedAt.toISOString();
  }

  if (featuredMediaId) {
    payload.featured_media = featuredMediaId;
  }

  const existingPost = await resolveExistingWordPressPost(post);
  const syncedPost = existingPost ? await updatePost(env, existingPost.id, payload) : await createPost(env, payload);

  return {
    wpPostId: syncedPost.id,
    warning,
  };
}

async function resolveExistingWordPressPost(post: BlogPostRecord) {
  if (post.wpPostId) {
    const existingById = await getPostById(post.wpPostId, { cache: 'no-store' });
    if (existingById) {
      return existingById;
    }
  }

  return getPost(post.slug, { cache: 'no-store' });
}

async function syncCategoryIds(env: CloudflareEnv, categories: string[]): Promise<number[]> {
  const ids: number[] = [];

  for (const category of categories) {
    const syncedCategory = await getOrCreateCategory(env, category);
    ids.push(syncedCategory.id);
  }

  return ids;
}

async function syncTagIds(env: CloudflareEnv, tags: string[]): Promise<number[]> {
  const ids: number[] = [];

  for (const tag of tags) {
    const syncedTag = await getOrCreateTag(env, tag);
    ids.push(syncedTag.id);
  }

  return ids;
}

async function uploadCoverImage(env: CloudflareEnv, post: BlogPostRecord): Promise<number> {
  if (!post.coverImage) {
    return 0;
  }

  const filename = buildWordPressCoverFilename(post.slug, post.coverImage);
  const media = await downloadAndUploadImage(env, post.coverImage, filename);
  return media?.id ?? 0;
}

function buildWordPressCoverFilename(slug: string, coverImageUrl: string): string {
  const fallbackExt = 'jpg';

  try {
    const url = new URL(coverImageUrl);
    const ext = url.pathname.split('.').pop() || fallbackExt;
    return `${slug}-cover-${Date.now()}.${ext}`;
  } catch {
    return `${slug}-cover-${Date.now()}.${fallbackExt}`;
  }
}
