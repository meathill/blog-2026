import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface AppCardProps {
  app: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    url: string | null;
  };
}

export default function AppCard({ app }: AppCardProps) {
  return (
    <div className="card-hover group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {app.icon ? (
            <img
              src={app.icon}
              alt={app.name}
              className="h-12 w-12 rounded-xl object-cover shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xl shadow-md">
              {app.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 transition-colors">
              <Link href={`/app/${app.slug}`}>
                <span className="absolute inset-0" />
                {app.name}
              </Link>
            </h3>
          </div>
        </div>
      </div>

      <p className="mb-6 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400 flex-grow">{app.description}</p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-xs text-zinc-400 font-mono">/app/{app.slug}</div>
        {app.url && (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="z-10 flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-500 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Open App <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
