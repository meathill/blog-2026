import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // WordPress CMS 配置
  env: {
    WORDPRESS_API_URL: process.env.WORDPRESS_API_URL || 'https://blog.meathill.com/wp-json/wp/v2',
  },

  // 图片域名配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blog.meathill.com',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
      },
    ],
  },

  // 静态资源缓存头
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
