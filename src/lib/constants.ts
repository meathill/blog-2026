/**
 * 获取站点 URL，优先从环境变量读取，回退到默认值。
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meathill.com';
