import React from 'react';
import {
  MapPin,
  Building,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Briefcase
} from 'lucide-react';

const BG_COLORS = [
  'bg-blue-800',
  'bg-slate-800',
  'bg-emerald-800',
  'bg-indigo-800',
  'bg-purple-800',
  'bg-cyan-800',
  'bg-amber-800',
  'bg-rose-800'
];

function getCompanyInitials(name) {
  if (!name) return 'AG';
  const cleanName = name.replace(/^c_/i, '').trim();
  if (!cleanName) return 'AG';
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
}

function getCompanyColor(name) {
  if (!name) return BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % BG_COLORS.length;
  return BG_COLORS[idx];
}

function formatStipendDisplay(job) {
  if (!job) return 'Stipend Unspecified';
  if (job.showSalary === false) {
    return job.opportunityType === 'INTERNSHIP' ? 'Stipend Undisclosed' : 'Salary Undisclosed';
  }

  const full = job.stipendFullTime || job.stipendFull;
  const part = job.stipendPartTime || job.stipendPart;
  const sal = job.salary;
  const st = job.stipend;

  const formatAmount = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (!str) return '';
    const clean = str.replace(/^₹\s*/, '');
    const num = parseInt(clean.replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      return num.toLocaleString('en-IN');
    }
    return clean;
  };

  if (full && part) {
    const formattedPart = formatAmount(part);
    const formattedFull = formatAmount(full);
    if (formattedPart === formattedFull) {
      return `₹ ${formattedPart} /mo`;
    }
    return `₹ ${formattedPart} - ${formattedFull} /mo`;
  }

  const singleVal = full || part || sal || st;
  if (singleVal) {
    const formatted = formatAmount(singleVal);
    if (formatted.toLowerCase().includes('/mo') || formatted.toLowerCase().includes('month') || formatted.toLowerCase().includes('k/mo')) {
      return `₹ ${formatted}`;
    }
    return `₹ ${formatted} /mo`;
  }

  return 'Stipend Unspecified';
}

function formatLocationDisplay(job) {
  const loc = (job.location || job.workMode || '').trim();
  if (!loc) return 'Work from home, In';
  const lower = loc.toLowerCase();
  if (lower.includes('home') || lower.includes('remote') || lower === 'wfh') {
    return 'Work from home, In';
  }
  return loc;
}

export default function JobSnapshotCard({ job, onClick }) {
  if (!job) return null;

  const rawCompanyName = job.companyName || job.company?.name || 'Company';
  const companyDisplayName = rawCompanyName.replace(/^c_/i, '').trim();
  const logoUrl = job.company?.logoUrl || job.logoUrl || job.companyLogo;
  const initials = getCompanyInitials(rawCompanyName);
  const colorClass = getCompanyColor(companyDisplayName);
  const isApplied = Boolean(job.applied);
  const locationText = formatLocationDisplay(job);
  const stipendText = formatStipendDisplay(job);

  return (
    <article
      onClick={() => onClick?.(job)}
      className="group bg-surface hover:bg-surface-container-high border border-slate-300 dark:border-slate-700 hover:border-blue-700 dark:hover:border-blue-500 rounded-none p-5 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 text-left relative"
    >
      {/* 1. Top Row: Title & Company on Left, Square Logo on Right */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors leading-snug line-clamp-1">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-sans">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
              {companyDisplayName}
            </span>
            {job.company?.verified && (
              <span className="text-[9px] bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 px-1 py-0.2 rounded-none font-headline font-bold tracking-wider shrink-0">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {/* Square Company Logo Box (Right) */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-surface-container-low border border-slate-300 dark:border-slate-700 rounded-none flex items-center justify-center overflow-hidden shadow-2xs group-hover:border-blue-600 transition-colors">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyDisplayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.company-initials-box');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`company-initials-box w-full h-full ${colorClass} text-white flex items-center justify-center font-headline font-extrabold text-sm sm:text-base tracking-wider  select-none ${
              logoUrl ? 'hidden' : 'flex'
            }`}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Stipend | Place for Work */}
      <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-sans flex-wrap">
        <span className="font-headline font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 px-2 py-0.5 rounded-none text-xs shadow-2xs">
          {stipendText}
        </span>
        <span className="text-slate-300 dark:text-slate-600 font-light">|</span>
        <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200 truncate">
          <MapPin className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
          <span className="truncate">{locationText}</span>
        </span>
      </div>

      {/* 3. Skills Row */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {job.requirements && job.requirements.length > 0 ? (
          <>
            {job.requirements.slice(0, 3).map((req, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[11px] font-headline font-semibold rounded-none bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600"
              >
                {req.skillName}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="text-[10px] font-headline font-semibold text-slate-600 dark:text-slate-400 px-1.5 py-0.5 bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none">
                +{job.requirements.length - 3} more
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            General technical skills
          </span>
        )}
      </div>

      {/* 4. Bottom Row: Status Badge & View Details Action */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          {isApplied ? (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-headline font-bold text-[10px] rounded-none  tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              Applied
            </span>
          ) : job.matched ? (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 font-headline font-bold text-[10px] rounded-none  tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-700 dark:text-blue-400" />
              Eligible to Apply
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-headline font-bold text-[10px] rounded-none  tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-700 dark:text-amber-400" />
              Test Required
            </span>
          )}

          <span className="px-1.5 py-0.2 text-[9px] font-headline font-bold  tracking-wider rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hidden sm:inline">
            {job.opportunityType || 'Job'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-headline font-bold text-blue-800 dark:text-blue-300 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </article>
  );
}
