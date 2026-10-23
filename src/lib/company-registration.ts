interface ServiceItem {
  title: string;
  description: string;
}

interface CompanyRegistrationContent {
  provider: string;
  pricingTitle: string;
  price: string;
  billing: string;
  planDescription: string;
  startLabel: string;
  timelineLinkLabel: string;
  includesTitle: string;
  includes: string[];
  extras: (ServiceItem & { price: string; billing: string })[];
  pricingNote: string;
  timelineTitle: string;
  timelineSummary: string;
  timeline: (ServiceItem & { duration: string })[];
  timelineNote: string;
  requirementsTitle: string;
  requirements: string[];
  requirementsNote: string;
  faqTitle: string;
  questions: { question: string; answer: string }[];
  sourceNote: string;
  sourceLinks: { label: string; href: string }[];
}

export const COMPANY_REGISTRATION_URL = 'https://incorporate.mizufinancial.com/';

const ZH_CONTENT: CompanyRegistrationContent = {
  provider: 'Mizu Financial · 为独立开发者与出海小团队提供服务',
  pricingTitle: '多少钱，包含什么？',
  price: '$499',
  billing: '美元，一次性支付',
  planDescription: '通过 Mizu 办理 Wyoming LLC 注册，接着完成税号申请、银行开户申请和 Stripe 收款配置。',
  startLabel: '前往 Mizu 开始注册',
  timelineLinkLabel: '交付参考：加急路径约两周，查看各环节时间',
  includesTitle: '注册套餐包含',
  includes: [
    'Wyoming LLC 公司注册与文件',
    'EIN 联邦税号申请',
    'Registered Agent 注册代理',
    '美国电话号码',
    '美国商业银行开户协助',
    'Stripe 收款配置',
  ],
  extras: [
    {
      title: 'EIN 当天加急 · 可选',
      price: '+$99',
      billing: '一次性加购',
      description: '符合条件的申请优先当天提交并跟进，缩短后续开户的等待。',
    },
    {
      title: '年度合规 · 可选',
      price: '$399',
      billing: '美元 / 年',
      description: '覆盖 Wyoming 年度报告、注册代理续费、Form 5472 + pro forma 1120 申报、合规提醒和政府信件转交。',
    },
  ],
  pricingNote: '注册套餐一次性收费；加急与年度合规按需选择。年度合规可以在注册后再决定，也可以另找 CPA 处理。',
  timelineTitle: '多久可以交付？',
  timelineSummary: '材料齐备并选择 EIN 加急时，整套流程参考约两周。各环节依次推进，银行与 Stripe 审核可能延长总周期。',
  timeline: [
    {
      title: '公司注册',
      duration: '通常几个工作日',
      description: '核对公司名称与申请信息，提交 Wyoming LLC 注册，获取公司文件。',
    },
    {
      title: 'EIN 税号',
      duration: '常规约 1–2 个工作日',
      description: '公司注册后申请 EIN；加急适用于符合条件的申请，优先当天提交与跟进。',
    },
    {
      title: '商业银行开户',
      duration: '取决于银行审核',
      description: '注册文件与 EIN 齐备后提交。Mercury 常见初审为 1–2 个工作日；补件或深入审核可能需要 1–3 周或更久。',
    },
    {
      title: 'Stripe 收款配置',
      duration: '开户后衔接，按审核进度完成',
      description: '核对公司、税号、账户与业务资料，配置收款和订阅；相关文件与凭证集中交付。',
    },
  ],
  timelineNote: '以上为 Mizu 公开的参考时效，不是固定交付承诺。补充材料、业务类型和第三方审核都会影响进度。',
  requirementsTitle: '开始前，你需要准备什么？',
  requirements: [
    '有效期内的护照，用于身份核验。',
    '个人地址证明，例如水电账单或银行对账单。',
    '拟注册的公司名称，以及真实、具体的业务说明。',
    '银行与 Stripe 申请阶段：可访问的业务网站、联系方式及与申请一致的经营资料。',
  ],
  requirementsNote: '无需 SSN 或 ITIN 即可开始，后续仍需按开户机构要求完成身份与业务核验。',
  faqTitle: '申请前常见问题',
  questions: [
    {
      question: '人不在美国、没有 SSN，也能办理吗？',
      answer: '可以通过 Mizu 的远程流程开始申请。护照、地址证明和真实业务资料仍需准备，具体准入条件由办理机构审核。',
    },
    {
      question: '银行和 Stripe 一定能开通吗？',
      answer: '不能保证批准。银行和 Stripe 各自独立审核；Mizu 协助准备、提交和补充材料，复杂情况提供人工跟进。',
    },
    {
      question: '每年都必须向 Mizu 支付合规费吗？',
      answer: '$399/年的服务可以自行选择，年度申报等事项仍需安排。你可以委托其他 CPA 或自行处理，不必购买这项套餐。',
    },
    {
      question: '如果最终无法开通银行账户，如何退款？',
      answer:
        'Mizu 当前公开政策列明：最终无法开通美国银行账户时退还 $150。申请前请查看其退款说明，具体以确认的服务条款为准。',
    },
  ],
  sourceNote: '费用、服务范围与时效依据 Mizu Financial 2026-10-23 的公开信息整理，办理前请核对最新报价与条款。',
  sourceLinks: [
    { label: 'Mizu 套餐与定价', href: 'https://mizufinancial.com/zh/pricing' },
    { label: '服务与文件交付', href: 'https://mizufinancial.com/zh/product' },
    { label: '非美国创始人办理指南', href: 'https://mizufinancial.com/zh/blog/how-to-start-us-llc-non-us-founder' },
    { label: '退款说明', href: 'https://mizufinancial.com/zh/pricing#faq-refund' },
    { label: '银行审核与材料', href: 'https://mizufinancial.com/blog/mercury-bank-account-non-us-founder-2026' },
  ],
};

const EN_CONTENT: CompanyRegistrationContent = {
  provider: 'Mizu Financial · For independent founders and small global teams',
  pricingTitle: 'Pricing and what is included',
  price: '$499',
  billing: 'USD, one-time',
  planDescription: 'Form a Wyoming LLC through Mizu, then move through EIN, banking, and Stripe setup.',
  startLabel: 'Start your application with Mizu',
  timelineLinkLabel: 'Expedited setup: about two weeks. See the schedule.',
  includesTitle: 'Your formation package',
  includes: [
    'Wyoming LLC formation and documents',
    'Federal EIN application',
    'Registered Agent service',
    'US phone number',
    'US business bank application support',
    'Stripe payments setup',
  ],
  extras: [
    {
      title: 'Same-day EIN priority · Optional',
      price: '+$99',
      billing: 'one-time add-on',
      description: 'Eligible applications receive priority same-day submission and follow-up.',
    },
    {
      title: 'Annual compliance · Optional',
      price: '$399',
      billing: 'USD / year',
      description:
        'Annual Report, agent renewal, Form 5472 with pro forma 1120, deadline reminders, and government mail forwarding.',
    },
  ],
  pricingNote:
    'Formation is a one-time purchase. Choose add-ons separately; you can decide on compliance later or use another CPA.',
  timelineTitle: 'How long does it take?',
  timelineSummary:
    'With complete documents and expedited EIN processing, allow about two weeks for the full setup. Banking and Stripe review can extend the schedule.',
  timeline: [
    {
      title: 'Company formation',
      duration: 'Usually a few business days',
      description: 'Confirm the name and application details, file the Wyoming LLC, and receive formation documents.',
    },
    {
      title: 'Federal EIN',
      duration: 'Normally 1–2 business days',
      description:
        'Apply after formation. Eligible expedited cases receive priority same-day submission and follow-up.',
    },
    {
      title: 'Business banking',
      duration: 'Subject to bank review',
      description:
        'Apply once the company documents and EIN are ready. Mercury often reviews within 1–2 business days; extended review may take 1–3 weeks or longer.',
    },
    {
      title: 'Stripe setup',
      duration: 'After banking, subject to review',
      description:
        'Match the entity, tax, account, and business details, then configure payments. Documents and credentials are delivered together.',
    },
  ],
  timelineNote:
    'These are Mizu estimates, not a fixed delivery date. Additional documents, business activities, and independent provider reviews affect timing.',
  requirementsTitle: 'What to prepare',
  requirements: [
    'A valid passport for identity verification.',
    'Personal proof of address, such as a utility bill or bank statement.',
    'Your preferred company name and a specific description of the business.',
    'For banking and Stripe: a live business website, contact details, and consistent supporting business information.',
  ],
  requirementsNote:
    'You can start without an SSN or ITIN. Identity and business verification are still required by the account providers.',
  faqTitle: 'Before you apply',
  questions: [
    {
      question: 'Can I apply from outside the US without an SSN?',
      answer:
        'You can start remotely through Mizu. Prepare your passport, proof of address, and business details; eligibility remains subject to provider review.',
    },
    {
      question: 'Are bank and Stripe approval guaranteed?',
      answer:
        'No. Each provider makes its own decision. Mizu helps prepare and submit applications, address document requests, and follow up on complex cases.',
    },
    {
      question: 'Must I buy annual compliance from Mizu?',
      answer:
        'No. The $399/year service is optional. You still need to arrange applicable filings, either yourself or with another CPA.',
    },
    {
      question: 'What if a bank account cannot be opened?',
      answer:
        'Mizu currently lists a $150 refund if a US bank account ultimately cannot be opened. Check its refund terms before applying.',
    },
  ],
  sourceNote:
    'Based on Mizu Financial public information checked on October 23, 2026. Confirm current pricing and terms before applying.',
  sourceLinks: [
    { label: 'Mizu pricing', href: 'https://mizufinancial.com/pricing' },
    { label: 'Services and document delivery', href: 'https://mizufinancial.com/product' },
    { label: 'Non-US founder guide', href: 'https://mizufinancial.com/blog/how-to-start-us-llc-non-us-founder' },
    { label: 'Refund terms', href: 'https://mizufinancial.com/pricing#faq-refund' },
    {
      label: 'Bank review and documents',
      href: 'https://mizufinancial.com/blog/mercury-bank-account-non-us-founder-2026',
    },
  ],
};

export function getCompanyRegistrationContent(locale: string): CompanyRegistrationContent {
  return locale === 'en' ? EN_CONTENT : ZH_CONTENT;
}
