import { ArrowRightIcon, CalendarIcon, ClockIcon, EyeIcon } from 'lucide-react';
import Link from 'next/link';
import { getPosts, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';

export default async function RecentPosts() {
  const { posts } = await getPosts({ perPage: 10 });

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-responsive-title mb-2">
              <span className="text-gradient">最新文章</span>
            </h2>
            <p className="text-[var(--text-secondary)]">技术干货与生活感悟</p>
          </div>
          <Link
            href="/posts"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all group"
          >
            查看全部
            <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured Post - First post */}
          {posts[0] && (
            <div className="md:col-span-2 lg:col-span-1">
              <PostCard post={posts[0]} featured />
            </div>
          )}

          {/* Regular Posts */}
          {posts.slice(1, 4).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* More Posts - 3 columns grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(4, 10).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Mobile "View All" Button */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            查看全部文章
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// 内联 PostCard 组件以支持服务器组件
function PostCard({ post, featured = false }: { post: any; featured?: boolean }) {
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 100);
  const date = formatDate(post.date);
  const readingTime = calculateReadingTime(post.content.rendered);
  const slug = post.slug;

  // 获取分类名称
  const category = post._embedded?.['wp:term']?.[0]?.[0]?.name;

  return (
    <article
      className={`group relative rounded-2xl overflow-hidden card-hover ${
        featured ? 'glass glow p-6 md:p-8' : 'bg-[var(--surface)] border border-[var(--surface-border)] p-5 md:p-6'
      }`}
    >
      {/* 推荐标记 */}
      {featured && (
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white">
            推荐
          </span>
        </div>
      )}

      {/* 分类标签 */}
      {category && (
        <div className="mb-4">
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            {category}
          </span>
        </div>
      )}

      {/* 标题 */}
      <h3
        className={`font-bold mb-3 group-hover:text-gradient transition-all ${
          featured ? 'text-xl md:text-2xl' : 'text-lg'
        }`}
      >
        <Link href={`/posts/${slug}`} className="hover:no-underline text-[var(--text-primary)]">
          {title}
        </Link>
      </h3>

      {/* 摘要 */}
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 line-clamp-2">{excerpt}</p>

      {/* 元信息 */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1">
          <CalendarIcon size={12} />
          {date}
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon size={12} />
          {readingTime} 分钟
        </span>
      </div>

      {/* 悬浮时显示的阅读更多 */}
      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/posts/${slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:gap-2 transition-all"
        >
          阅读全文
          <ArrowRightIcon size={14} />
        </Link>
      </div>
    </article>
  );
}
