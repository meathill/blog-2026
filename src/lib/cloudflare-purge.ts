// 发布文章后清理 Cloudflare 边缘缓存。
// 背景:blog.meathill.com 的 wp-json 边缘缓存 TTL 为 24h(TiDB 降载,见 DEV_NOTE
// 「TiDB 降载」节),发文时效不靠 TTL 而靠本模块的 purge。
// free plan 没有按前缀/标签 purge,只能 purge_everything;静态资源(uploads、
// cdn-cgi 图片)会被一并清掉再按需回填,以本站发文频率完全可接受。

interface PurgeEnv {
  CF_ZONE_ID?: string;
  CLOUDFLARE_PURGE_TOKEN?: string;
}

export interface PurgeResult {
  success: boolean;
  warning?: string;
}

export async function purgeCloudflareCache(env: PurgeEnv): Promise<PurgeResult> {
  const zoneId = env.CF_ZONE_ID;
  const token = env.CLOUDFLARE_PURGE_TOKEN;
  if (!zoneId || !token) {
    return { success: false, warning: '未配置 CF_ZONE_ID / CLOUDFLARE_PURGE_TOKEN,跳过边缘缓存清理' };
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    });
    const result = (await response.json()) as { success: boolean; errors?: { message: string }[] };
    if (!result.success) {
      return {
        success: false,
        warning: `边缘缓存清理失败:${result.errors?.map((item) => item.message).join('; ') ?? response.status}`,
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      warning: `边缘缓存清理异常:${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
