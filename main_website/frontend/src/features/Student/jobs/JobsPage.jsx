import { useMemo, useRef, useState } from 'react';
import { Lock, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import { INDIAN_STATES } from '../../../constants/indianStates';
import { FREE_PLAN_JOB_LIMIT } from '../../../utils/jobAccess';
import StudentProDialog from '../profile/dialogs/StudentProDialog';
import { cleanDigits, cleanLine, cleanSkill } from '../profile/profileRules';
import { BODY, CARD, GRADIENT, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY, SMALL } from '../profile/profileTheme';
import { ComboInput, Dropdown } from '../profile/ui';
import ApplyDialog from './ApplyDialog';
import JobDetail, { LockedDetail } from './JobDetail';
import {
  EMPTY_FILTERS,
  PAY_PRESETS,
  ROLES,
  SORTS,
  STATUSES,
  TABS,
  activeFilterCount,
  companyOf,
  evaluateBars,
  gapText,
  inTab,
  initialOf,
  jobStatus,
  kindText,
  matchesFilters,
  payText,
  placeText,
  postedText,
  sortJobs,
  tabFor,
  tileColor
} from './jobsData';

const PAGE_SIZE = 10; // jobs shown at a time in the list
const LOCATIONS = ['Remote', ...INDIAN_STATES];
const SKILL_NAMES = [...new Set(ALL_SKILLS.map((item) => item.skill))];
// Old Opportunities sub-tabs (Home links still pass them).
const FROM_SUBTAB = { applied: 'applied', recommended: 'all', all: 'all' };

function StatusChip({ job }) {
  const status = jobStatus(job);
  if (status === 'applied') return <span className="self-start rounded-[6px] bg-[#E3F5EE] px-2 py-[3px] text-[12.5px] font-bold text-[#0B5E41]">Applied</span>;
  if (status === 'can') return <span className="self-start rounded-[6px] bg-[#E8EEFF] px-2 py-[3px] text-[12.5px] font-bold text-[#0B3FA8]">You can apply</span>;
  if (status === 'away') return <span className="self-start rounded-[6px] bg-[#FFF3E8] px-2 py-[3px] text-[12.5px] font-bold text-[#9A3412]">1 skill away · {gapText(job.missingRequirements[0])}</span>;
  return <span className="self-start rounded-[6px] bg-[#F1ECFF] px-2 py-[3px] text-[12.5px] font-bold text-[#5B2AA6]">{job.missingRequirements.length} skill bars to meet</span>;
}

/** Skills filter: pick from the skill list (or type one), chips below the field (also used by Gigs). */
export function SkillFilter({ id = 'jobs-skill', value, onChange }) {
  const [text, setText] = useState('');
  const add = (raw) => {
    const name = cleanSkill(raw).trim();
    setText('');
    if (name && !value.some((item) => item.toLowerCase() === name.toLowerCase())) onChange([...value, name]);
  };
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className={`text-[14px] font-semibold ${INK}`}>
        Skills asked for
      </label>
      <div
        onKeyDown={(event) => {
          // Enter on a highlighted suggestion is handled (and prevented) by ComboInput.
          if (event.key === 'Enter' && !event.defaultPrevented && text.trim()) {
            event.preventDefault();
            add(text);
          }
        }}
      >
        <ComboInput id={id} value={text} onChange={setText} onPick={add} suggestions={SKILL_NAMES} clean={cleanSkill} placeholder="e.g. Python, then Enter" />
      </div>
      {value.length > 0 && (
        <ul aria-label="Skills you're filtering by" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {value.map((skill) => (
            <li key={skill} className="inline-flex h-[30px] items-center rounded-full bg-[#E8EEFF] pl-3 pr-0.5 text-[13.5px] font-semibold text-[#0B3FA8]">
              {skill}
              <button type="button" aria-label={`Remove ${skill}`} onClick={() => onChange(value.filter((item) => item !== skill))} className="flex size-7 items-center justify-center rounded-full hover:bg-[#D5E0FF]">
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Candidate Jobs (design: candidate_jobs_design/Web — jobs list and details):
 * tabs, the previous Opportunities filters, the list and the selected job side by
 * side. Free accounts see the top FREE_PLAN_JOB_LIMIT jobs of each list (applied
 * jobs are always shown); search and filters are part of Student Pro, as before.
 * `focus` ({ id }) opens a job sent here from Home, a link or a company page.
 */
export default function JobsPage({ profile, user, token, jobs = [], isPremium, initialSubTab, focus, onApply, onTakeTest, onAddSkillWithoutTest, onOpenCompanyProfile, goToTab, onPlanUpgraded, onNotify }) {
  const focusJob = focus?.id ? jobs.find((job) => job.id === focus.id) : null;
  const [tab, setTab] = useState(() => (focusJob ? tabFor(focusJob) : FROM_SUBTAB[initialSubTab] || 'can'));
  const [selectedId, setSelectedId] = useState(() => focusJob?.id || null);
  const [handledFocus, setHandledFocus] = useState(focus);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  // Kept here, not in the detail panel: once sent, the job leaves the Can apply list
  // and the panel moves on, but the dialog must stay to show "Application sent".
  const [applyJob, setApplyJob] = useState(null);
  const detailRef = useRef(null);
  const [paging, setPaging] = useState({ key: '', extra: 0 }); // jobs shown beyond PAGE_SIZE for one tab + filter set

  // A new focus request while the page is open (e.g. "view job" on a company page).
  if (focus !== handledFocus) {
    setHandledFocus(focus);
    if (focusJob) {
      setTab(tabFor(focusJob));
      setSelectedId(focusJob.id);
      setFilters(EMPTY_FILTERS);
    }
  }

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const filtered = useMemo(() => jobs.filter((job) => matchesFilters(job, filters)), [jobs, filters]);
  const counts = Object.fromEntries(TABS.map((item) => [item.id, filtered.filter((job) => inTab(job, item.id)).length]));
  const list = useMemo(() => sortJobs(filtered.filter((job) => inTab(job, tab)), filters.sort), [filtered, tab, filters.sort]);
  const free = !isPremium && tab !== 'applied';
  const visible = free ? list.slice(0, FREE_PLAN_JOB_LIMIT) : list;
  const lockedCount = list.length - visible.length;
  // PAGE_SIZE jobs, then PAGE_SIZE more each time "Show more" is pressed; a new tab or filter starts over.
  const pageKey = `${tab}|${JSON.stringify(filters)}`;
  const extra = paging.key === pageKey ? paging.extra : 0;
  const shown = visible.slice(0, PAGE_SIZE + extra);
  const moreCount = visible.length - shown.length;
  const selected = list.find((job) => job.id === selectedId) || visible[0] || null;
  const selectedLocked = Boolean(selected && free && !visible.includes(selected));
  const filterCount = activeFilterCount(filters);

  const pick = (job) => {
    setSelectedId(job.id);
    if (window.innerWidth < 1024) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const emptyText = {
    can: 'No job matches all your skill bars yet. Raise a score to open one up.',
    away: 'No job is just one skill away right now.',
    all: 'No jobs match these filters.',
    applied: 'You haven’t applied to any jobs yet.'
  }[tab];

  return (
    <div className={PAGE}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-1">
            <h1 className="m-0 text-[28px] leading-tight">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>Jobs</span>
            </h1>
            <p className={`m-0 text-[15.5px] ${MUTED}`}>Every job shows the score it needs for each skill. You see where you stand before you apply.</p>
          </div>
          {isPremium ? (
            <label className="relative flex h-11 min-w-0 flex-[0_1_380px] items-center">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 size-[18px] text-[#475373]" />
              <span className="sr-only">Search jobs</span>
              <input
                type="search"
                value={filters.search}
                maxLength={80}
                onChange={(event) => set('search')(cleanLine(event.target.value))}
                placeholder="Search by role, company, city or skill"
                className="h-11 w-full rounded-[10px] border border-[#C9D1E3] bg-white pl-10 pr-3.5 text-[15px] text-[#0E1B3D] placeholder:text-[#6B7591] hover:border-[#9AA6C8] focus:border-[#0167F6] focus:outline-none focus:ring-[3px] focus:ring-[#0167F6]/15"
              />
            </label>
          ) : (
            <button type="button" onClick={() => setProOpen(true)} className="flex h-11 min-w-0 flex-[0_1_380px] items-center gap-2.5 rounded-[10px] border border-[#C9D1E3] bg-white px-3.5 text-left text-[15px] text-[#475373] hover:border-[#6378F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]">
              <Search aria-hidden="true" className="size-[18px] shrink-0" />
              <span className="flex-1 truncate">Search all jobs by role, company, city</span>
              <span className="rounded-[6px] bg-[#F1ECFF] px-2 py-0.5 text-[12px] font-bold text-[#5B2AA6]">Pro</span>
            </button>
          )}
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
            {TABS.map((item) => {
              const on = item.id === tab;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${
                    on ? 'border-transparent bg-[linear-gradient(135deg,#0E1B3D_0%,#1E3A8A_60%,#5B3FD0_100%)] text-white shadow-[0_8px_18px_-10px_rgba(30,58,138,0.9)]' : 'border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9]'
                  }`}
                >
                  {item.label}
                  <span className={`min-w-[22px] rounded-full px-1.5 text-center text-[12px] font-bold ${on ? 'bg-white/20 text-white' : 'bg-[#E8EEFF] text-[#0B3FA8]'}`}>{counts[item.id]}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[14px] ${MUTED}`}>
              {list.length} job{list.length === 1 ? '' : 's'}
            </span>
            <button type="button" aria-expanded={isPremium ? filtersOpen : undefined} onClick={() => (isPremium ? setFiltersOpen((open) => !open) : setProOpen(true))} className={`${SECONDARY} h-10 px-3.5`}>
              {isPremium ? <SlidersHorizontal aria-hidden="true" className="size-4" /> : <Lock aria-hidden="true" className="size-4" />}
              Filters
              {isPremium && filterCount > 0 && <span className="rounded-full bg-[#0167F6] px-1.5 text-[12px] font-bold text-white">{filterCount}</span>}
              {!isPremium && <span className="rounded-[6px] bg-[#F1ECFF] px-1.5 py-0.5 text-[11.5px] font-bold text-[#5B2AA6]">Pro</span>}
            </button>
          </div>
        </div>

        {isPremium && filtersOpen && (
          <section aria-label="Filters" className={`${CARD} flex flex-col gap-4 p-5`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="jobs-sort" className={`text-[14px] font-semibold ${INK}`}>
                  Sort by
                </label>
                <Dropdown id="jobs-sort" value={filters.sort} onChange={set('sort')} options={SORTS} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="jobs-role" className={`text-[14px] font-semibold ${INK}`}>
                  Role
                </label>
                <Dropdown id="jobs-role" value={filters.role} onChange={set('role')} options={ROLES} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="jobs-location" className={`text-[14px] font-semibold ${INK}`}>
                  Location
                </label>
                <ComboInput id="jobs-location" value={filters.location} onChange={set('location')} suggestions={LOCATIONS} clean={(value) => value.replace(/[^\p{L}\s,.-]/gu, '')} maxLength={60} placeholder="Any city, or Remote" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="jobs-status" className={`text-[14px] font-semibold ${INK}`}>
                  Status
                </label>
                <Dropdown id="jobs-status" value={filters.status} onChange={set('status')} options={STATUSES} />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <SkillFilter value={filters.skills} onChange={set('skills')} />
              <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
                <legend className={`mb-2 p-0 text-[14px] font-semibold ${INK}`}>Monthly pay</legend>
                <div className="flex flex-wrap gap-1.5">
                  {PAY_PRESETS.map((preset) => {
                    const on = filters.minPay === preset.min && filters.maxPay === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setFilters((prev) => ({ ...prev, minPay: on ? '' : preset.min, maxPay: on ? '' : preset.max }))}
                        className={`h-9 rounded-full border px-3 text-[13.5px] font-semibold ${on ? 'border-[#0167F6] bg-[#0167F6] text-white' : 'border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9]'}`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input aria-label="Minimum monthly pay" inputMode="numeric" value={filters.minPay} onChange={(event) => set('minPay')(cleanDigits(event.target.value).slice(0, 7))} placeholder="Min ₹" className="h-10 w-full min-w-0 rounded-[10px] border border-[#C9D1E3] bg-white px-3 text-[15px] text-[#0E1B3D] placeholder:text-[#6B7591] focus:border-[#0167F6] focus:outline-none focus:ring-[3px] focus:ring-[#0167F6]/15" />
                  <span className={MUTED}>to</span>
                  <input aria-label="Maximum monthly pay" inputMode="numeric" value={filters.maxPay} onChange={(event) => set('maxPay')(cleanDigits(event.target.value).slice(0, 7))} placeholder="Max ₹" className="h-10 w-full min-w-0 rounded-[10px] border border-[#C9D1E3] bg-white px-3 text-[15px] text-[#0E1B3D] placeholder:text-[#6B7591] focus:border-[#0167F6] focus:outline-none focus:ring-[3px] focus:ring-[#0167F6]/15" />
                </div>
                {filters.minPay && filters.maxPay && Number(filters.minPay) > Number(filters.maxPay) && <span className="text-[13px] font-medium text-[#B42318]">The minimum is above the maximum.</span>}
              </fieldset>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setFilters({ ...EMPTY_FILTERS, search: filters.search })} disabled={filterCount === 0} className={`${SECONDARY} ${SMALL}`}>
                <RotateCcw aria-hidden="true" className="size-4" /> Reset filters
              </button>
            </div>
          </section>
        )}

        {list.length === 0 ? (
          <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-6`}>
            <p className={`m-0 ${BODY}`}>{emptyText}</p>
            {filterCount > 0 || filters.search ? (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={`${SECONDARY} ${SMALL}`}>
                Clear search and filters
              </button>
            ) : tab === 'can' && counts.away > 0 ? (
              <button type="button" onClick={() => setTab('away')} className={`${PRIMARY} ${SMALL}`}>
                See jobs 1 skill away
              </button>
            ) : (
              tab !== 'all' && (
                <button type="button" onClick={() => setTab('all')} className={`${SECONDARY} ${SMALL}`}>
                  See all jobs
                </button>
              )
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-5">
            {/* On desktop the list scrolls on its own beside the job, so the page ends with the job's details. */}
            <div className="custom-scrollbar flex min-w-0 max-w-full flex-[1_1_340px] flex-col gap-2.5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:max-w-[440px] lg:overflow-y-auto lg:pb-1 lg:pr-1.5">
              <ul aria-label="Jobs" className="m-0 flex list-none flex-col gap-2.5 p-0">
                {shown.map((job) => {
                  const on = job.id === selected?.id;
                  const company = companyOf(job);
                  return (
                    <li key={job.id}>
                      <button
                        type="button"
                        aria-current={on ? 'true' : undefined}
                        onClick={() => pick(job)}
                        className={`flex w-full flex-col gap-2 rounded-[14px] bg-white p-4 text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${on ? 'border-2 border-[#0167F6] p-[15px] shadow-[0_12px_28px_-18px_rgba(1,103,246,0.8)]' : 'border border-[#E1E5F2] hover:border-[#6378F9]'}`}
                      >
                        <span className="flex items-start gap-3">
                          <span aria-hidden="true" style={{ background: tileColor(company || job.title) }} className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-[16px] font-bold text-white">
                            {initialOf(company || job.title)}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={`text-[15px] font-bold ${INK}`}>{job.title}</span>
                            <span className={`text-[14px] ${MUTED}`}>{[company, placeText(job)].filter(Boolean).join(' · ')}</span>
                          </span>
                          <span className={`shrink-0 text-[12.5px] ${MUTED}`}>{postedText(job.createdAt)}</span>
                        </span>
                        <span className={`text-[13.5px] ${BODY}`}>{[kindText(job), payText(job)].filter(Boolean).join(' · ')}</span>
                        <StatusChip job={job} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {moreCount > 0 && (
                <button type="button" onClick={() => setPaging({ key: pageKey, extra: extra + PAGE_SIZE })} className={`${SECONDARY} h-11 w-full shrink-0`}>
                  Show {Math.min(PAGE_SIZE, moreCount)} more · {moreCount} left
                </button>
              )}
              {lockedCount > 0 && (
                <div className={`${CARD} relative flex flex-col gap-2.5 overflow-hidden p-[18px]`}>
                  <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${GRADIENT}`} />
                  <span className={`text-[15px] font-bold ${INK}`}>
                    {lockedCount} more job{lockedCount === 1 ? '' : 's'} in this list
                  </span>
                  <span className={BODY}>Free accounts see the top {FREE_PLAN_JOB_LIMIT} jobs of each list. Student Pro shows every listing, with search and filters.</span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setProOpen(true)} className={`${PRIMARY} h-10 px-4`}>
                      See Student Pro
                    </button>
                    <button type="button" onClick={() => goToTab?.('tests')} className={`${SECONDARY} h-10 px-4`}>
                      Test a new skill
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div ref={detailRef} className="min-w-0 flex-[999_1_520px] scroll-mt-20">
              {selectedLocked ? (
                <LockedDetail onUpgrade={() => setProOpen(true)} goToTab={goToTab} />
              ) : (
                selected && (
                  <JobDetail
                    key={selected.id}
                    job={selected}
                    profile={profile}
                    onOpenApply={setApplyJob}
                    onTakeTest={onTakeTest}
                    onAddSkillWithoutTest={onAddSkillWithoutTest}
                    onOpenCompanyProfile={onOpenCompanyProfile}
                    goToTab={goToTab}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>

      {applyJob && <ApplyDialog job={applyJob} profile={profile} bars={evaluateBars(applyJob, profile?.skills)} onApply={onApply} onClose={() => setApplyJob(null)} goToTab={goToTab} />}
      {proOpen && (
        <StudentProDialog
          token={token}
          user={user}
          profile={profile}
          jobsCount={jobs.length}
          onClose={() => setProOpen(false)}
          onUpgraded={() => {
            setProOpen(false);
            onPlanUpgraded?.();
            onNotify?.('Welcome to Student Pro. Every job is now open to you, with search and filters.', 'success');
          }}
        />
      )}
    </div>
  );
}
