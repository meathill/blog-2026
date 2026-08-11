import { afterEach, describe, expect, it, vi } from 'vitest';
import cloudflareImageLoader, { buildCloudflareImageUrl } from '../image-loader';

describe('image-loader', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('开发环境应直接返回原始 src', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(
      cloudflareImageLoader({
        src: '/images/cover.jpg?ver=1',
        width: 640,
        quality: 70,
      }),
    ).toBe('/images/cover.jpg?ver=1');
  });

  it('生产环境应为站内相对路径生成 Cloudflare Transform URL', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(
      cloudflareImageLoader({
        src: '/images/cover.jpg?ver=1',
        width: 640,
        quality: 70,
      }),
    ).toBe('/cdn-cgi/image/fit=scale-down,format=auto,width=640,quality=70/images/cover.jpg?ver=1');
  });

  it('应保留绝对远程地址与查询参数', () => {
    expect(
      buildCloudflareImageUrl({
        src: 'https://blog.meathill.com/wp-content/uploads/demo.png?resize=1200%2C630',
        width: 828,
        quality: 65,
      }),
    ).toBe(
      '/cdn-cgi/image/fit=scale-down,format=auto,width=828,quality=65/https://blog.meathill.com/wp-content/uploads/demo.png?resize=1200%2C630',
    );
  });

  it('未传 quality 时不应追加质量参数', () => {
    expect(
      buildCloudflareImageUrl({
        src: '/avatars/user.png',
        width: 96,
        quality: undefined,
      }),
    ).toBe('/cdn-cgi/image/fit=scale-down,format=auto,width=96/avatars/user.png');
  });
});
