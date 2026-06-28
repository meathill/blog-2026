import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { Solution } from '@/lib/solutions';
import { localize } from '@/lib/solutions';

interface SolutionCardProps {
  solution: Solution;
  locale: string;
  learnMoreLabel: string;
}

export default function SolutionCard({ solution, locale, learnMoreLabel }: SolutionCardProps) {
  const Icon = solution.icon;
  return (
    <div className="card-hover group relative flex flex-col rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
        <Icon size={22} />
      </div>

      <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-amber-600 transition-colors">
        <Link href={`/solutions/${solution.slug}`}>
          <span className="absolute inset-0" />
          {localize(solution.title, locale)}
        </Link>
      </h3>

      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{localize(solution.tagline, locale)}</p>

      <ul className="mb-6 space-y-2">
        {solution.outcomes.map((outcome) => (
          <li key={outcome.zh} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
            <CheckIcon size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <span>{localize(outcome, locale)}</span>
          </li>
        ))}
      </ul>

      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-amber-600 group-hover:gap-2 transition-all">
        {learnMoreLabel}
        <ArrowRightIcon size={16} />
      </span>
    </div>
  );
}
