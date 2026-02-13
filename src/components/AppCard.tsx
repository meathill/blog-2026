'use client';

import { Link } from '@/i18n/routing';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface AppCardProps {
  app: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    url: string | null;
  };
  tags?: {
    id: string;
    name: string;
    slug: string;
  }[];
  i18n?: {
    open_app: string;
  };
}

export default function AppCard({ app, tags = [], i18n }: AppCardProps) {
  return (
    <div className="card-hover group relative flex flex-col rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {app.icon ? (
            <Image
              src={app.icon}
              alt={app.name}
              width={48}
              height={48}
              className="rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xl shadow-md">
              {app.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg text-foreground group-hover:text-amber-600 transition-colors">
              <Link href={`/app/${app.slug}`}>
                <span className="absolute inset-0" />
                {app.name}
              </Link>
            </h3>
          </div>
        </div>
      </div>

      <p className="mb-6 line-clamp-2 text-sm text-muted-foreground flex-grow">{app.description}</p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
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
            className="z-10 flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-500 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {i18n?.open_app || 'Open App'} <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
