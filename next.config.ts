import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import pkg from './package.json';

initOpenNextCloudflareForDev();

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // WordPress CMS 配置
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    WORDPRESS_API_URL: process.env.WORDPRESS_API_URL || 'https://blog.meathill.com/wp-json/wp/v2',
  },

  // 图片域名配置
  images: {
    loader: 'custom',
    loaderFile: './image-loader.ts',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // API 由业务处理，不交给 Workers Cache 的默认启发式缓存。
        // /api/og/* 排除在外：成功图由路由写可缓存的 Cloudflare-CDN-Cache-Control；
        // 失败和 ?refresh=1 在响应里标 no-store。Workers cache key 含查询串。
        source: '/api/:path((?!og/).*)',
        headers: [{ key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' }],
      },
      {
        source: '/favicon.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
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

export default withNextIntl(nextConfig);
