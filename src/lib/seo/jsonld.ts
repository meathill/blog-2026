import { brandCatalog } from 'meathill-brand';
import { SITE_URL } from '@/lib/constants';

const SITE_NAME = brandCatalog.organization.name;
const AUTHOR_NAME = 'meathill';
const ORGANIZATION_ID = brandCatalog.organization.id;
// 与 Footer.tsx 的社交链接保持一致
const SOCIAL_PROFILES = ['https://github.com/meathill', 'https://youtube.com/@meathill', 'https://x.com/meathill1'];

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
    publisher: { '@id': ORGANIZATION_ID },
    ...(image ? { image: [image] } : {}),
    ...(keywords && keywords.length ? { keywords } : {}),
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * 构造站点 Organization 结构化数据（只应注入首页，供 WebSite 通过 @id 引用）。
 */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: brandCatalog.organization.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.webp`,
    sameAs: SOCIAL_PROFILES,
  };
}

/**
 * 构造站点 WebSite 结构化数据（只应注入首页），含站内搜索 SearchAction。
 */
export function buildWebSiteJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: locale === 'en' ? 'en-US' : 'zh-CN',
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * 构造面包屑 BreadcrumbList 结构化数据。
 * 过滤 name 为空/空白 的条目（如无标题旧文曾输出 ""，触发 GSC 报错），并重排 position。
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  const validItems = items.filter((item) => item.name.trim());
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: validItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface ItemListEntry {
  name: string;
  url: string;
}

interface ItemListJsonLdInput {
  name: string;
  description: string;
  items: ItemListEntry[];
}

/**
 * 构造列表页 ItemList 结构化数据（如 solutions/skills 列表）。
 * 过滤 name 为空/空白 的条目，并重排 position。
 */
export function buildItemListJsonLd(input: ItemListJsonLdInput) {
  const { name, description, items } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    itemListElement: items
      .filter((item) => item.name.trim())
      .map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: item.url,
        name: item.name,
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
