import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

// Previous / Next bar shown at the bottom of the job brief and gig detail pages.
// `navigation` comes from getBriefNavigation (utils/jobAccess.js) plus handlers:
// { position, total, onPrev, onNext, freeLimitReached, totalInList, freeLimit, onUpgrade }
export default function OpportunityPager({ navigation, itemLabel = 'Job' }) {
  if (!navigation) return null;
  const plural = `${itemLabel.toLowerCase()}s`;
  const buttonClass = 'px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-blue-700 font-headline font-bold text-xs rounded-none flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-300 dark:disabled:hover:border-slate-700 disabled:hover:bg-white dark:disabled:hover:bg-slate-900';

  return (
    <div className="border-t border-slate-300 dark:border-slate-700 pt-5 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={navigation.onPrev || undefined}
          disabled={!navigation.onPrev}
          className={buttonClass}
          aria-label={`Previous ${itemLabel.toLowerCase()}`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous {itemLabel}</span>
        </button>

        <span className="text-xs font-headline font-bold text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
          {itemLabel} {navigation.position} of {navigation.total}
        </span>

        <button
          type="button"
          onClick={navigation.onNext || undefined}
          disabled={!navigation.onNext}
          title={navigation.freeLimitReached ? `The free plan includes ${navigation.freeLimit} ${plural}` : undefined}
          className={buttonClass}
          aria-label={`Next ${itemLabel.toLowerCase()}`}
        >
          <span>Next {itemLabel}</span>
          {navigation.freeLimitReached ? <Lock className="w-3.5 h-3.5" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {navigation.freeLimitReached && (
        <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 text-right">
          Free plan includes {navigation.freeLimit} {plural}.{' '}
          <button
            type="button"
            onClick={navigation.onUpgrade}
            className="font-headline font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Upgrade to Student Pro
          </button>{' '}
          to browse all {navigation.totalInList}.
        </p>
      )}
    </div>
  );
}
