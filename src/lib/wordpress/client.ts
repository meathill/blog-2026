import { getCloudflareContext } from '@opennextjs/cloudflare';
import { PUBLIC_REVALIDATE_SECONDS, WP_CACHE_TAG } from '@/lib/cache-config';
import { getWordPressAccessHeaders, getWordPressApiUrl } from './access';

const getAccessHeaders = getWordPressAccessHeaders;

// 源站（Tunnel→Caddy→PHP-FPM→TiDB）偶发挂起时，Cloudflare 要等满 100s 才回 524，
// 期间冷渲染的文章页一直挂着。30s 快速失败 + GET 重试一次，最坏 ~61s，
// 同时给源站冷启动（15s+，见 DEV_NOTE）留足余量。
const WP_FETCH_TIMEOUT_MS = 30_000;
const WP_FETCH_RETRY_DELAY_MS = 1_000;
const WP_FETCH_MAX_ATTEMPTS = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry(url: string, init: RequestInit): Promise<Response> {
  // 写操作不具备幂等性，失败直接抛出，避免重试导致重复创建
  const canRetry = (init.method ?? 'GET').toUpperCase() === 'GET';

  for (let attempt = 1; attempt <= WP_FETCH_MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(WP_FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (!canRetry || attempt === WP_FETCH_MAX_ATTEMPTS) {
        console.error(
          `[WP API] Request failed, attempt ${attempt}, spent ${Date.now() - startedAt}ms: ${url} (${reason})`,
        );
        throw error;
      }
      console.warn(`[WP API] Request failed in ${Date.now() - startedAt}ms (${reason}), retrying: ${url}`);
      await sleep(WP_FETCH_RETRY_DELAY_MS);
      continue;
    }

    // 4xx 属于确定失败（如文章不存在），重试没有意义
    if (response.ok || response.status < 500 || !canRetry || attempt === WP_FETCH_MAX_ATTEMPTS) {
      return response;
    }

    console.warn(`[WP API] Origin returned ${response.status} in ${Date.now() - startedAt}ms, retrying: ${url}`);
    await response.body?.cancel();
    await sleep(WP_FETCH_RETRY_DELAY_MS);
  }

  // 循环内必有 return / throw，这里只为通过 TS 的类型收窄
  throw new Error('[WP API] unreachable');
}

export async function wpFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const { env } = await getCloudflareContext({ async: true });
  const url = `${getWordPressApiUrl(env)}${endpoint}`;
  const headers: HeadersInit = {
    ...getAccessHeaders(env),
    ...(options?.headers || {}),
  };

  const response = await requestWithRetry(url, {
    ...options,
    headers,
    next: {
      revalidate: options?.cache === 'no-store' ? 0 : PUBLIC_REVALIDATE_SECONDS,
      tags: [WP_CACHE_TAG],
      ...options?.next,
    },
    cache: options?.cache,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[WP API] Error Body:', text);
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getBasicAuthHeader(env: CloudflareEnv): HeadersInit {
  const WP_USERNAME = env.WP_USERNAME || process.env.WP_USERNAME;
  const WP_APP_PASSWORD = env.WP_APP_PASSWORD || process.env.WP_APP_PASSWORD;
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error('Missing WP_USERNAME or WP_APP_PASSWORD');
  }
  const auth = btoa(`${WP_USERNAME}:${WP_APP_PASSWORD}`);
  return {
    Authorization: `Basic ${auth}`,
  };
}

export async function verifyAuth(env: CloudflareEnv): Promise<any> {
  const url = `${getWordPressApiUrl(env)}/users/me?context=edit`; // context=edit reveals roles
  const headers = {
    ...getAccessHeaders(env),
    ...getBasicAuthHeader(env),
  };

  console.log('[WP Auth Check] Request:', url);
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text();
    console.error('[WP Auth Check] Failed:', response.status, text);
    return { success: false, status: response.status, body: text };
  }

  const user = (await response.json()) as any;
  console.log('[WP Auth Check] Success. User:', user.name, 'Roles:', user.roles);
  return { success: true, user };
}

// Internal exports for use in other modules if needed, or we could duplicate/move getAccessHeaders/getBasicAuthHeader if we want to avoid internal exports.
// For now, I'll export them as we need them in posts/taxonomies for mutations (create/update).
export { getAccessHeaders, getBasicAuthHeader };
