import { GithubIcon, MailIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ContactCTA() {
  const t = await getTranslations('Contact');

  return (
    <section id="contact" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-14 text-center text-white shadow-xl md:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('title')}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-white/90 leading-relaxed">{t('desc')}</p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="mailto:meathill@gmail.com?subject=%5BMeathill%20LLC%5D%20%E5%90%88%E4%BD%9C%E5%92%A8%E8%AF%A2"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-amber-700 shadow-lg transition-all hover:-translate-y-0.5"
              >
                <MailIcon size={18} /> {t('email_button')}
              </a>
              <a
                href="https://github.com/meathill"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
              >
                <GithubIcon size={18} /> {t('github_button')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
