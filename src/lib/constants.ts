/**
 * 获取站点 URL，优先从环境变量读取，回退到默认值。
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meathill.com';

// 站点默认 OG 图。列表/归档等无专属配图的页面必须显式带上它——
// Next.js 的 openGraph 不会与父级深合并，子页一旦声明 openGraph 就会整体覆盖根配置
export const DEFAULT_OG_IMAGE = {
  url: '/api/og/home',
  width: 1200,
  height: 630,
  alt: 'Meathill Studio',
};
