import React from 'react';
import { Clock, Sparkles, CheckCircle, ArrowRight, Building, User } from 'lucide-react';
import { getCurrencySymbol } from '../gigConstants';

export default function GigCard({ gig, onClick, isCandidate = false, candidateIds = [] }) {
  const catList = (gig.categories && gig.categories.length > 0)
    ? gig.categories
    : (gig.category ? [gig.category] : ['General']);

  const hasApplied = isCandidate && (
    gig.hasApplied ||
    (gig.applicants || []).some(a => candidateIds.includes(a.candidateId?.toString()))
  );

  const displayLogo = gig.logo || gig.company?.logo || gig.company?.logoUrl;
  const companyName = gig.company ? (gig.company.name || 'Company').replace(/^c_/i, '') : (gig.ownerName || 'Client');
  const initial = (companyName || gig.title || 'G').charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onClick(gig.id)}
      className="group w-full bg-surface p-5 sm:p-6 hover:bg-surface-container-high transition-all cursor-pointer relative flex flex-col sm:flex-row items-start gap-4 sm:gap-5"
    >
      {/* Left: Square Logo Box (Decreased size matching Opportunities) */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none flex items-center justify-center overflow-hidden shadow-2xs group-hover:border-blue-600 transition-colors">
        {displayLogo ? (
          <img
            src={displayLogo}
            alt={gig.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initial');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`fallback-initial w-full h-full items-center justify-center flex font-headline font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200 select-none ${displayLogo ? 'hidden' : 'flex'}`}
        >
          {initial}
        </div>
      </div>

      {/* Right: Gig Information Container */}
      <div className="flex-1 min-w-0 space-y-3 w-full">
        {/* Top Row: Title, Company / Poster & Budget */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors line-clamp-1">
                {gig.title}
              </h3>
              {gig.status && gig.status !== 'OPEN' && (
                <span className="px-2 py-0.5 text-[9px] font-headline font-bold tracking-wider rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {gig.status}
                </span>
              )}
            </div>

            {/* Company / Poster Attribution */}
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-sans">
              {gig.company ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Building className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {companyName}
                  </span>
                  {gig.company.verified && (
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 px-1.5 py-0.2 rounded-none font-bold tracking-wider font-headline">
                      ✓ Verified
                    </span>
                  )}
                  {gig.company.location && (
                    <span className="text-slate-500 text-[11px] hidden sm:inline">&bull; {gig.company.location}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <User className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>Posted by <strong className="text-slate-900 dark:text-slate-100 font-semibold">{gig.ownerName || 'Client'}</strong></span>
                  {gig.ownerRole && (
                    <span className="px-1.5 py-0.2 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[9px] font-headline font-bold text-slate-700 dark:text-slate-300">
                      {gig.ownerRole}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Budget Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0">
            <div className="bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 px-3 py-1 rounded-none text-emerald-900 dark:text-emerald-200 font-headline font-bold text-sm shadow-2xs">
              {getCurrencySymbol(gig.currency)}{gig.budget}
            </div>
            <span className="text-[10px] font-headline font-semibold text-slate-600 dark:text-slate-400 tracking-wider">
              Fixed Budget
            </span>
          </div>
        </div>

        {/* Description Snippet */}
        {gig.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed line-clamp-2">
            {gig.description}
          </p>
        )}

        {/* Middle Row: Categories & Badges */}
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          {catList.map((cat, idx) => (
            <span
              key={idx}
              className="text-[10px] font-headline font-semibold tracking-wider px-2 py-0.5 rounded-none bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600 flex items-center gap-1 shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              {cat}
            </span>
          ))}

          {hasApplied && (
            <span className="text-[10px] font-headline font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 rounded-none border border-emerald-400 dark:border-emerald-700 flex items-center gap-1 shrink-0 ml-auto">
              <CheckCircle className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Applied
            </span>
          )}
        </div>

        {/* Bottom Row: Delivery Time, Skills & View Action */}
        
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-sans shrink-0">
            <Clock className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
            <span>Timeline: <strong className="text-slate-900 dark:text-slate-100 font-bold">{gig.deliveryTime} {/^\d+$/.test(gig.deliveryTime?.toString().trim()) ? 'days' : ''}</strong></span>
          

          {/* Tech Stack Badges and View Link */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
            <div className="flex flex-wrap items-center gap-1 overflow-hidden">
              {(gig.skills || []).slice(0, 4).map(skill => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-sans font-semibold text-slate-800 dark:text-slate-200"
                >
                  {skill}
                </span>
              ))}
              {(gig.skills || []).length > 4 && (
                <span className="text-[9px] font-sans text-slate-500 dark:text-slate-400 px-1">
                  +{(gig.skills || []).length - 4} more
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs font-headline font-bold text-blue-800 dark:text-blue-300 group-hover:text-blue-900 dark:group-hover:text-blue-100 group-hover:translate-x-0.5 transition-all shrink-0">
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
