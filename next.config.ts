import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import pkg from './package.json';
import createNextIntlPlugin from 'next-intl/plugin';

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
};

export default withNextIntl(nextConfig);
