import { Link } from '@/i18n/routing';
import { getTags } from '@/lib/wordpress';

function getTagSize(count: number): string {
  if (count >= 50) return 'text-lg font-semibold';
  if (count >= 30) return 'text-base font-medium';
  if (count >= 20) return 'text-sm font-medium';
  return 'text-xs';
}

export default async function TagCloud() {
  const tags = await getTags({ perPage: 20 });

  return (
    <section className="py-16 border-t border-[var(--surface-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-responsive-title mb-8 text-center">
          <span className="text-gradient">热门标签</span>
        </h2>

        <div className="flex flex-wrap justify-center items-center gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className={`
                px-4 py-2 rounded-full
                bg-[var(--surface)] border border-[var(--surface-border)]
                text-[var(--text-secondary)]
                hover:border-amber-600 hover:text-amber-600 hover:bg-amber-600/5
                transition-all duration-200
                ${getTagSize(tag.count)}
              `}
            >
              {tag.name}
              <span className="ml-1 text-[var(--text-muted)] text-xs">({tag.count})</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
