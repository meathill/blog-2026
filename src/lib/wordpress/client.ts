import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getWordPressAccessHeaders, getWordPressApiUrl } from './access';

const getAccessHeaders = getWordPressAccessHeaders;

export async function wpFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const { env } = await getCloudflareContext({ async: true });
  const url = `${getWordPressApiUrl(env)}${endpoint}`;
  const headers: HeadersInit = {
    ...getAccessHeaders(env),
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    next: {
      revalidate: options?.cache === 'no-store' ? 0 : 300,
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
