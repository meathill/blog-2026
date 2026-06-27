import { ImageResponse } from 'next/og';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getPost, stripHtml } from '@/lib/wordpress';

export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

export interface OgImage {
  bytes: ArrayBuffer;
  contentType: string;
}

export function ogR2Key(slug: string): string {
  const cleanSlug = slug.endsWith('.html') ? slug.replace('.html', '') : slug;
  return `og/post/${cleanSlug}.jpg`;
}

async function loadCoverDataUrl(url: string): Promise<string | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.IMAGES) return null;
    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) return null;
    const out = await env.IMAGES.input(upstream.body)
      .transform({ width: OG_SIZE.width, height: OG_SIZE.height, fit: 'cover' })
      .output({ format: 'image/png' });
    const buf = await out.response().arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    return `data:image/png;base64,${b64}`;
  } catch {
    return null;
  }
}

// next/og 的 ImageResponse 始终输出 PNG,对带照片的合成图压缩率极差(普遍 ~1MB)。
// 走 Cloudflare IMAGES binding 转码成 JPEG@82,体积可降到 150–280KB,稳过 WhatsApp 的 300KB 上限。
// 本地无 IMAGES 绑定时回退原始 PNG,不阻断生成。
export async function transcodeToJpeg(image: ImageResponse): Promise<OgImage> {
  const pngBuffer = await image.arrayBuffer();
  const { env } = await getCloudflareContext({ async: true });
  if (!env.IMAGES) {
    return { bytes: pngBuffer, contentType: 'image/png' };
  }
  const pngStream = new Response(pngBuffer).body!;
  const transformed = await env.IMAGES.input(pngStream).output({
    format: 'image/jpeg',
    quality: 82,
  });
  const bytes = await new Response(transformed.image()).arrayBuffer();
  return { bytes, contentType: 'image/jpeg' };
}

function renderComposite(title: string, featuredMedia: string | null, categoryName: string | undefined): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        fontSize: 60,
        background: 'black',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
      }}
    >
      {/* Background Image */}
      {featuredMedia ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={featuredMedia}
          alt={title}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom right, #4F46E5, #9333EA)',
          }}
        />
      )}

      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* Content Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '40px',
          textAlign: 'center',
          maxWidth: '80%',
        }}
      >
        {categoryName && (
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: 20,
              padding: '6px 18px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {categoryName}
          </div>
        )}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            marginBottom: 20,
            lineHeight: 1.2,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 8,
            padding: '14px 36px',
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#111',
            borderRadius: 999,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          Read more →
        </div>
      </div>

      {/* Footer Brand */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 50,
          fontSize: 32,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.8)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        @meathill1
      </div>
    </div>,
    { ...OG_SIZE },
  );
}

// 渲染一篇博文的 OG 图(JPEG 字节)。post 不存在返回 null。
export async function renderPostOgJpeg(slug: string): Promise<OgImage | null> {
  const cleanSlug = slug.endsWith('.html') ? slug.replace('.html', '') : slug;
  const post = await getPost(cleanSlug);
  if (!post) return null;

  const title = stripHtml(post.title.rendered);
  const rawFeaturedMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  // Satori 不支持 WebP,且从 Worker 内发往同 zone cdn-cgi 子请求在 global_fetch_strictly_public
  // 下会被打回 Worker 自己导致非图片响应;改用 IMAGES binding 转码后以 data URL 喂给 Satori。
  const featuredMedia = rawFeaturedMedia ? await loadCoverDataUrl(rawFeaturedMedia) : null;

  // 取第一个有效分类作为顶部主题徽标,跳过 uncategorized 这类兜底分类。
  const categoryName = post._embedded?.['wp:term']?.[0]?.find(
    (term) => term.name && term.slug !== 'uncategorized',
  )?.name;

  return transcodeToJpeg(renderComposite(title, featuredMedia, categoryName));
}

async function readR2(slug: string): Promise<OgImage | null> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.BUCKET) return null;
  const obj = await env.BUCKET.get(ogR2Key(slug));
  if (!obj) return null;
  return {
    bytes: await obj.arrayBuffer(),
    contentType: obj.httpMetadata?.contentType ?? 'image/jpeg',
  };
}

async function writeR2(slug: string, image: OgImage): Promise<void> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.BUCKET) return;
  await env.BUCKET.put(ogR2Key(slug), image.bytes, {
    httpMetadata: { contentType: image.contentType },
  });
}

// 快路径:R2 命中直接返回(不碰 WP/Satori);未命中则渲染并写入 R2。
export async function getOrCreatePostOgJpeg(slug: string): Promise<OgImage | null> {
  const cached = await readR2(slug);
  if (cached) return cached;

  const rendered = await renderPostOgJpeg(slug);
  if (rendered) await writeR2(slug, rendered);
  return rendered;
}

// 强制重渲并覆盖 R2(供发布钩子和 ?refresh=1 使用)。
export async function regeneratePostOg(slug: string): Promise<OgImage | null> {
  const rendered = await renderPostOgJpeg(slug);
  if (rendered) await writeR2(slug, rendered);
  return rendered;
}
