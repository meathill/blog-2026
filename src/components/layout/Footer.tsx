import Link from 'next/link';
import { GithubIcon, YoutubeIcon, TwitterIcon, HeartIcon } from 'lucide-react';

const socialLinks = [
  { href: 'https://github.com/meathill', label: 'GitHub', icon: GithubIcon },
  { href: 'https://youtube.com/@meathill', label: 'YouTube', icon: YoutubeIcon },
  { href: 'https://x.com/meathill1', label: 'X', icon: TwitterIcon },
];

const footerLinks = [
  { href: '/posts', label: '文章归档' },
  { href: '/about', label: '关于我' },
  { href: 'https://github.com/sponsors/meathill', label: '赞助', external: true },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--surface-border)] mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="text-xl font-bold text-gradient inline-block">
              山维空间
            </Link>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              19年+ 全栈开发经验，热衷于构建有用的产品和分享知识。
            </p>
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

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">快速链接</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
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

          {/* Newsletter or Extra */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">技术栈</h3>
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

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-[var(--surface-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            © {currentYear} Meathill. Made with
            <HeartIcon size={12} className="text-red-500" fill="currentColor" />
            in Chongqing
          </p>
          <p className="text-xs text-[var(--text-muted)]">Powered by Next.js + OpenNext + Cloudflare</p>
        </div>
      </div>
    </footer>
  );
}
