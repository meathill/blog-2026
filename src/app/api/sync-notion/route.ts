import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { fetchReadyPosts, updateNotionPostStatus } from '@/lib/notion';
import { createPost, updatePost, getPost } from '@/lib/wordpress';
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

      // 1. Check if post exists in WP (by slug)
      let wpPost = await getPost(nPost.slug);

      const postData = {
        title: nPost.title,
        content: finalContent,
        date: nPost.date,
        slug: nPost.slug,
        status: 'publish', // Publish immediately
        // tags: nPost.tags, // TODO: ID mapping needed for tags, skipping for MVP or needing "create tag" logic
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
