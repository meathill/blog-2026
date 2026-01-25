import { uploadMedia } from './wordpress';

/**
 * Process HTML content to sideload images from Notion/AWS to WordPress
 */
export async function processContentImages(env: CloudflareEnv, html: string, postSlug: string): Promise<string> {
  // Regex to find image sources that look like Notion's signed URLs (AWS S3)
  // Usually start with https://prod-files-secure.s3.us-west-2.amazonaws.com or similiar
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
    try {
      console.log(`[ContentProcessor] Downloading: ${imgUrl.slice(0, 50)}...`);

      // Download Image
      const response = await fetch(imgUrl);
      if (!response.ok) {
        console.error(`[ContentProcessor] Failed to download image: ${response.status}`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();

      // Generate Filename: slug_timestamp_index.jpg
      const urlObj = new URL(imgUrl);
      const ext = urlObj.pathname.split('.').pop() || 'jpg';
      const filename = `${postSlug}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

      // Upload to WP
      console.log(`[ContentProcessor] Uploading as: ${filename}`);
      const media = await uploadMedia(env, arrayBuffer, filename);

      if (media && media.source_url) {
        console.log(`[ContentProcessor] Uploaded! New URL: ${media.source_url}`);

        // Replace ALL occurrences of this URL in HTML
        // Escaping special regex chars in URL
        const safeUrl = imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replaceRegex = new RegExp(safeUrl, 'g');
        processedHtml = processedHtml.replace(replaceRegex, media.source_url);

        // Optional: Add 'src-set' removal or width/height adjustments if needed,
        // but basic source replacement is usually enough for WP to handle.
      }
    } catch (e) {
      console.error(`[ContentProcessor] Error processing image ${imgUrl}:`, e);
    }
  }

  return processedHtml;
}
