import Link from 'next/link';

// 模拟数据
const tags = [
  { name: 'Vue.js', count: 45 },
  { name: 'React', count: 38 },
  { name: 'Node.js', count: 32 },
  { name: 'TypeScript', count: 28 },
  { name: 'Next.js', count: 24 },
  { name: 'JavaScript', count: 56 },
  { name: 'CSS', count: 18 },
  { name: 'Cloudflare', count: 12 },
  { name: '数据库', count: 15 },
  { name: '移动开发', count: 20 },
  { name: '工具', count: 22 },
  { name: '生活', count: 35 },
];

function getTagSize(count: number): string {
  if (count >= 50) return 'text-lg font-semibold';
  if (count >= 30) return 'text-base font-medium';
  if (count >= 20) return 'text-sm font-medium';
  return 'text-xs';
}

export default function TagCloud() {
  return (
    <section className="py-16 border-t border-[var(--surface-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-responsive-title mb-8 text-center">
          <span className="text-gradient">热门标签</span>
        </h2>

        <div className="flex flex-wrap justify-center gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name)}`}
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
