import { SITE_URL } from '@/lib/constants';

export const INDEXNOW_HOST = 'meathill.com';
export const INDEXNOW_KEY = 'a44ae7d8815444ca6d7b7692ab26cf0b';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const INDEXNOW_BATCH_SIZE = 10_000;

export interface IndexNowSubmitResult {
  success: boolean;
  submittedCount: number;
  batchCount: number;
  statuses: number[];
  warning?: string;
}

/**
 * 确保 URL 为绝对路径（支持 https://meathill.com/... 或以 / 开头的路径）
 */
export function normalizeIndexNowUrl(input: string, baseSiteUrl: string = SITE_URL): string {
  if (input.startsWith('https://') || input.startsWith('http://')) {
    return input;
  }
  if (input.startsWith('/')) {
    return `${baseSiteUrl}${input}`;
  }
  throw new Error(`无法识别的 URL 或路径：${input}`);
}

/**
 * 将 URL 列表按最大容量切片成批次
 */
export function chunkUrls(urls: string[], chunkSize: number = INDEXNOW_BATCH_SIZE): string[][] {
  if (chunkSize <= 0) {
    throw new Error('chunkSize 必须大于 0');
  }
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += chunkSize) {
    chunks.push(urls.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 提交 URL 列表至 IndexNow。自动去重、规范化，并按每批最多 10,000 条分批发送。
 * 成功语义：HTTP 200（已接收）或 202（已接收待验证 key）。
 */
export async function submitToIndexNow(
  inputs: string[],
  options?: {
    host?: string;
    key?: string;
    siteUrl?: string;
    endpoint?: string;
    fetchImpl?: typeof fetch;
  },
): Promise<IndexNowSubmitResult> {
  const host = options?.host ?? INDEXNOW_HOST;
  const key = options?.key ?? INDEXNOW_KEY;
  const siteUrl = options?.siteUrl ?? SITE_URL;
  const endpoint = options?.endpoint ?? INDEXNOW_ENDPOINT;
  const fetchFn = options?.fetchImpl ?? fetch;

  const normalized = Array.from(new Set(inputs.map((url) => normalizeIndexNowUrl(url, siteUrl))));
  if (normalized.length === 0) {
    return {
      success: true,
      submittedCount: 0,
      batchCount: 0,
      statuses: [],
    };
  }

  const batches = chunkUrls(normalized, INDEXNOW_BATCH_SIZE);
  const statuses: number[] = [];

  for (const batch of batches) {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteUrl}/${key}.txt`,
        urlList: batch,
      }),
    });

    statuses.push(response.status);
    if (!response.ok && response.status !== 202) {
      const errorText = await response.text().catch(() => '');
      return {
        success: false,
        submittedCount: normalized.length,
        batchCount: batches.length,
        statuses,
        warning: `IndexNow 响应异常 (HTTP ${response.status}): ${errorText || response.statusText}`,
      };
    }
  }

  return {
    success: true,
    submittedCount: normalized.length,
    batchCount: batches.length,
    statuses,
  };
}

/**
 * 发布或更新文章后提交至 IndexNow（失败不阻断发布）。
 * 提交文章规范 URL、按分类可能路径及文章归档根路径。
 */
export async function submitPostToIndexNow(
  slug: string,
  categories?: string[],
  siteUrl: string = SITE_URL,
  options?: {
    fetchImpl?: typeof fetch;
  },
): Promise<IndexNowSubmitResult> {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
  const urls: string[] = [`${siteUrl}/posts`];

  if (categories && categories.length > 0) {
    const primaryCat = categories[0].trim().replace(/^\/+|\/+$/g, '');
    if (primaryCat) {
      urls.push(`${siteUrl}/posts/${primaryCat}/${cleanSlug}`);
    }
  }
  urls.push(`${siteUrl}/posts/${cleanSlug}`);

  return submitToIndexNow(urls, { siteUrl, fetchImpl: options?.fetchImpl });
}
