import { ArrowRightIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { getPosts } from '@/lib/wordpress';
import PostCard from '@/components/PostCard';

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
