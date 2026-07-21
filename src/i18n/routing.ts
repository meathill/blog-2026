import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'zh',

  // Don't show the prefix for the default locale
  localePrefix: 'as-needed',

  // URL 即权威：不依赖 cookie / Accept-Language 自动改语言
  // 否则在 as-needed 模式下，无前缀路径会被 cookie 反向覆盖（参见 footer 切语言 bug）
  localeDetection: false,

  // 不写 NEXT_LOCALE cookie：localeDetection 已关，cookie 无用途，
  // 且 set-cookie 会让响应变 no-store —— 边缘缓存失效 + bfcache 被禁（issue #5）
  localeCookie: false,
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
