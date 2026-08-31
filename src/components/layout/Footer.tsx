import { BrandFooter } from 'meathill-brand-react';
import { GithubIcon, TwitterIcon, YoutubeIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { NavItem } from '@/components/layout/header/types';

const socialLinks = [
  { href: 'https://github.com/meathill', label: 'GitHub', icon: GithubIcon },
  { href: 'https://youtube.com/@meathill', label: 'YouTube', icon: YoutubeIcon },
  { href: 'https://x.com/meathill1', label: 'X', icon: TwitterIcon },
];

interface FooterProps {
  navItems: NavItem[];
}

export default async function Footer({ navItems }: FooterProps) {
  const t = await getTranslations('Footer');
  const visibleNavItems = navItems.slice(0, 4);

  return (
    <BrandFooter className="mt-20" currentSiteId="meathill" description={t('brand_desc')}>
      <div className="flex flex-wrap items-center gap-3">
        {socialLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label={link.label}
          >
            <link.icon size={18} />
          </a>
        ))}
        {visibleNavItems.map((link) => (
          <a className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)]" href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
        <LanguageSwitcher />
        <span>v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
          粤ICP备15055091号-1
        </a>
      </div>
    </BrandFooter>
  );
}
