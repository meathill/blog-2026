const RELEASE_BASE_URL = 'https://i.meathill.com/downloads/cloudflare-billing-helper';

export const BILLING_HELPER_PATH = '/cloudflare-billing-helper';
export const BMC_URL = 'https://buymeacoffee.com/meathill';
export const MACOS_VERSION = '1.0.0';
export const MACOS_BUILD = '5';
export const MACOS_DOWNLOAD_URL = `${RELEASE_BASE_URL}/macos/${MACOS_VERSION}-${MACOS_BUILD}/billing-helper-for-cloudflare-${MACOS_VERSION}-${MACOS_BUILD}-universal.dmg`;
export const CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/cloudflare-billing-helper/lhaplnigoplpfnlbpiohjofgmieihdgd';
export const MACOS_CHECKSUM_URL = `${MACOS_DOWNLOAD_URL}.sha256`;

export function getBillingHelperReleaseContent(locale: string) {
  return locale === 'en'
    ? {
        name: 'Cloudflare Billing Helper',
        entryDescription: 'Mac menu bar billing, plus a Chrome / Edge extension for usage and free-tier forecasts.',
        macTitle: 'Download for Mac',
        macDescription:
          'Track fixed subscriptions, usage charges, cost trends and optional budget alerts in your menu bar.',
        requirements: 'macOS 13 or later · Apple Silicon & Intel · Free',
        macInstall:
          'Open the disk image and drag the app into Applications. Try the built-in Sample account, or connect a real account with a read-only Cloudflare API token stored in Keychain.',
        privacy:
          'The Mac app connects directly to Cloudflare. Tokens stay in Keychain and billing data is cached on your Mac. Neither client sends telemetry.',
        extensionStore: 'Add from Chrome Web Store',
        extensionGithub: 'Build on GitHub',
        support: 'Support on Buy Me a Coffee',
        supportDescription:
          'Support is optional and does not unlock features. The App Store edition uses Apple’s in-app purchase instead.',
      }
    : {
        name: 'Cloudflare 账单助手',
        entryDescription: 'Mac 菜单栏账单应用，以及查看用量、免费额度与费用预测的 Chrome / Edge 扩展。',
        macTitle: '下载 Mac 版',
        macDescription: '在菜单栏查看固定订阅、按量费用、费用趋势，并设置可选的预算提醒。',
        requirements: 'macOS 13 或更新版本 · Apple Silicon 与 Intel · 免费',
        macInstall:
          '打开安装镜像，将应用拖入 Applications。可先用内置示例账户体验，再使用只读 Cloudflare API Token 连接真实账户；Token 保存在系统钥匙串中。',
        privacy: 'Mac 应用直接连接 Cloudflare；Token 保存在系统钥匙串中，账单数据缓存在本机。两个客户端均不发送遥测。',
        extensionStore: '从 Chrome 网上应用店安装',
        extensionGithub: '在 GitHub 自行构建',
        support: '通过 Buy Me a Coffee 支持开发',
        supportDescription: '支持完全自愿，不会解锁功能。App Store 版使用 Apple 内购支持，不跳转外部支付。',
      };
}
