import { fetchReadyPosts, updateNotionPostStatus } from '@/lib/notion';
import { createPost, updatePost, getPost, getOrCreateCategory, getOrCreateTag, verifyAuth } from '@/lib/wordpress';
import { processContentImages, downloadAndUploadImage } from '@/lib/content-processor';
import { getBackupPostsPendingSync, markBackupPostPublished, upsertNotionPostsToBackup } from '@/lib/notion-post-backup';

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

export async function syncNotionToWordPress(
  env: CloudflareEnv,
): Promise<{ success: boolean; logs: string[]; error?: string }> {
  const logs: string[] = [];
  try {
    // 0. Verify Auth
    const authCheck = await verifyAuth(env);
    if (!authCheck.success) {
      throw new Error(`WordPress Auth Failed: ${authCheck.status} ${authCheck.body}`); // Stop immediately
    }
    logs.push(`Authenticated as user: ${authCheck.user.name} (${authCheck.user.roles.join(', ')})`);

    const notionPosts = await fetchReadyPosts(env);
    logs.push(`Fetched ${notionPosts.length} posts from Notion`);

    const backupCount = await upsertNotionPostsToBackup(notionPosts);
    logs.push(`Backed up ${backupCount} posts into D1`);

    const backupPosts = await getBackupPostsPendingSync();
    logs.push(`Found ${backupPosts.length} backup posts pending WordPress sync`);

    for (const backupPost of backupPosts) {
      if (!backupPost.slug) {
        logs.push(`Skipping "${backupPost.title}": No Slug`);
        continue;
      }

      // Process Content (Sideload Images)
      logs.push(`Processing content for "${backupPost.title}"...`);
      const finalContent = await processContentImages(env, backupPost.content, backupPost.slug);

      // Resolve Taxonomies
      const categoryIds: number[] = [];
      const tagIds: number[] = [];

      // Categories
      if (backupPost.categories && backupPost.categories.length > 0) {
        for (const catName of backupPost.categories) {
          try {
            const cat = await getOrCreateCategory(env, catName);
            if (cat && cat.id) categoryIds.push(cat.id);
          } catch (e) {
            console.error(`Failed to sync category: ${catName}`, e);
            logs.push(`Error syncing category "${catName}"`);
          }
        }
      }

      // Tags
      if (backupPost.tags && backupPost.tags.length > 0) {
        for (const tagName of backupPost.tags) {
          try {
            const tag = await getOrCreateTag(env, tagName);
            if (tag && tag.id) tagIds.push(tag.id);
          } catch (e) {
            console.error(`Failed to sync tag: ${tagName}`, e);
            logs.push(`Error syncing tag "${tagName}"`);
          }
        }
      }

      // 1. Check if post exists in WP (by slug)
      // DISABLE CACHE to avoid duplicate post creation if we just found it previously but cache says valid
      let wpPost = await getPost(backupPost.slug, { cache: 'no-store' });

      // Handle Cover Image
      let featuredMediaId = 0;
      if (backupPost.coverImage) {
        logs.push(`Processing cover image for "${backupPost.title}"...`);
        // Use 'cover' suffix
        const filename = `${backupPost.slug}-cover-${Date.now()}.jpg`;
        const media = await downloadAndUploadImage(env, backupPost.coverImage, filename);
        if (media) {
          featuredMediaId = media.id;
          logs.push(`Cover image uploaded (ID: ${media.id})`);
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
        logs.push(`Updating "${backupPost.title}" (ID: ${wpPost.id})...`);
        await updatePost(env, wpPost.id, postData);
      } else {
        // Create
        logs.push(`Creating "${backupPost.title}"...`);
        wpPost = await createPost(env, postData);
      }

      await markBackupPostPublished(backupPost.id);
      logs.push(`Marked "${backupPost.title}" as Published in D1`);

      await updateNotionPostStatus(env, backupPost.id, 'Published');
      logs.push(`Marked "${backupPost.title}" as Published in Notion`);
    }

    return { success: true, logs };
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage, logs };
  }
}
