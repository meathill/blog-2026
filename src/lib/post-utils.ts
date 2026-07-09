import type { TocItem } from '@/components/posts/post-toc';
import type { FaqPair } from '@/lib/seo/jsonld';

/** 构建规范文章路径所需的最小 post 形状（避免 post-utils 依赖 wordpress 包）。 */
export interface PostPathInput {
  slug: string;
  categories?: number[];
  _embedded?: {
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

/**
 * 解析主分类 slug：优先 `_embedded['wp:term'][0]`（WP 惯例为 categories），
 * 否则用 `categorySlugById` 对照 `categories[0]`，最后 `uncategorized`。
 */
export function getPrimaryCategorySlug(post: PostPathInput, categorySlugById?: Map<number, string>): string {
  const primaryId = post.categories?.[0];
  const embeddedCategories = post._embedded?.['wp:term']?.[0];

  if (embeddedCategories?.length) {
    if (primaryId != null) {
      const matched = embeddedCategories.find((term) => term.id === primaryId);
      if (matched?.slug) {
        return decodeURIComponent(matched.slug);
      }
    }
    if (embeddedCategories[0]?.slug) {
      return decodeURIComponent(embeddedCategories[0].slug);
    }
  }

  if (primaryId != null && categorySlugById?.has(primaryId)) {
    return categorySlugById.get(primaryId)!;
  }

  return 'uncategorized';
}

/** 规范文章路径：`/posts/{category}/{slug}`，与 sitemap / 页内 canonical 一致。 */
export function getPostPath(post: PostPathInput, categorySlugById?: Map<number, string>): string {
  const categorySlug = getPrimaryCategorySlug(post, categorySlugById);
  return `/posts/${categorySlug}/${post.slug}`;
}

/** 去标签 + 解码常见实体 + 收敛空白，供 FAQ 解析使用（保持 post-utils 无外部依赖、易测试）。 */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 从处理后的 HTML 内容中提取标题生成 TOC
 */
export function extractTOC(html: string, stripHtmlFn: (s: string) => string): TocItem[] {
  const headingRegex = /<h([2-4])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[2-4]>/gi;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    toc.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: stripHtmlFn(match[3]),
    });
  }

  return toc;
}

/**
 * 检查 HTML 内容是否包含代码块（<pre> 标签）
 */
export function hasCodeBlocks(html: string): boolean {
  return /<pre[\s>]/i.test(html);
}

/**
 * 从文章正文提取 FAQ 问答对，用于生成 FAQPage 结构化数据。
 * 约定：标题含「常见问题」或「FAQ」的 <h2> 区块内，每个 <h3> 为问、其后内容为答。
 * 未命中约定时返回空数组（不产出 FAQ schema）。
 */
export function extractFaq(html: string): FaqPair[] {
  const h2Regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let faqStart = -1;
  let faqEnd = html.length;
  let heading: RegExpExecArray | null;
  while ((heading = h2Regex.exec(html)) !== null) {
    const headingText = stripTags(heading[1]);
    if (faqStart === -1) {
      if (/常见问题|faq/i.test(headingText)) {
        faqStart = h2Regex.lastIndex;
      }
    } else {
      faqEnd = heading.index;
      break;
    }
  }
  if (faqStart === -1) {
    return [];
  }

  const section = html.slice(faqStart, faqEnd);
  const pairs: FaqPair[] = [];
  const qaRegex = /<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi;
  let qa: RegExpExecArray | null;
  while ((qa = qaRegex.exec(section)) !== null) {
    const question = stripTags(qa[1]);
    const answer = stripTags(qa[2]);
    if (question && answer) {
      pairs.push({ question, answer });
    }
  }
  return pairs;
}

/**
 * 从候选文章中挑选相关文章：剔除自身、按 slug 去重、按共享标签数降序，截取前 n 篇。
 * 无共享标签时仍返回候选顺序的前 n 篇（适配按分类兜底取到的候选）。
 */
export function selectRelatedPosts<T extends { slug: string; tags?: number[] }>(
  current: { slug: string; tags?: number[] },
  candidates: T[],
  n = 3,
): T[] {
  const currentTags = new Set(current.tags ?? []);
  const seen = new Set<string>();
  return candidates
    .filter((post) => {
      if (post.slug === current.slug || seen.has(post.slug)) {
        return false;
      }
      seen.add(post.slug);
      return true;
    })
    .map((post) => ({
      post,
      shared: (post.tags ?? []).filter((tag) => currentTags.has(tag)).length,
    }))
    .sort((a, b) => b.shared - a.shared)
    .slice(0, n)
    .map((entry) => entry.post);
}
