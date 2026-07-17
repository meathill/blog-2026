import { buildBlogSlug } from '@/lib/blog-post';
import { htmlToMarkdown } from '@/lib/blog-html-to-markdown';
import { createImportedBlogPostRecord, getBlogPostIdByWpPostId, getExistingWpPostIds } from '@/lib/blog-storage';
import { buildDraftContentFromMarkdown } from '@/lib/mcp/blog-draft';
import {
  buildPostDescription,
  getCategories,
  getPostById,
  getPosts,
  getTags,
  stripHtml,
  type WPPost,
} from '@/lib/wordpress';

export interface WordPressSearchHit {
  wpPostId: number;
  title: string;
  excerpt: string;
  slug: string;
  coverImage: string | null;
  publishedAt: Date;
  categories: string[];
  tags: string[];
}

export async function importBlogPostFromWordPress(wpPostId: number): Promise<{ id: string; slug: string }> {
  const existing = await getBlogPostIdByWpPostId(wpPostId);
  if (existing) {
    return existing;
  }

  const wpPost = await getPostById(wpPostId, { cache: 'no-store' });
  if (!wpPost) {
    throw new Error('WordPress 文章不存在或已删除。');
  }

  const { categories, tags } = await resolveTermNames(wpPost);
  const title = stripHtml(wpPost.title.rendered);
  const draft = await buildDraftContentFromMarkdown(htmlToMarkdown(wpPost.content.rendered));

  return createImportedBlogPostRecord({
    title,
    slug: buildBlogSlug(title, wpPost.slug),
    excerpt: buildPostDescription(wpPost),
    status: 'published', // 这篇文章本来就已经在 WordPress 发布了，导入不改变它的发布状态
    coverImage: resolveCoverImage(wpPost),
    categories,
    tags,
    blocksJson: draft.blocksJson,
    markdown: draft.markdown,
    html: wpPost.content.rendered, // 用原始 HTML，避免"导入后还没编辑就点了发布"时把 WP 内容劣化成有损转换版本
    wpPostId: wpPost.id,
    wpSyncedAt: new Date(),
    publishedAt: new Date(wpPost.date),
  });
}

export async function searchWordPressPostsNotInD1(search: string, limit: number): Promise<WordPressSearchHit[]> {
  if (!search.trim()) {
    return [];
  }

  try {
    // 命中的头几条里可能有几条已经导入过，多取一点再过滤裁剪，避免展示数量少于 limit。
    const { posts } = await getPosts({ search, perPage: Math.min(limit * 3, 20), embed: true });
    if (posts.length === 0) {
      return [];
    }

    const existingIds = await getExistingWpPostIds(posts.map((post) => post.id));
    const notImported = posts.filter((post) => !existingIds.has(post.id)).slice(0, limit);

    return Promise.all(
      notImported.map(async (wpPost) => {
        const { categories, tags } = await resolveTermNames(wpPost);

        return {
          wpPostId: wpPost.id,
          title: stripHtml(wpPost.title.rendered),
          excerpt: buildPostDescription(wpPost),
          slug: wpPost.slug,
          coverImage: resolveCoverImage(wpPost),
          publishedAt: new Date(wpPost.date),
          categories,
          tags,
        };
      }),
    );
  } catch (error) {
    console.error('[Blog Import] WordPress 搜索失败:', error);
    return []; // 降级而不是抛错——WordPress 不可用时，本地搜索结果仍应正常显示
  }
}

// 分类/标签名解析走权威 ID 数组（wpPost.categories/tags），不信任 _embedded['wp:term'] 的顺序，
// 镜像 src/views/PostView.tsx 里已有的正确用法。
async function resolveTermNames(wpPost: WPPost): Promise<{ categories: string[]; tags: string[] }> {
  const [allCategories, includedTags] = await Promise.all([
    wpPost.categories?.length ? getCategories() : Promise.resolve([]),
    wpPost.tags?.length ? getTags({ include: wpPost.tags }) : Promise.resolve([]),
  ]);

  return {
    categories: allCategories
      .filter((category) => wpPost.categories.includes(category.id))
      .map((category) => category.name),
    tags: includedTags.filter((tag) => wpPost.tags?.includes(tag.id)).map((tag) => tag.name),
  };
}

function resolveCoverImage(wpPost: WPPost): string | null {
  const media = wpPost._embedded?.['wp:featuredmedia']?.[0];
  return typeof media?.source_url === 'string' ? media.source_url : null;
}
