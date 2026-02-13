import { ChevronDownIcon, ExternalLinkIcon } from 'lucide-react';
import type { NavItem } from '@/components/layout/header/types';

interface PreviewProps {
  items: NavItem[];
}

interface NavigationPreviewProps {
  section: 'header' | 'footer';
  items: NavItem[];
}

export function normalizeFooterNavItems(items: NavItem[]): NavItem[] {
  return items.map((item) => {
    if (item.external) {
      return {
        href: item.href,
        label: item.label,
        external: true,
      };
    }

    return {
      href: item.href,
      label: item.label,
    };
  });
}

function PreviewDesktop({ items }: PreviewProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">桌面导航预览</p>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div
            key={`${item.href}-${item.label}`}
            className="min-w-36 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex items-center gap-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              <span>{item.label}</span>
              {item.external && <ExternalLinkIcon size={12} className="text-zinc-500 dark:text-zinc-400" />}
            </div>
            <p className="mt-1 text-xs text-zinc-500 break-all dark:text-zinc-400">{item.href}</p>
            {item.children && item.children.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                {item.children.map((child) => (
                  <div
                    key={`${child.href}-${child.label}`}
                    className="rounded border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      <span>{child.label}</span>
                      {child.external && <ExternalLinkIcon size={10} className="text-zinc-500 dark:text-zinc-400" />}
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-500 break-all dark:text-zinc-400">{child.href}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewMobile({ items }: PreviewProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">移动导航预览</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`${item.href}-${item.label}`}
            className="rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
              <span>{item.label}</span>
              {item.children && item.children.length > 0 && (
                <ChevronDownIcon size={14} className="text-zinc-500 dark:text-zinc-400" />
              )}
            </div>
            <div className="px-3 pb-2 text-xs text-zinc-500 break-all dark:text-zinc-400">{item.href}</div>
            {item.children && item.children.length > 0 && (
              <div className="space-y-1 border-t border-zinc-200 px-3 py-2 dark:border-zinc-700">
                {item.children.map((child) => (
                  <div
                    key={`${child.href}-${child.label}`}
                    className="rounded border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      <span>{child.label}</span>
                      {child.external && <ExternalLinkIcon size={10} className="text-zinc-500 dark:text-zinc-400" />}
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-500 break-all dark:text-zinc-400">{child.href}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewFooter({ items }: PreviewProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Footer 快速链接预览（真实布局）</p>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Quick Links</h3>
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              <span className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                {item.label}
                {item.external && <ExternalLinkIcon size={12} className="text-zinc-500 dark:text-zinc-400" />}
              </span>
              <p className="mt-0.5 text-xs text-zinc-500 break-all dark:text-zinc-400">{item.href}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function NavigationPreview({ section, items }: NavigationPreviewProps) {
  if (section === 'footer') {
    return <PreviewFooter items={items} />;
  }

  return (
    <>
      <PreviewDesktop items={items} />
      <PreviewMobile items={items} />
    </>
  );
}
