import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockGetCloudflareContext = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  }),
}));

vi.mock('next/headers', () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: (...args: unknown[]) => mockGetCloudflareContext(...args),
}));

import { uploadImage } from '@/actions/upload';

function buildFormDataWithFile(file?: File): FormData {
  const formData = new FormData();
  if (file) {
    formData.set('file', file);
  }
  return formData;
}

function createMockFile(name: string, content: string, type = 'image/png'): File {
  const file = new File([content], name, { type });
  const stream = vi.fn(() => new ReadableStream());
  Object.defineProperty(file, 'stream', {
    value: stream,
    configurable: true,
  });
  return file;
}

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({
      user: {
        email: 'dev@example.com',
      },
    });
  });

  it('未登录时应抛出 Unauthorized', async () => {
    mockGetSession.mockResolvedValue(null);
    const file = createMockFile('demo.png', 'hello');

    await expect(uploadImage(buildFormDataWithFile(file))).rejects.toThrow('Unauthorized');
    expect(mockGetCloudflareContext).not.toHaveBeenCalled();
  });

  it('缺少文件时应抛错', async () => {
    await expect(uploadImage(buildFormDataWithFile())).rejects.toThrow('No file provided');
    expect(mockGetCloudflareContext).not.toHaveBeenCalled();
  });

  it('未配置 BUCKET 绑定时应抛错', async () => {
    mockGetCloudflareContext.mockResolvedValue({ env: {} });
    const file = createMockFile('demo.png', 'hello');

    await expect(uploadImage(buildFormDataWithFile(file))).rejects.toThrow('R2 bucket not configured');
  });

  it('上传成功时应返回可访问 URL', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-1');
    const originalEnv = process.env.NEXT_PUBLIC_ASSETS_URL;
    process.env.NEXT_PUBLIC_ASSETS_URL = 'https://cdn.example.com/';

    const put = vi.fn().mockResolvedValue(undefined);
    mockGetCloudflareContext.mockResolvedValue({
      env: {
        BUCKET: { put },
      },
    });

    const file = createMockFile('hero.png', 'image-bytes');
    const result = await uploadImage(buildFormDataWithFile(file));

    expect(put).toHaveBeenCalledWith(
      'uuid-1-hero.png',
      expect.anything(),
      expect.objectContaining({
        httpMetadata: {
          contentType: 'image/png',
        },
      }),
    );
    expect(result).toEqual({ url: 'https://cdn.example.com/uuid-1-hero.png' });

    process.env.NEXT_PUBLIC_ASSETS_URL = originalEnv;
  });

  it('R2 上传失败时应包装错误信息', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-2');

    const put = vi.fn().mockRejectedValue(new Error('network down'));
    mockGetCloudflareContext.mockResolvedValue({
      env: {
        BUCKET: { put },
      },
    });

    const file = createMockFile('hero.png', 'image-bytes');
    await expect(uploadImage(buildFormDataWithFile(file))).rejects.toThrow('Failed to upload image: network down');
  });
});
