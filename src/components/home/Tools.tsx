import { ArrowUpRightIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getAllTools, localizeTool, TOOLS_BASE_URL } from '@/lib/tools';

export default async function Tools() {
  const locale = await getLocale();
  const t = await getTranslations('Tools');
  const tools = getAllTools();

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {t('title')}
            </h2>
            <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
          </div>

          <a
            href={TOOLS_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t('view_all')} <ArrowUpRightIcon size={16} />
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <a
              key={tool.path}
              href={`${TOOLS_BASE_URL}${tool.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                <tool.icon size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="flex items-center gap-1 font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                  {localizeTool(tool.name, locale)}
                  <ArrowUpRightIcon size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {localizeTool(tool.description, locale)}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <a
            href={TOOLS_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t('view_all')} <ArrowUpRightIcon size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
