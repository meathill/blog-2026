import { ImageResponse } from 'next/og';
import { getPost, stripHtml } from '@/lib/wordpress';
import { NextRequest } from 'next/server';

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return new ImageResponse(
      <div
        style={{
          fontSize: 48,
          background: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: 'white',
        }}
      >
        Missing Slug
      </div>,
      {
        ...size,
      },
    );
  }

  const cleanSlug = slug.endsWith('.html') ? slug.replace('.html', '') : slug;
  const post = await getPost(cleanSlug);

  if (!post) {
    return new ImageResponse(
      <div
        style={{
          fontSize: 48,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        Article Not Found
      </div>,
      {
        ...size,
      },
    );
  }

  const title = stripHtml(post.title.rendered);
  const rawFeaturedMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  // Satori (next/og ImageResponse) 不支持 WebP，通过 Cloudflare Image Resizing 转为 PNG
  const featuredMedia = rawFeaturedMedia && rawFeaturedMedia.match(/\.webp(\?|$)/i)
    ? rawFeaturedMedia.replace(/(https?:\/\/[^/]+)(\/.*)/, '$1/cdn-cgi/image/format=png,width=1200$2')
    : rawFeaturedMedia;

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
    {
      ...size,
    },
  );
}
