import { getPosts, type WPPost } from '@/lib/wordpress';
import { selectRelatedPosts } from '@/lib/post-utils';
import PostCard from '@/components/PostCard';

interface RelatedPostsProps {
  post: WPPost;
}

const RELATED_COUNT = 3;

/**
 * 文章页「相关文章」区块：优先按共享标签匹配，候选不足时按分类兜底。
 */
export default async function RelatedPosts({ post }: RelatedPostsProps) {
  let candidates: WPPost[] = [];

  if (post.tags?.length) {
    const { posts } = await getPosts({ tags: post.tags, perPage: 6, embed: true });
    candidates = posts;
  }

  const usable = candidates.filter((item) => item.slug !== post.slug);
  if (usable.length < RELATED_COUNT && post.categories?.length) {
    const { posts } = await getPosts({ categories: post.categories, perPage: 6, embed: true });
    const bySlug = new Map<string, WPPost>();
    for (const item of [...candidates, ...posts]) {
      bySlug.set(item.slug, item);
    }
    candidates = [...bySlug.values()];
  }

  const related = selectRelatedPosts(post, candidates, RELATED_COUNT);
  if (!related.length) {
    return null;
  }

  return (
    <section className="mt-16 pt-8 border-t border-[var(--surface-border)]">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">相关文章</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {related.map((item) => (
          <PostCard key={item.slug} post={item} />
        ))}
      </div>
    </section>
  );
}
