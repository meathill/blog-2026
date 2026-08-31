import { ImageResponse } from 'next/og';
import { OG_CACHE_CONTROL, OG_SIZE, transcodeToJpeg } from '@/lib/og/post-image';

// Satori 默认字体不含 CJK 字形，站点级 OG 图固定用英文文案。
function renderHome(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #4F46E5, #9333EA)',
        color: 'white',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: -2,
          textShadow: '0 2px 10px rgba(0,0,0,0.35)',
        }}
      >
        Meathill Studio
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 36,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        Full-stack Engineering · Cloudflare · AI Apps
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 50,
          fontSize: 32,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        meathill.com
      </div>
    </div>,
    { ...OG_SIZE },
  );
}

export async function GET() {
  const image = await transcodeToJpeg(renderHome());
  return new Response(image.bytes, {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': OG_CACHE_CONTROL,
    },
  });
}
