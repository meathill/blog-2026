import { GlobeIcon, ReceiptTextIcon, UserRoundIcon, WrenchIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ValueStrip() {
  const t = await getTranslations('Home');

  const items = [
    { icon: UserRoundIcon, title: t('value_solo_title'), desc: t('value_solo_desc') },
    { icon: GlobeIcon, title: t('value_remote_title'), desc: t('value_remote_desc') },
    { icon: WrenchIcon, title: t('value_experience_title'), desc: t('value_experience_desc') },
    { icon: ReceiptTextIcon, title: t('value_pricing_title'), desc: t('value_pricing_desc') },
  ];

  return (
    <section className="py-16 md:py-20 border-t border-[var(--surface-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-responsive-title mb-3">
            <span className="text-gradient">{t('value_title')}</span>
          </h2>
          <p className="text-[var(--text-secondary)]">{t('value_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] transition-all hover:border-amber-600/40"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                <item.icon size={20} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-[var(--text-primary)]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
