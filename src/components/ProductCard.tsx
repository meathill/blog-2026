import { ArrowUpRightIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { PublicAppCardData, PublicAppTag } from '@/lib/public-apps';

interface ProductCardProps {
  app: PublicAppCardData;
  tags?: PublicAppTag[];
  i18n: { visit: string };
}

export default function ProductCard({ app, tags = [], i18n }: ProductCardProps) {
  return (
    <div className="card-hover group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      {/* 封面 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-amber-500/15 to-orange-600/15">
        {app.coverImage ? (
          // biome-ignore lint/performance/noImgElement: 外部 R2 封面，避免 next/image 域名配置
          <img
            src={app.coverImage}
            alt={app.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {app.icon ? (
              // biome-ignore lint/performance/noImgElement: 外部图标
              <img src={app.icon} alt={app.name} className="h-16 w-16 rounded-2xl object-cover shadow-md" />
            ) : (
              <span className="text-5xl font-bold text-amber-600/70">{app.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        )}
      </div>

      {/* 正文 */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-amber-600 transition-colors">
          <Link href={`/app/${app.slug}`}>
            <span className="absolute inset-0" />
            {app.name}
          </Link>
        </h3>

        {app.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground flex-grow">{app.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>

          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="z-10 inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:shadow-md"
            >
              {i18n.visit} <ArrowUpRightIcon size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
