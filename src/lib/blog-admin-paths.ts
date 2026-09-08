import { routing } from '@/i18n/routing';

// 后台博客列表页与编辑器表单共用的路径 helper（曾在两处各写一份，现收口到此）。
// 默认语言（zh）无前缀，其余 locale 加 `/{locale}` 前缀。

export function getLocalePrefix(locale: string): string {
  if (locale === routing.defaultLocale) {
    return '';
  }

  return `/${locale}`;
}

export function buildBlogEditHref(locale: string, id: string): string {
  return `${getLocalePrefix(locale)}/admin/blog/${id}`;
}

export function buildPublicPreviewHref(locale: string, slug: string): string {
  return `${getLocalePrefix(locale)}/posts/${slug}`;
}
