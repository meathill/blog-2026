import { routing } from '@/i18n/routing';

export const TOP_LEVEL_ROUTES = [
  'about',
  'app',
  'skills',
  'solutions',
  'posts',
  'category',
  'tag',
  'login',
  'search',
  'api',
  '_next',
  'admin',
  'tech',
];

/**
 * 从 pathname 中解析 locale 和内容路径。
 * 如果 pathname 以 `/en/` 或 `/zh/` 开头则提取对应 locale，否则使用默认 locale。
 */
export function getLocaleAndContent(pathname: string) {
  const match = pathname.match(/^\/(en|zh)\/(.*)$/);
  if (match) {
    return {
      locale: match[1] as (typeof routing.locales)[number],
      content: match[2],
    };
  }
  return {
    locale: routing.defaultLocale,
    content: pathname.startsWith('/') ? pathname.slice(1) : pathname,
  };
}
