import { useEffect, useRef, useState } from 'react';
import { BRAND_TINT } from '../../components/accountStyles';
import { Check, ChevronDown, ShieldCheck, X } from 'lucide-react';
import { hasSkillMcq } from '../../../../constants';

const initialsOf = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || '?';

/** Round avatar: profile photo, or initials when there is none or it fails to load. */
export function CandidateAvatar({ candidate, size = 38 }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = candidate?.profilePic;
  const showPhoto = src && failedSrc !== src;
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${BRAND_TINT} ${size > 40 ? 'text-[17px] font-bold' : 'text-[13px]'}`}
    >
      {showPhoto ? <img src={src} alt="" onError={() => setFailedSrc(src)} className="size-full object-cover" /> : initialsOf(candidate?.name)}
    </div>
  );
}

const BAR_CHIP = {
  above: 'bg-[#EEF2FE] font-semibold text-[#1E3A8A]',
  meets: 'bg-[#F1F3F6] font-medium text-[#334155]',
  below: 'bg-[#FFF1E8] font-semibold text-[#9A3412]'
};

/** "SQL 7" coloured against the job's bar (design: above / meets / below). */
export function BarChip({ bar }) {
  const tone = bar.gates ? BAR_CHIP[bar.state] : BAR_CHIP.meets;
  const title = `${bar.skillName}: ${bar.score} of 10, bar ${bar.minRating}${bar.gates ? '' : ' (no skill test yet, doesn’t block applying)'}`;
  return (
    <span title={title} className={`rounded-[6px] px-[7px] py-0.5 text-xs ${tone}`}>
      {bar.skillName} {bar.score}
    </span>
  );
}

/** Neutral chip ("Remote", "Python 8"). */
export function Tag({ tone = 'grey', title, children }) {
  const tones = {
    grey: 'bg-[#F1F3F6] text-[#334155]',
    blue: 'bg-[#EEF2FE] text-[#1E3A8A]',
    green: 'bg-[#DCFCE7] text-[#166534]'
  };
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-[6px] px-[7px] py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Active skill filter with its level picker (ratings only for skills that have a test). */
export function ActiveSkillChip({ skill, onUpdateRating, onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const tested = hasSkillMcq(skill.name);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const levelSet = skill.verifiedOnly || skill.minRating > 0;
  const levelLabel = skill.verifiedOnly ? 'Verified only' : skill.minRating > 0 ? `Level ${skill.minRating}+` : 'Any level';
  const pick = (minRating, verifiedOnly) => {
    onUpdateRating(skill.name, minRating, verifiedOnly);
    setOpen(false);
  };
  const option = (label, active, onClick, icon) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] ${active ? 'bg-[#EEF2FE] font-semibold text-[#1447E6]' : 'text-[#334155] hover:bg-[#F8F8F6]'}`}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {active && <Check className="size-3.5" />}
    </button>
  );

  return (
    <span ref={ref} className="relative inline-flex items-center gap-1.5 rounded-[6px] bg-[#EEF2FE] py-0.5 pl-2 pr-1 text-xs font-semibold text-[#1E3A8A]">
      {skill.name}
      {tested && (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className={`inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-px text-[11px] font-semibold ${levelSet ? 'bg-[#1447E6] text-white' : 'bg-white text-[#1447E6]'}`}
        >
          {levelLabel}
          <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
      <button type="button" onClick={() => onRemove(skill.name)} aria-label={`Remove ${skill.name} filter`} className="rounded-[4px] p-0.5 hover:bg-white hover:text-[#B91C1C]">
        <X className="size-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-[8px] border border-[#E4E6EA] bg-white p-1 font-(family-name:--font-headline) shadow-lg shadow-slate-300/50">
          {option('Any level', !skill.verifiedOnly && !(skill.minRating > 0), () => pick(0, false))}
          {option('Verified only', skill.verifiedOnly, () => pick(0, true), <ShieldCheck className="size-3.5 text-[#166534]" />)}
          <div className="my-1 border-t border-[#EEF0F3]" />
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => option(`Level ${level}+`, !skill.verifiedOnly && skill.minRating === level, () => pick(level, false)))}
        </div>
      )}
    </span>
  );
}
