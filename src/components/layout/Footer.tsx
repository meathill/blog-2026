import { Link } from '@/i18n/routing';
import type { NavItem } from '@/components/layout/header/types';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { GithubIcon, HeartIcon, TwitterIcon, YoutubeIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

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
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--surface-border)] mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Link href="/" className="text-xl font-bold text-gradient inline-block">
              Meathill LLC
            </Link>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{t('brand_desc')}</p>
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
                  aria-label={link.label}
                >
                  <link.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('quick_links')}</h3>
            <ul className="space-y-2">
              {navItems.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  {link.external || /^https?:\/\//.test(link.href) ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('tech_stack')}</h3>
            <div className="flex flex-wrap gap-2">
              {['Vue', 'React', 'Node.js', 'TypeScript', 'Next.js', 'Cloudflare'].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 text-xs rounded-md bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--surface-border)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--surface-border)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            © {currentYear} Meathill. {t('made_with')}
            <HeartIcon size={12} className="text-red-500" fill="currentColor" />
            {t('in_chongqing')}
          </p>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <p className="text-xs text-[var(--text-muted)]">
              <span className="text-gray-500 me-2">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
              <Link href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
                粤ICP备15055091号-1
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
