import { uploadMedia } from './wordpress';

export async function downloadAndUploadImage(env: CloudflareEnv, imgUrl: string, filename: string): Promise<any> {
  try {
    console.log(`[ContentProcessor] Downloading: ${imgUrl.slice(0, 50)}...`);

    // Download Image
    const response = await fetch(imgUrl);
    if (!response.ok) {
      console.error(`[ContentProcessor] Failed to download image: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();

    // Upload to WP
    console.log(`[ContentProcessor] Uploading as: ${filename}`);
    const media = await uploadMedia(env, arrayBuffer, filename);

    if (media && media.source_url) {
      console.log(`[ContentProcessor] Uploaded! New URL: ${media.source_url}`);
      return media;
    }
  } catch (e) {
    console.error(`[ContentProcessor] Error processing image ${imgUrl}:`, e);
  }
  return null;
}

export async function processContentImages(env: CloudflareEnv, html: string, postSlug: string): Promise<string> {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  const matches: string[] = [];

  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1].includes('amazonaws.com') || match[1].includes('notion.so/image')) {
      matches.push(match[1]);
    }
  }

  // Deduplicate
  const uniqueUrls = [...new Set(matches)];
  console.log(`[ContentProcessor] Found ${uniqueUrls.length} images to sideload for ${postSlug}`);

  let processedHtml = html;

  for (const imgUrl of uniqueUrls) {
    const urlObj = new URL(imgUrl);
    const ext = urlObj.pathname.split('.').pop() || 'jpg';
    const filename = `${postSlug}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

    const media = await downloadAndUploadImage(env, imgUrl, filename);

    if (media) {
      const safeUrl = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const replaceRegex = new RegExp(safeUrl, 'g');
      processedHtml = processedHtml.replace(replaceRegex, media.source_url);
    }
  }

  return processedHtml;
}
