import { ArrowUpRightIcon, CheckIcon } from 'lucide-react';
import { COMPANY_REGISTRATION_URL, getCompanyRegistrationContent } from '@/lib/company-registration';

export default function CompanyRegistrationDetails({ locale }: { locale: string }) {
  const content = getCompanyRegistrationContent(locale);

  return (
    <>
      <section
        id="company-pricing"
        aria-labelledby="company-pricing-title"
        className="mb-14 rounded-2xl border border-border bg-muted/40 p-6 sm:p-8"
      >
        <p className="mb-3 text-sm text-muted-foreground">{content.provider}</p>
        <h2 id="company-pricing-title" className="text-2xl font-bold">
          {content.pricingTitle}
        </h2>
        <div className="my-6 flex flex-wrap items-end justify-between gap-5">
          <p>
            <span className="text-5xl font-bold tracking-tight text-foreground">{content.price}</span>
            <span className="mt-2 block text-sm text-muted-foreground">{content.billing}</span>
          </p>
          <a
            href={COMPANY_REGISTRATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-3 font-semibold text-amber-50 transition-colors hover:bg-amber-800 hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
          >
            {content.startLabel} <ArrowUpRightIcon size={18} aria-hidden="true" />
          </a>
        </div>
        <p className="mb-6 leading-relaxed text-[var(--text-secondary)]">{content.planDescription}</p>
        <a
          href="#company-timeline"
          className="mb-6 inline-block text-sm font-medium text-amber-700 underline underline-offset-4 dark:text-amber-400"
        >
          {content.timelineLinkLabel}
        </a>
        <h3 className="mb-3 font-semibold">{content.includesTitle}</h3>
        <ul className="mb-6 grid gap-3 sm:grid-cols-2">
          {content.includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
              <CheckIcon size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <dl className="divide-y divide-border border-y border-border">
          {content.extras.map((extra) => (
            <div key={extra.title} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-x-6">
              <dt className="font-semibold">{extra.title}</dt>
              <dd className="font-semibold sm:col-start-2 sm:row-span-2 sm:text-right">
                {extra.price} <span className="text-sm font-normal text-muted-foreground">{extra.billing}</span>
              </dd>
              <dd className="text-sm leading-relaxed text-[var(--text-secondary)]">{extra.description}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{content.pricingNote}</p>
      </section>

      <section id="company-timeline" aria-labelledby="company-timeline-title" className="mb-14">
        <h2 id="company-timeline-title" className="mb-4 text-2xl font-bold">
          {content.timelineTitle}
        </h2>
        <p className="mb-6 leading-relaxed text-[var(--text-secondary)]">{content.timelineSummary}</p>
        <ol className="divide-y divide-border border-y border-border">
          {content.timeline.map((step, index) => (
            <li key={step.title} className="flex gap-4 py-5">
              <span
                className="pt-0.5 text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-400"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.duration}</p>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{content.timelineNote}</p>
      </section>

      <section id="company-requirements" aria-labelledby="company-requirements-title" className="mb-14">
        <h2 id="company-requirements-title" className="mb-5 text-2xl font-bold">
          {content.requirementsTitle}
        </h2>
        <ul className="space-y-3">
          {content.requirements.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[var(--text-secondary)]">
              <CheckIcon size={18} className="mt-1 shrink-0 text-amber-600" aria-hidden="true" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{content.requirementsNote}</p>
      </section>

      <section id="company-faq" aria-labelledby="company-faq-title" className="mb-10">
        <h2 id="company-faq-title" className="mb-5 text-2xl font-bold">
          {content.faqTitle}
        </h2>
        <div className="divide-y divide-border border-y border-border">
          {content.questions.map((item) => (
            <details key={item.question}>
              <summary className="cursor-pointer py-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
                {item.question}
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <aside className="mb-12 text-sm leading-relaxed text-muted-foreground">
        <p>{content.sourceNote}</p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {content.sourceLinks.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-400"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
