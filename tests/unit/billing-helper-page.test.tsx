import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BillingHelperLandingPage from '@/app/[locale]/(public)/cloudflare-billing-helper/page';
import BillingHelperEntry from '@/components/billing-helper-entry';
import { GITHUB_URL } from '@/lib/billing-helper';
import { BMC_URL, CHROME_WEB_STORE_URL, MACOS_CHECKSUM_URL, MACOS_DOWNLOAD_URL } from '@/lib/billing-helper-release';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('账单助手安装入口', () => {
  it.each(['zh', 'en'])('%s 产品页从 Chrome 网上应用店安装扩展，GitHub 仅供自行构建', async (locale) => {
    const { container } = render(await BillingHelperLandingPage({ params: Promise.resolve({ locale }) }));
    expect(container.querySelector(`a[href="${MACOS_DOWNLOAD_URL}"]`)).not.toBeNull();
    expect(container.querySelectorAll(`a[href="${CHROME_WEB_STORE_URL}"]`)).toHaveLength(2);
    const install = container.querySelector('#install');
    expect(install?.querySelector(`a[href="${CHROME_WEB_STORE_URL}"]`)).toHaveAttribute('target', '_blank');
    expect(install?.querySelector(`a[href="${GITHUB_URL}"]`)).toHaveAttribute('rel', 'noopener noreferrer');
    expect(install?.querySelector('a[href*="cloudflare-billing-helper-0.2.0-chrome.zip"]')).toBeNull();
    expect(container.querySelector(`a[href="${BMC_URL}"]`)).not.toBeNull();
    expect(container.querySelector(`a[href="${MACOS_CHECKSUM_URL}"]`)).not.toBeNull();
    const mac = container.querySelector('#macos');
    expect(mac).not.toBeNull();
    expect(mac?.textContent).toContain('macOS 13');
    expect(mac?.textContent).toContain('Apple Silicon');
    expect(install?.textContent).toContain(locale === 'en' ? 'Chrome Web Store' : 'Chrome 网上应用店');
    expect(install?.textContent).toContain(locale === 'en' ? 'GitHub' : '自行构建');
    expect(install?.textContent).not.toContain(locale === 'en' ? 'Download package' : '下载安装包');
    expect(screen.queryByText('pnpm install', { exact: false })).not.toBeInTheDocument();
  });

  it.each(['zh', 'en'])('%s 推荐入口链接到完整产品页，不跳到 GitHub', (locale) => {
    const { container } = render(<BillingHelperEntry locale={locale} />);
    const entry = within(container).getByRole('link');
    expect(entry).toHaveAttribute('href', '/cloudflare-billing-helper');
    expect(entry.textContent).toContain('Mac');
    expect(entry).toHaveAccessibleName();
  });
});
