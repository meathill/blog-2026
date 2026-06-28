import { ArrowRightIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getPosts } from '@/lib/wordpress';
import PostCard from '@/components/PostCard';

export default async function RecentPosts() {
  const t = await getTranslations('Home');
  const { posts } = await getPosts({ perPage: 6 });

  if (posts.length === 0) return null;

  return (
    <section className="py-16 md:py-20 border-t border-[var(--surface-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">
              <span className="text-gradient">{t('posts_title')}</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{t('posts_subtitle')}</p>
          </div>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-500 transition-all group"
          >
            {t('posts_view_all')}
            <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
