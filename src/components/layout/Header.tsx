'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { SearchIcon, MenuIcon, XIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  external?: boolean;
  children?: NavItem[];
}

const navLinks: NavItem[] = [
  { href: '/about', label: '关于我' },
  { href: '/app', label: 'Apps' },
  { href: 'https://mizufinancial.com/', label: 'Mizu Financial', external: true },
  {
    href: '/tech',
    label: '技术分享',
    children: [
      { href: '/category/js', label: 'JavaScript' },
      { href: '/category/ai', label: 'AI' },
      {
        href: 'https://github.com/meathill/gitbook-design-patterns-in-jquery',
        label: '从 jQuery 里学习设计模式',
        external: true,
      },
      {
        href: 'https://github.com/meathill/gitbook-javascript-async-tutorial',
        label: 'JavaScript 异步开发全攻略',
        external: true,
      },
    ],
  },
  {
    href: '/works',
    label: '作品集',
    children: [
      { href: 'https://space.bilibili.com/7409098', label: 'B 站视频', external: true },
      { href: 'https://www.youtube.com/channel/UCBeD-XqErDK4tKy5FtZj8vg', label: '油管频道', external: true },
      { href: 'https://github.com/meathill', label: 'GitHub', external: true },
      { href: 'https://baifo.life', label: '拜拜-网上拜佛', external: true },
      { href: 'https://muistory.com', label: '姆伊游戏书', external: true },
      { href: 'https://battleship-game.com', label: 'Battleship', external: true },
      { href: 'https://aigazou.net', label: 'AIGAZOU', external: true },
      { href: 'https://minesweeper.meathill.com', label: '扫雷游戏', external: true },
    ],
  },
  {
    href: '/sponsors',
    label: '各种代理',
    children: [
      { href: 'https://zeabur.com?referralCode=meathill', label: 'Zeabur（Vercel 竞品）', external: true },
      { href: 'https://leancloud.cn/?source=F88KG861', label: '超好用的后端 LeanCloud', external: true },
      { href: 'https://m.do.co/c/87df6b93ec1e', label: 'Digital Ocean', external: true },
      { href: 'https://www.vultr.com/?ref=7124198', label: 'Vultr VPS', external: true },
    ],
  },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
        onClick={onClick}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link
      href={item.href}
      className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
      onClick={onClick}
    >
      {item.label}
    </Link>
  );
}

function DropdownMenu({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleMouseEnter() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        {item.label}
        <ChevronDownIcon size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>
      <div
        className={cn(
          'absolute top-full left-0 mt-2 min-w-48 rounded-lg glass border border-[var(--surface-border)] shadow-lg overflow-hidden transition-all duration-200',
          isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2',
        )}
      >
        {item.children?.map((child) => (
          <NavLink key={child.href + child.label} item={child} onClick={() => setIsOpen(false)} />
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileItems, setExpandedMobileItems] = useState<string[]>([]);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function toggleMobileExpand(label: string) {
    setExpandedMobileItems((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'glass backdrop-blur-md py-3' : 'bg-transparent py-5',
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-gradient hover:opacity-80 transition-opacity">
            山维空间
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.children ? (
                <DropdownMenu key={link.label} item={link} />
              ) : link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <Link
              href="/search"
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
              aria-label="搜索"
            >
              <SearchIcon size={18} />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="菜单"
            >
              {isMobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            isMobileMenuOpen ? 'max-h-[80vh] mt-4 overflow-y-auto' : 'max-h-0',
          )}
        >
          <nav className="flex flex-col gap-1 py-4 border-t border-[var(--surface-border)]">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <button
                    className="flex items-center justify-between w-full px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all rounded-lg"
                    onClick={() => toggleMobileExpand(link.label)}
                  >
                    {link.label}
                    <ChevronDownIcon
                      size={16}
                      className={cn('transition-transform', expandedMobileItems.includes(link.label) && 'rotate-180')}
                    />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      expandedMobileItems.includes(link.label) ? 'max-h-96' : 'max-h-0',
                    )}
                  >
                    <div className="pl-4 py-1">
                      {link.children.map((child) => (
                        <NavLink
                          key={child.href + child.label}
                          item={child}
                          onClick={() => setIsMobileMenuOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
