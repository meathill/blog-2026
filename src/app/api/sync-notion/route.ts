import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { fetchReadyPosts, updateNotionPostStatus } from '@/lib/notion';
import { createPost, updatePost, getPost, getOrCreateCategory, getOrCreateTag } from '@/lib/wordpress';
import { processContentImages } from '@/lib/content-processor';

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });

  // Optional: Simple secret check to prevent unauthorized calls
  const apiKey = req.nextUrl.searchParams.get('key');
  const secret = env.CRON_SECRET || 'test'; // Use a better secret in prod
  if (apiKey !== secret && process.env.NODEJS_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const logs: string[] = [];
  try {
    const notionPosts = await fetchReadyPosts(env);
    logs.push(`Found ${notionPosts.length} posts with status "Ready"`);

    for (const nPost of notionPosts) {
      if (!nPost.slug) {
        logs.push(`Skipping "${nPost.title}": No Slug`);
        continue;
      }

      // Process Content (Sideload Images)
      logs.push(`Processing content for "${nPost.title}"...`);
      const finalContent = await processContentImages(env, nPost.content, nPost.slug);

      // Resolve Taxonomies
      const categoryIds: number[] = [];
      const tagIds: number[] = [];

      // Categories
      if (nPost.categories && nPost.categories.length > 0) {
        for (const catName of nPost.categories) {
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
      if (nPost.tags && nPost.tags.length > 0) {
        for (const tagName of nPost.tags) {
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
      let wpPost = await getPost(nPost.slug);

      const postData = {
        title: nPost.title,
        content: finalContent,
        date: nPost.date,
        slug: nPost.slug,
        status: 'publish', // Publish immediately
        categories: categoryIds, // Synced IDs
        tags: tagIds, // Synced IDs
      };

      if (wpPost) {
        // Update
        logs.push(`Updating "${nPost.title}" (ID: ${wpPost.id})...`);
        await updatePost(env, wpPost.id, postData);
      } else {
        // Create
        logs.push(`Creating "${nPost.title}"...`);
        wpPost = await createPost(env, postData);
      }

      // 2. Update Notion Status
      await updateNotionPostStatus(env, nPost.id, 'Published');
      logs.push(`Marked "${nPost.title}" as Published in Notion`);
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  }
}
