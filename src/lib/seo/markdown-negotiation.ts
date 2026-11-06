import { GITHUB_URL, getBillingHelperContent } from '@/lib/billing-helper';
import { CHROME_WEB_STORE_URL } from '@/lib/billing-helper-release';
import { htmlToMarkdown } from '@/lib/blog-html-to-markdown';
import { SITE_URL } from '@/lib/constants';
import { getLocalizedDescription, getSkillBySlug, getSkillSourceUrl } from '@/lib/skills';
import { getSolutionBySlug, localize } from '@/lib/solutions';
import { getPost, stripHtml } from '@/lib/wordpress';

/**
 * 判断 Accept 请求头是否声明期望 text/markdown 协商
 */
export function isMarkdownAccepted(acceptHeader: string | null | undefined): boolean {
  if (!acceptHeader) return false;
  return acceptHeader.toLowerCase().includes('text/markdown');
}

/**
 * 判断路径是否属于支持 Markdown 协商的内容页（文章、工具说明、方案、技能）
 */
export function isNegotiableContentPath(pathname: string): boolean {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';

  // 0. 首页（根路径及语言前缀）
  if (cleanPath === '/' || cleanPath === '/en' || cleanPath === '/zh') {
    return true;
  }

  // 1. 文章详情页（排除分页 /posts/page/X 与作者 /posts/author/X）
  if (/^\/(?:(?:zh|en)\/)?posts\/(?!page(?:\/|$)|author(?:\/|$)).+$/.test(cleanPath)) {
    return true;
  }

  // 2. 工具说明页
  if (/^\/(?:(?:zh|en)\/)?cloudflare-billing-helper$/.test(cleanPath)) {
    return true;
  }

  // 3. 解决方案详情页
  if (/^\/(?:(?:zh|en)\/)?solutions\/[a-zA-Z0-9_-]+$/.test(cleanPath)) {
    return true;
  }

  // 4. 技能详情页
  if (/^\/(?:(?:zh|en)\/)?skills\/[a-zA-Z0-9_-]+$/.test(cleanPath)) {
    return true;
  }

  return false;
}

/**
 * 根据内容路径生成 Markdown 文本。若不存在对应内容则返回 null。
 */
export async function resolvePathMarkdown(pathname: string): Promise<string | null> {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const isEn = cleanPath.startsWith('/en/') || cleanPath === '/en';
  const locale = isEn ? 'en' : 'zh';
  const pathWithoutLocale = cleanPath.replace(/^\/(?:zh|en)/, '');

  // 0. 首页：/ 或 /en 或 /zh
  if (pathWithoutLocale === '' || pathWithoutLocale === '/') {
    const isEnglish = locale === 'en';
    const siteTitle = isEnglish ? 'Meathill Studio' : 'Meathill Studio (肉山一人工作室)';
    const intro = isEnglish
      ? 'Meathill LLC — One-person studio with 20+ years of full-stack engineering, specializing in Cloudflare Workers, Next.js, AI workflows, and cross-platform solutions.'
      : 'Meathill LLC —— 20+ 年全栈开发经验的一人公司，专注 Cloudflare 全栈架构、Next.js 现代化 Web 应用、AI 自动化工作流与跨端产品交付。';

    const lines: string[] = [
      `# ${siteTitle}`,
      '',
      `> ${intro}`,
      `> URL: ${SITE_URL}${isEnglish ? '/en' : ''}`,
      '',
      isEnglish ? '## Featured Products & Tools' : '## 核心产品与工具',
      '',
      isEnglish
        ? '- **Cloudflare Billing Helper** (https://meathill.com/cloudflare-billing-helper): Track costs, trends and budget alerts from Mac menu bar and browser extension.'
        : '- **Cloudflare 账单用量助手** (https://meathill.com/cloudflare-billing-helper): Mac 菜单栏用量监控应用与 Chrome/Edge 浏览器扩展。',
      isEnglish
        ? '- **MuiCV** (https://meathill.com/en/app/muicv): AI-powered resume and CV builder.'
        : '- **MuiCV** (https://meathill.com/app/muicv): 智能简历与求职工具。',
      '',
      isEnglish ? '## Navigation & Content' : '## 站点导航与主要内容',
      '',
      `- ${isEnglish ? 'Blog Archives' : '文章归档'}: ${SITE_URL}/posts`,
      `- ${isEnglish ? 'Tech Guides' : '技术专栏'}: ${SITE_URL}/tech`,
      `- ${isEnglish ? 'Solutions' : '解决方案'}: ${SITE_URL}/solutions`,
      `- ${isEnglish ? 'About' : '关于'}: ${SITE_URL}${isEnglish ? '/en' : ''}/about`,
      '',
    ];
    return lines.join('\n');
  }

  // 1. 文章页：/posts/[...slug]
  if (pathWithoutLocale.startsWith('/posts/')) {
    const segments = pathWithoutLocale
      .replace(/^\/posts\//, '')
      .split('/')
      .filter(Boolean);
    if (segments.length === 0 || segments[0] === 'page' || segments[0] === 'author') {
      return null;
    }
    const lastSegment = segments[segments.length - 1];
    const cleanSlug = lastSegment.endsWith('.html') ? lastSegment.replace(/\.html$/, '') : lastSegment;

    const post = await getPost(cleanSlug).catch(() => null);
    if (!post) {
      return null;
    }

    const title = stripHtml(post.title?.rendered || '');
    const date = post.date ? new Date(post.date).toISOString().split('T')[0] : '';
    const bodyMarkdown = htmlToMarkdown(post.content?.rendered || '');

    const lines: string[] = [
      `# ${title}`,
      '',
      date ? `> 发布日期: ${date}` : '',
      `> 规范地址: ${SITE_URL}/posts/${cleanSlug}`,
      '',
      bodyMarkdown.trim(),
      '',
    ].filter(Boolean);

    return lines.join('\n');
  }

  // 2. 工具说明页：/cloudflare-billing-helper
  if (pathWithoutLocale === '/cloudflare-billing-helper') {
    const content = getBillingHelperContent(locale);
    const lines: string[] = [
      `# ${content.title} ${content.titleHighlight}`,
      '',
      content.subtitle,
      '',
      '## 核心能力',
      '',
      ...content.features.map((f) => `- **${f.title}**: ${f.desc}`),
      '',
      '## 安装',
      '',
      `- Chrome Web Store: ${CHROME_WEB_STORE_URL}`,
      `- GitHub: ${GITHUB_URL}`,
      '',
      '## 常见问题 (FAQ)',
      '',
      ...content.faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}\n`),
    ];
    return lines.join('\n');
  }

  // 3. 解决方案页：/solutions/[slug]
  if (pathWithoutLocale.startsWith('/solutions/')) {
    const slug = pathWithoutLocale.replace(/^\/solutions\//, '').trim();
    const solution = getSolutionBySlug(slug);
    if (!solution) return null;

    const title = localize(solution.title, locale);
    const tagline = localize(solution.tagline, locale);
    const problem = localize(solution.problem, locale);

    const lines: string[] = [
      `# ${title}`,
      '',
      tagline ? `> ${tagline}\n` : '',
      `## 解决的痛点\n\n${problem}\n`,
      '## 预期成果',
      '',
      ...solution.outcomes.map((o) => `- ${localize(o, locale)}`),
      '',
    ].filter(Boolean);

    return lines.join('\n');
  }

  // 4. 技能页：/skills/[slug]
  if (pathWithoutLocale.startsWith('/skills/')) {
    const slug = pathWithoutLocale.replace(/^\/skills\//, '').trim();
    const skill = getSkillBySlug(slug);
    if (!skill) return null;

    const desc = getLocalizedDescription(skill, locale);
    const sourceUrl = getSkillSourceUrl(skill);

    const lines: string[] = [
      `# ${skill.name}`,
      '',
      `> 来源: ${sourceUrl}`,
      '',
      desc,
      '',
      skill.tags?.length ? `标签: ${skill.tags.join(', ')}` : '',
    ].filter(Boolean);

    return lines.join('\n');
  }

  return null;
}
