import { ArrowRightIcon, SparklesIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function Hero() {
  const t = await getTranslations('Home');

  const stats = [
    { value: '20+', label: t('hero_stat_experience') },
    { value: '30+', label: t('hero_stat_projects') },
    { value: '100%', label: t('hero_stat_remote') },
  ];

  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 渐变光晕 */}
        <div
          className="absolute left-1/2 top-24 hidden h-80 w-80 -translate-x-1/2 rounded-full blur-3xl md:block"
          style={{ backgroundColor: 'var(--glow-amber)' }}
        />

        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--surface-border) 1px, transparent 1px),
              linear-gradient(90deg, var(--surface-border) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* 渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </div>

      {/* 内容 */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* 小标签 */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-[color:color-mix(in_srgb,var(--surface),transparent_12%)] px-4 py-2 shadow-sm">
          <SparklesIcon size={16} className="text-[var(--accent)]" />
          <span className="text-sm text-[var(--text-secondary)]">{t('hero_badge')}</span>
        </div>

        {/* 大标题 */}
        <h1 className="text-responsive-hero mb-6">
          <span className="block text-[var(--text-primary)]">{t('hero_title_lead')}</span>
          <span className="block text-gradient">{t('hero_title_main')}</span>
        </h1>

        {/* 副标题 */}
        <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
          {t.rich('hero_subtitle', {
            em: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
          })}
        </p>

        {/* CTA 按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-4 text-white font-semibold shadow-lg transition-all hover:shadow-xl md:hover:scale-105"
          >
            {t('hero_cta_primary')}
            <ArrowRightIcon size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <Link
            prefetch={false}
            href="/solutions"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] px-8 py-4 font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--surface-hover)]"
          >
            {t('hero_cta_secondary')}
          </Link>
        </div>

        {/* 统计数据 */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</div>
              <div className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[var(--text-muted)] md:flex">
        <span className="text-xs">{t('hero_scroll')}</span>
        <div className="w-5 h-8 rounded-full border-2 border-current flex items-start justify-center p-1">
          <div className="h-2 w-1 rounded-full bg-current" />
        </div>
      </div>
    </section>
  );
}
