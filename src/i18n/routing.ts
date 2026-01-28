import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'zh',

  // Don't show the prefix for the default locale
  localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation(routing);
