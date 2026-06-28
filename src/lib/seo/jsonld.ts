import { SITE_URL } from '@/lib/constants';

const SITE_NAME = 'Meathill LLC';
const AUTHOR_NAME = 'meathill';

export interface FaqPair {
  question: string;
  answer: string;
}

interface ArticleJsonLdInput {
  title: string;
  description: string;
  /** 文章规范 URL（绝对地址，需与页面 canonical 一致） */
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  locale: string;
  keywords?: string[];
}

/**
 * 构造文章页 BlogPosting 结构化数据。
 */
export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  const { title, description, url, datePublished, dateModified, image, locale, keywords } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    inLanguage: locale === 'en' ? 'en-US' : 'zh-CN',
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished,
    dateModified: dateModified || datePublished,
    author: { '@type': 'Person', name: AUTHOR_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    ...(image ? { image: [image] } : {}),
    ...(keywords && keywords.length ? { keywords } : {}),
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * 构造面包屑 BreadcrumbList 结构化数据。
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * 构造 FAQ 富结果 FAQPage 结构化数据；无 Q&A 时返回 null（不应注入空 schema）。
 */
export function buildFaqJsonLd(pairs: FaqPair[]) {
  if (!pairs.length) {
    return null;
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map((pair) => ({
      '@type': 'Question',
      name: pair.question,
      acceptedAnswer: { '@type': 'Answer', text: pair.answer },
    })),
  };
}
