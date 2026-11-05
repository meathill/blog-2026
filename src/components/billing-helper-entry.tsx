import { ArrowRightIcon, PuzzleIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { BILLING_HELPER_PATH, getBillingHelperReleaseContent } from '@/lib/billing-helper-release';

export default function BillingHelperEntry({ locale }: { locale: string }) {
  const content = getBillingHelperReleaseContent(locale);
  return (
    <Link
      prefetch={false}
      href={BILLING_HELPER_PATH}
      className="mb-8 flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground transition-colors hover:border-amber-600"
    >
      <PuzzleIcon size={24} className="shrink-0 text-amber-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{content.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{content.entryDescription}</p>
      </div>
      <ArrowRightIcon size={18} className="shrink-0" aria-hidden="true" />
    </Link>
  );
}
