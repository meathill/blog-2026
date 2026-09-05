import { Link } from '@/i18n/routing';
import type { TechSection } from '@/lib/tech';
import { localize } from '@/lib/tech';

interface TechSectionCardProps {
  section: TechSection;
  locale: string;
  /** 已插值好的文章数文案，例如「12 篇文章」 */
  postsCountLabel: string;
}

/**
 * `/tech` hub 上的分类入口卡片：icon + 分类名 + 一句话定位 + 文章数，整卡可点。
 */
export default function TechSectionCard({ section, locale, postsCountLabel }: TechSectionCardProps) {
  const Icon = section.icon;
  return (
    <div className="card-hover group relative flex flex-col rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
        <Icon size={22} />
      </div>

      <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)] group-hover:text-gradient transition-all">
        <Link prefetch={false} href={`/tech/${section.slug}`}>
          <span className="absolute inset-0" />
          {localize(section.title, locale)}
        </Link>
      </h3>

      <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        {localize(section.description, locale)}
      </p>

      <span className="mt-auto text-xs font-medium text-[var(--text-muted)]">{postsCountLabel}</span>
    </div>
  );
}
