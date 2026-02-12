import { fetchReadyPosts, updateNotionPostStatus } from '@/lib/notion';
import { createPost, updatePost, getPost, getOrCreateCategory, getOrCreateTag, verifyAuth } from '@/lib/wordpress';
import { processContentImages, downloadAndUploadImage } from '@/lib/content-processor';
import {
  getBackupPostsPendingSync,
  markBackupPostPublished,
  upsertNotionPostsToBackup,
} from '@/lib/notion-post-backup';

const MAX_RETRY_ATTEMPTS = 3;

interface WordPressPostPayload {
  title: string;
  content: string;
  slug: string;
  status: 'publish';
  categories: number[];
  tags: number[];
  date?: string;
  featured_media?: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function buildPostLogPrefix(syncRunId: string, postId: string, lastUpdateTime?: Date): string {
  let lastUpdateToken = 'unknown';
  if (lastUpdateTime instanceof Date && !Number.isNaN(lastUpdateTime.getTime())) {
    lastUpdateToken = lastUpdateTime.toISOString();
  }
  return `[sync-run:${syncRunId}][post:${postId}][last-update:${lastUpdateToken}]`;
}

async function retryOperation<T>(options: {
  operationName: string;
  logs: string[];
  postLogPrefix: string;
  operation: () => Promise<T>;
  maxAttempts?: number;
}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? MAX_RETRY_ATTEMPTS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await options.operation();
    } catch (error) {
      lastError = error;
      const errorMessage = getErrorMessage(error);
      options.logs.push(
        `${options.postLogPrefix} ${options.operationName} failed (${attempt}/${maxAttempts}): ${errorMessage}`,
      );
      if (attempt < maxAttempts) {
        options.logs.push(`${options.postLogPrefix} retrying ${options.operationName}...`);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown retry error');
}

async function createPostWithRetryAndIdempotency(options: {
  env: CloudflareEnv;
  slug: string;
  postData: WordPressPostPayload;
  logs: string[];
  postLogPrefix: string;
  maxAttempts?: number;
}): Promise<Awaited<ReturnType<typeof createPost>>> {
  const maxAttempts = options.maxAttempts ?? MAX_RETRY_ATTEMPTS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await createPost(options.env, options.postData);
    } catch (error) {
      lastError = error;
      const errorMessage = getErrorMessage(error);
      options.logs.push(
        `${options.postLogPrefix} create WordPress post failed (${attempt}/${maxAttempts}): ${errorMessage}`,
      );

      const existingPost = await getPost(options.slug, { cache: 'no-store' });
      if (existingPost) {
        options.logs.push(
          `${options.postLogPrefix} create failed but found existing WordPress post ID ${existingPost.id}, treat as idempotent success`,
        );
        return existingPost;
      }

      if (attempt < maxAttempts) {
        options.logs.push(`${options.postLogPrefix} retrying create WordPress post...`);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown create post error');
}

export async function syncNotionToWordPress(
  env: CloudflareEnv,
): Promise<{ success: boolean; logs: string[]; error?: string }> {
  const logs: string[] = [];
  const syncRunId = new Date().toISOString();
  try {
    // 0. Verify Auth
    const authCheck = await verifyAuth(env);
    if (!authCheck.success) {
      throw new Error(`WordPress Auth Failed: ${authCheck.status} ${authCheck.body}`); // Stop immediately
    }
    logs.push(
      `[sync-run:${syncRunId}] Authenticated as user: ${authCheck.user.name} (${authCheck.user.roles.join(', ')})`,
    );

    const notionPosts = await fetchReadyPosts(env);
    logs.push(`[sync-run:${syncRunId}] Fetched ${notionPosts.length} posts from Notion`);

    const backupCount = await upsertNotionPostsToBackup(notionPosts);
    logs.push(`[sync-run:${syncRunId}] Backed up ${backupCount} posts into D1`);

    const backupPosts = await getBackupPostsPendingSync();
    logs.push(`[sync-run:${syncRunId}] Found ${backupPosts.length} backup posts pending WordPress sync`);

    for (const backupPost of backupPosts) {
      const postLogPrefix = buildPostLogPrefix(syncRunId, backupPost.id, backupPost.lastUpdateTime);

      if (!backupPost.slug) {
        logs.push(`${postLogPrefix} Skipping "${backupPost.title}": No Slug`);
        continue;
      }

      // Process Content (Sideload Images)
      logs.push(`${postLogPrefix} Processing content for "${backupPost.title}"...`);
      const finalContent = await retryOperation({
        operationName: 'process content images',
        logs,
        postLogPrefix,
        operation: async () => processContentImages(env, backupPost.content, backupPost.slug),
      });

      // Resolve Taxonomies
      const categoryIds: number[] = [];
      const tagIds: number[] = [];

      // Categories
      if (backupPost.categories && backupPost.categories.length > 0) {
        for (const catName of backupPost.categories) {
          try {
            const cat = await retryOperation({
              operationName: `sync category "${catName}"`,
              logs,
              postLogPrefix,
              operation: async () => getOrCreateCategory(env, catName),
            });
            if (cat && cat.id) categoryIds.push(cat.id);
          } catch (e) {
            console.error(`Failed to sync category: ${catName}`, e);
            logs.push(`${postLogPrefix} Error syncing category "${catName}"`);
          }
        }
      }

      // Tags
      if (backupPost.tags && backupPost.tags.length > 0) {
        for (const tagName of backupPost.tags) {
          try {
            const tag = await retryOperation({
              operationName: `sync tag "${tagName}"`,
              logs,
              postLogPrefix,
              operation: async () => getOrCreateTag(env, tagName),
            });
            if (tag && tag.id) tagIds.push(tag.id);
          } catch (e) {
            console.error(`Failed to sync tag: ${tagName}`, e);
            logs.push(`${postLogPrefix} Error syncing tag "${tagName}"`);
          }
        }
      }

      // 1. Check if post exists in WP (by slug)
      // DISABLE CACHE to avoid duplicate post creation if we just found it previously but cache says valid
      let wpPost = await getPost(backupPost.slug, { cache: 'no-store' });

      // Handle Cover Image
      let featuredMediaId = 0;
      if (backupPost.coverImage) {
        logs.push(`${postLogPrefix} Processing cover image for "${backupPost.title}"...`);
        // Use 'cover' suffix
        const filename = `${backupPost.slug}-cover-${Date.now()}.jpg`;
        const media = await retryOperation({
          operationName: 'upload cover image',
          logs,
          postLogPrefix,
          operation: async () => downloadAndUploadImage(env, backupPost.coverImage!, filename),
        });
        if (media) {
          featuredMediaId = media.id;
          logs.push(`${postLogPrefix} Cover image uploaded (ID: ${media.id})`);
        }
      }

      const postData: WordPressPostPayload = {
        title: backupPost.title,
        content: finalContent,
        slug: backupPost.slug,
        status: 'publish', // Publish immediately
        categories: categoryIds, // Synced IDs
        tags: tagIds, // Synced IDs
      };
      if (backupPost.date) {
        postData.date = backupPost.date;
      }
      if (featuredMediaId) {
        postData.featured_media = featuredMediaId;
      }

      if (wpPost) {
        // Update
        const postId = wpPost.id;
        logs.push(`${postLogPrefix} Updating "${backupPost.title}" (ID: ${postId})...`);
        await retryOperation({
          operationName: `update WordPress post ${postId}`,
          logs,
          postLogPrefix,
          operation: async () => updatePost(env, postId, postData),
        });
      } else {
        // Create
        logs.push(`${postLogPrefix} Creating "${backupPost.title}"...`);
        wpPost = await createPostWithRetryAndIdempotency({
          env,
          slug: backupPost.slug,
          postData,
          logs,
          postLogPrefix,
        });
      }

      await retryOperation({
        operationName: 'mark backup post as published in D1',
        logs,
        postLogPrefix,
        operation: async () => markBackupPostPublished(backupPost.id),
      });
      logs.push(`${postLogPrefix} Marked "${backupPost.title}" as Published in D1`);

      await retryOperation({
        operationName: 'mark Notion post as Published',
        logs,
        postLogPrefix,
        operation: async () => updateNotionPostStatus(env, backupPost.id, 'Published'),
      });
      logs.push(`${postLogPrefix} Marked "${backupPost.title}" as Published in Notion`);
    }

    return { success: true, logs };
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage, logs };
  }
}
