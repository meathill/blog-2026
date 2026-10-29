/**
 * Cloudflare 账单用量助手落地页文案（zh/en）。
 * 页面：/[locale]/cloudflare-billing-helper
 */

export const GITHUB_URL = 'https://github.com/meathill/cloudflare-billing-helper';

export interface BillingHelperContent {
  home: string;
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  screenshotAlt: string;
  screenshotCaption: string;
  problemTitle: string;
  problems: { title: string; desc: string }[];
  featuresTitle: string;
  featuresSubtitle: string;
  features: { title: string; desc: string }[];
  breakdownTitle: string;
  breakdownDesc: string;
  breakdownItems: string[];
  installTitle: string;
  installSteps: { title: string; desc: string }[];
  installCode: string;
  privacyTitle: string;
  privacyDesc: string;
  privacyBullets: string[];
  faqTitle: string;
  faqs: { question: string; answer: string }[];
  footerTitle: string;
  footerDesc: string;
  footerCta: string;
}

const zh: BillingHelperContent = {
  home: '首页',
  badge: 'Chrome 扩展 · 本地运行 · 无需 API Token',
  title: 'Cloudflare',
  titleHighlight: '账单用量助手',
  subtitle:
    '在「可计费使用量」页面直接看到：每个产品的免费额度余量、预计耗尽日期、本周期预估费用，以及钱到底花在哪个 Worker / namespace 上。',
  ctaPrimary: '查看源码并安装',
  ctaSecondary: '安装步骤',
  screenshotAlt: 'Cloudflare Billing Helper 面板截图',
  screenshotCaption: '面板自动插入在「支出摘要」下方，随页面账期切换自动刷新。',
  problemTitle: '官方账单页不回答的三个问题',
  problems: [
    {
      title: '只有用量，没有额度',
      desc: '页面告诉你用了 127.98M CPU ms，却不说免费额度只剩多少、要不要开始优化。',
    },
    {
      title: '看不到趋势与耗尽时间',
      desc: '没有逐产品的日均与耗尽预测，往往在额度用完、开始扣费之后才发现。',
    },
    {
      title: '总账拆不到应用',
      desc: 'KV 用了 1.74 GB-months，却不知道是哪个 namespace 在消耗，只能一个一个点开排查。',
    },
  ],
  featuresTitle: '装上就有的六个能力',
  featuresSubtitle: '全部在浏览器本地计算，不给账单页引入任何第三方请求。',
  features: [
    {
      title: '免费额度进度',
      desc: '覆盖 29 个计费行，额度内、预警（≥70%）、超量三色状态一眼可见。',
    },
    {
      title: '耗尽预警与日期',
      desc: '请求类按日均线性外推、存储类按每日水位趋势回归，直接给出预计耗尽日期。',
    },
    {
      title: '逐产品预估费用',
      desc: '按本周期节奏外推用量与费用；尚未产生费用的产品用官方目录价估算并标注 ≈。',
    },
    {
      title: '按应用拆分',
      desc: '展开产品行，把总量拆到具体的 Worker、KV namespace、D1 数据库、R2 bucket 与 Durable Object。',
    },
    {
      title: '消耗趋势图',
      desc: '扩展每天自存一份用量快照，累积两天后生成额度消耗曲线。',
    },
    {
      title: '完全本地',
      desc: '无遥测、无第三方脚本；仅复用你的登录态访问 dash.cloudflare.com 自身接口。',
    },
  ],
  breakdownTitle: '五类资源，一眼定位消耗大户',
  breakdownDesc: '点击产品行展开按应用明细，按消耗降序排列并给出占比条。查询结果缓存 10 分钟，不打扰你的账单页。',
  breakdownItems: [
    'Workers：每个 Worker 的 CPU 时间与请求数',
    'KV：每个 namespace 的 GB-months、key 数与读写删列操作',
    'D1：每个数据库的文件大小与行读写量',
    'R2：每个 bucket 的存储量与 Class A/B 操作',
    'Durable Objects：请求量与存储占用',
  ],
  installTitle: '安装（Chrome / Edge）',
  installSteps: [
    {
      title: '构建扩展',
      desc: '克隆仓库并执行构建，产物位于 .output/chrome-mv3（需要 Node.js 与 pnpm）。',
    },
    {
      title: '加载已解压的扩展',
      desc: '打开 chrome://extensions，开启「开发者模式」，选择「加载已解压的扩展程序」并指向构建产物目录。',
    },
    {
      title: '打开账单页',
      desc: '进入 Dashboard → 账单 → 可计费使用量（/{accountId}/billing/billable-usage），面板会出现在「支出摘要」下方。',
    },
  ],
  installCode:
    'git clone https://github.com/meathill/cloudflare-billing-helper.git\ncd cloudflare-billing-helper\npnpm install\npnpm build',
  privacyTitle: '隐私与数据',
  privacyDesc:
    '扩展不发送任何遥测，不加载第三方脚本，不请求除 dash.cloudflare.com 之外的任何服务。账单数据只用于本地计算，缓存与每日快照保存在 chrome.storage 中，最多保留 3 个账期。',
  privacyBullets: ['无遥测、无第三方脚本', '仅访问 dash.cloudflare.com', '数据只存在浏览器本地'],
  faqTitle: '常见问题',
  faqs: [
    {
      question: '需要创建 API Token 吗？',
      answer: '不需要。扩展复用你当前的浏览器登录态，同源调用 Dashboard 内部接口读取账单与用量数据，安装即用。',
    },
    {
      question: '数据会被上传吗？',
      answer: '不会。所有计算都在你的浏览器里完成，扩展没有任何后端服务，也不会上报使用统计。',
    },
    {
      question: '为什么有些按应用拆分显示「暂无法获取」？',
      answer:
        '按应用拆分依赖 Dashboard 内部 GraphQL 数据集，Cloudflare 偶尔会调整字段。面板页脚的「接口自检」会逐项显示不可用原因，把结果反馈到 GitHub Issue 即可校准。',
    },
    {
      question: '支持哪些账户？',
      answer: '目前针对 Cloudflare Workers Paid 自助账户的「可计费使用量」页面，其他页面不会注入。',
    },
  ],
  footerTitle: '开源在 GitHub',
  footerDesc: '欢迎提 Issue 反馈字段变化与适配问题，或直接给个 Star。',
  footerCta: '前往 GitHub',
};

const en: BillingHelperContent = {
  home: 'Home',
  badge: 'Chrome extension · Runs locally · No API token',
  title: 'Cloudflare',
  titleHighlight: 'Billing Usage Helper',
  subtitle:
    'See free-tier headroom, projected exhaustion dates, per-product cost forecasts, and which Worker or namespace is actually driving your bill — right on the Billable Usage page.',
  ctaPrimary: 'View source & install',
  ctaSecondary: 'Install steps',
  screenshotAlt: 'Cloudflare Billing Helper panel screenshot',
  screenshotCaption: 'The panel is inserted below the spend summary and follows the billing-period switcher.',
  problemTitle: 'Three questions the official billing page does not answer',
  problems: [
    {
      title: 'Usage without headroom',
      desc: 'The page shows 127.98M CPU ms, but not how much free quota is left or whether you should optimize.',
    },
    {
      title: 'No trend, no exhaustion date',
      desc: 'Without a daily average or projection, you usually notice only after overage charges start.',
    },
    {
      title: 'A bill you cannot attribute',
      desc: 'KV shows 1.74 GB-months, but which namespace is consuming it? You end up clicking through every one.',
    },
  ],
  featuresTitle: 'Six things you get out of the box',
  featuresSubtitle:
    'Everything is computed locally in your browser — no third-party requests are added to the billing page.',
  features: [
    {
      title: 'Free-quota progress',
      desc: 'All 29 billing lines, with green / amber / red states at a glance.',
    },
    {
      title: 'Exhaustion forecast',
      desc: 'Linear projection for request-based products, regression on daily storage for GB-month products — with an ETA.',
    },
    {
      title: 'Per-product cost forecast',
      desc: 'Projects usage and overage cost for the cycle; catalog pricing (marked ≈) fills in for products that have not billed yet.',
    },
    {
      title: 'Per-app breakdown',
      desc: 'Expand any row to see per-Worker, per-namespace, per-database, per-bucket and per-DO consumption.',
    },
    {
      title: 'Trend chart',
      desc: 'The extension snapshots usage daily and draws a quota-consumption curve after two days.',
    },
    {
      title: 'Fully local',
      desc: 'No telemetry, no third-party scripts; it only talks to dash.cloudflare.com using your session.',
    },
  ],
  breakdownTitle: 'Five resource families, top consumers surfaced',
  breakdownDesc:
    'Expand a product row to list per-app usage, sorted by consumption with share bars. Results are cached for 10 minutes.',
  breakdownItems: [
    'Workers: CPU time and requests per Worker script',
    'KV: GB-months, key count and read/write/delete/list per namespace',
    'D1: file size and row reads/writes per database',
    'R2: storage and Class A/B operations per bucket',
    'Durable Objects: requests and storage per object',
  ],
  installTitle: 'Install (Chrome / Edge)',
  installSteps: [
    {
      title: 'Build the extension',
      desc: 'Clone the repo and build; the output lands in .output/chrome-mv3 (Node.js and pnpm required).',
    },
    {
      title: 'Load unpacked',
      desc: 'Open chrome://extensions, enable Developer mode, click "Load unpacked" and select the build folder.',
    },
    {
      title: 'Open the billing page',
      desc: 'Go to Dashboard → Billing → Billable Usage (/{accountId}/billing/billable-usage). The panel appears below the spend summary.',
    },
  ],
  installCode:
    'git clone https://github.com/meathill/cloudflare-billing-helper.git\ncd cloudflare-billing-helper\npnpm install\npnpm build',
  privacyTitle: 'Privacy',
  privacyDesc:
    'No telemetry, no third-party scripts, no requests beyond dash.cloudflare.com. Billing data is computed locally; caches and daily snapshots live in chrome.storage and keep at most three billing periods.',
  privacyBullets: [
    'No telemetry or third-party scripts',
    'Only talks to dash.cloudflare.com',
    'All data stays in your browser',
  ],
  faqTitle: 'FAQ',
  faqs: [
    {
      question: 'Do I need an API token?',
      answer: 'No. The extension reuses your browser session and calls the dashboard’s own endpoints same-origin.',
    },
    {
      question: 'Is my data uploaded anywhere?',
      answer: 'No. Everything is computed in your browser. There is no backend and no usage reporting.',
    },
    {
      question: 'Why does some breakdown show "not available"?',
      answer:
        'Breakdowns rely on the dashboard’s internal GraphQL datasets, whose fields occasionally change. The "self-check" link in the panel footer reports exactly which dataset failed — please file an issue with that output.',
    },
    {
      question: 'Which accounts are supported?',
      answer:
        'Cloudflare Workers Paid self-serve accounts, specifically the Billable Usage page. The panel is not injected on other pages.',
    },
  ],
  footerTitle: 'Open source on GitHub',
  footerDesc: 'Issues and dataset updates are welcome — a star helps too.',
  footerCta: 'Go to GitHub',
};

export function getBillingHelperContent(locale: string): BillingHelperContent {
  return locale === 'en' ? en : zh;
}
