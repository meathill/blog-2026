import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BillingHelperLandingPage from '@/app/[locale]/(public)/cloudflare-billing-helper/page';
import BillingHelperEntry from '@/components/billing-helper-entry';
import {
  BMC_URL,
  EXTENSION_CHECKSUM_URL,
  EXTENSION_DOWNLOAD_URL,
  MACOS_CHECKSUM_URL,
  MACOS_DOWNLOAD_URL,
} from '@/lib/billing-helper-release';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('账单助手安装入口', () => {
  it.each(['zh', 'en'])('%s 产品页可直接下载两个客户端并通过 BMC 支持', async (locale) => {
    const { container } = render(await BillingHelperLandingPage({ params: Promise.resolve({ locale }) }));
    expect(container.querySelector(`a[href="${MACOS_DOWNLOAD_URL}"]`)).not.toBeNull();
    expect(container.querySelector(`a[href="${EXTENSION_DOWNLOAD_URL}"]`)).not.toBeNull();
    expect(container.querySelector(`a[href="${BMC_URL}"]`)).not.toBeNull();
    expect(container.querySelector(`a[href="${MACOS_CHECKSUM_URL}"]`)).not.toBeNull();
    expect(container.querySelector(`a[href="${EXTENSION_CHECKSUM_URL}"]`)).not.toBeNull();
    const mac = container.querySelector('#macos');
    expect(mac).not.toBeNull();
    expect(mac?.textContent).toContain('macOS 13');
    expect(mac?.textContent).toContain('Apple Silicon');
    expect(container.querySelector('#install')?.textContent).toContain('chrome://extensions');
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
