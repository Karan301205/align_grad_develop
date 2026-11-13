import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { SERVER_MESSAGE, apiFetch, userMessage } from '../../../services/apiClient';
import { FREE_PLAN_GIG_LIMIT } from '../../../utils/jobAccess';
import { SkillFilter } from '../jobs/JobsPage';
import StudentProDialog from '../profile/dialogs/StudentProDialog';
import { cleanDigits, cleanLine } from '../profile/profileRules';
import { BODY, CARD, GRADIENT, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY, SMALL } from '../profile/profileTheme';
import { Checkbox, ComboInput, Dropdown, Spinner } from '../profile/ui';
import GigDetail, { LockedGig, PitchSent } from './GigDetail';
import MyGigs from './MyGigs';
import {
  BUDGET_PRESETS,
  DELIVERY,
  EMPTY_FILTERS,
  GIG_CATEGORIES,
  LEVELS,
  SORTS,
  TABS,
  activeCount,
  activeFilterCount,
  budgetText,
  companyOf,
  deliveryText,
  gapText,
  gigStatus,
  inTab,
  matchesFilters,
  pitchCountText,
  postedLower,
  sortGigs,
  tabFor
} from './gigsData';

const MY_GIGS_REFRESH_MS = 30000; // hires and approvals, while "My gigs" is open and visible
const PILL_ON = 'border-transparent bg-[linear-gradient(135deg,#0E1B3D_0%,#1E3A8A_60%,#5B3FD0_100%)] text-white shadow-[0_8px_18px_-10px_rgba(30,58,138,0.9)]';
const PILL_OFF = 'border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9]';
const NUMBER_FIELD = 'h-10 w-full min-w-0 rounded-[10px] border border-[#C9D1E3] bg-white px-3 text-[15px] text-[#0E1B3D] placeholder:text-[#6B7591] focus:border-[#0167F6] focus:outline-none focus:ring-[3px] focus:ring-[#0167F6]/15';

function StatusChip({ gig }) {
  const status = gigStatus(gig);
  if (status === 'pitched') return <span className="self-start rounded-[6px] bg-[#E3F5EE] px-2 py-[3px] text-[12.5px] font-bold text-[#0B5E41]">Pitched</span>;
  if (status === 'can') return <span className="self-start rounded-[6px] bg-[#E8EEFF] px-2 py-[3px] text-[12.5px] font-bold text-[#0B3FA8]">You can pitch</span>;
  if (status === 'away') return <span className="self-start rounded-[6px] bg-[#FFF3E8] px-2 py-[3px] text-[12.5px] font-bold text-[#9A3412]">1 skill away · {gapText(gig.missingRequirements[0])}</span>;
  return <span className="self-start rounded-[6px] bg-[#F1ECFF] px-2 py-[3px] text-[12.5px] font-bold text-[#5B2AA6]">{gig.missingRequirements.length} skill bars to meet</span>;
}

/** Reads a list endpoint; resolves to { data } or { error } (details go to the console). */
async function readList(path, token, fallback) {
  try {
    const res = await apiFetch(path, { token });
    const body = await res.json().catch(() => null);
    if (res.ok && Array.isArray(body)) return { data: body };
    return { error: res.status >= 500 || !body?.error ? fallback : body.error };
  } catch (err) {
    return { error: userMessage(err, fallback) };
  }
}

/**
 * Candidate Gigs (design: candidate_gig_design): Browse (tabs, the previous page's
 * search and filters for Student Pro, the list and the selected gig with the pitch)
 * and My gigs (pitches, work in progress with the chat, finished gigs). `focus` is a
 * new object each time another page links here: { view } or { id } of a gig.
 */
export default function GigsPage({ profile, user, token, isPremium, jobsCount, focus, onTakeTest, onAddSkillWithoutTest, onOpenCompanyProfile, goToTab, onPlanUpgraded, onNotify }) {
  const [view, setView] = useState(focus?.view === 'mine' ? 'mine' : 'browse');
  const [handledFocus, setHandledFocus] = useState(focus);
  const [pendingId, setPendingId] = useState(focus?.id || null);
  const [gigs, setGigs] = useState({ data: [], loaded: false, error: '' });
  const [mine, setMine] = useState({ data: [], loaded: false, error: '' });
  const [tab, setTab] = useState('can');
  const [selectedId, setSelectedId] = useState(null);
  const [mySelectedId, setMySelectedId] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [pitched, setPitched] = useState(null); // the gig just pitched for ("Pitch sent")
  const [gone, setGone] = useState(false); // a linked gig that isn't open any more
  const detailRef = useRef(null);
  const myIds = useMemo(() => [user?.id, profile?.userId, profile?.id].filter(Boolean), [user?.id, profile?.userId, profile?.id]);

  const loadGigs = useCallback(async () => {
    const result = await readList('/gigs', token, 'Gigs couldn’t be loaded. Try again.');
    setGigs((prev) => ({ data: result.data || prev.data, loaded: true, error: result.error || '' }));
  }, [token]);
  const loadMine = useCallback(async () => {
    const result = await readList('/gigs/my-gigs', token, 'Your gigs couldn’t be loaded. Try again.');
    setMine((prev) => ({ data: result.data || prev.data, loaded: true, error: result.error || '' }));
  }, [token]);

  useEffect(() => {
    const first = setTimeout(() => {
      loadGigs();
      loadMine();
    }, 0);
    return () => clearTimeout(first);
  }, [loadGigs, loadMine]);

  useEffect(() => {
    if (view !== 'mine') return undefined;
    const timer = setInterval(() => {
      if (!document.hidden) loadMine();
    }, MY_GIGS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [view, loadMine]);

  // A new link into the page while it's open (sidebar, a company page's gig).
  if (focus !== handledFocus) {
    setHandledFocus(focus);
    setView(focus?.view === 'mine' ? 'mine' : 'browse');
    setPendingId(focus?.id || null);
    setPitched(null);
    setGone(false);
  }
  // A gig asked for by id opens once both lists are in: in My gigs if the candidate
  // pitched or works on it, otherwise in Browse.
  if (pendingId && gigs.loaded && mine.loaded) {
    setPendingId(null);
    const inMine = mine.data.find((gig) => gig.id === pendingId);
    const inBrowse = gigs.data.find((gig) => gig.id === pendingId);
    if (inMine) {
      setView('mine');
      setMySelectedId(inMine.id);
    } else if (inBrowse) {
      setView('browse');
      setTab(tabFor(inBrowse));
      setSelectedId(inBrowse.id);
      setFilters(EMPTY_FILTERS);
    } else {
      setGone(true);
    }
  }

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const filtered = useMemo(() => gigs.data.filter((gig) => matchesFilters(gig, filters)), [gigs.data, filters]);
  const counts = Object.fromEntries(TABS.map((item) => [item.id, filtered.filter((gig) => inTab(gig, item.id)).length]));
  const list = useMemo(() => sortGigs(filtered.filter((gig) => inTab(gig, tab)), filters.sort), [filtered, tab, filters.sort]);
  const free = !isPremium;
  const visible = free ? list.slice(0, FREE_PLAN_GIG_LIMIT) : list;
  const lockedCount = list.length - visible.length;
  const selected = list.find((gig) => gig.id === selectedId) || visible[0] || null;
  const selectedLocked = Boolean(selected && free && !visible.includes(selected));
  const filterCount = activeFilterCount(filters);
  const showPitched = pitched && pitched.id === selectedId;

  const pick = (gig) => {
    setSelectedId(gig.id);
    setPitched(null);
    if (window.innerWidth < 1024) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const showMine = (gigId) => {
    setView('mine');
    setPitched(null);
    if (gigId) setMySelectedId(gigId);
  };

  const pitch = (gig) => async (body) => {
    try {
      const res = await apiFetch(`/gigs/${gig.id}/apply`, { token, method: 'POST', json: body });
      const reply = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: res.status >= 500 ? 'Your pitch couldn’t be sent. Try again.' : reply.error || SERVER_MESSAGE };
      setSelectedId(gig.id);
      setPitched(gig);
      await Promise.all([loadGigs(), loadMine()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: userMessage(err, 'Your pitch couldn’t be sent. Try again.') };
    }
  };

  const emptyText = {
    can: 'No gig matches all your skill bars yet. Raise a score to open one up.',
    away: 'No gig is just one skill away right now.',
    all: filterCount > 0 || filters.search ? 'No gigs match these filters.' : 'No gigs are open right now.'
  }[tab];

  let browseBody;
  if (!gigs.loaded) {
    browseBody = (
      <div className={`${CARD} flex items-center justify-center gap-3 p-10 ${BODY}`} role="status">
        <Spinner className="size-5 text-[#0167F6]" /> Loading gigs…
      </div>
    );
  } else if (gigs.error && gigs.data.length === 0) {
    browseBody = (
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-6`}>
        <p role="alert" className="m-0 font-medium text-[#8C1D14]">
          {gigs.error}
        </p>
        <button type="button" onClick={loadGigs} className={`${SECONDARY} ${SMALL}`}>
          <RotateCcw aria-hidden="true" className="size-4" /> Try again
        </button>
      </div>
    );
  } else if (list.length === 0 && !showPitched) {
    browseBody = (
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-6`}>
        <p className={`m-0 ${BODY}`}>{emptyText}</p>
        {filterCount > 0 || filters.search ? (
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={`${SECONDARY} ${SMALL}`}>
            Clear search and filters
          </button>
        ) : tab === 'can' && counts.away > 0 ? (
          <button type="button" onClick={() => setTab('away')} className={`${PRIMARY} ${SMALL}`}>
            See gigs 1 skill away
          </button>
        ) : (
          tab !== 'all' && (
            <button type="button" onClick={() => setTab('all')} className={`${SECONDARY} ${SMALL}`}>
              See all gigs
            </button>
          )
        )}
      </div>
    );
  } else {
    browseBody = (
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 max-w-full flex-[1_1_340px] flex-col gap-2.5 lg:max-w-[440px]">
          <ul aria-label="Gigs" className="m-0 flex list-none flex-col gap-2.5 p-0">
            {visible.map((gig) => {
              const on = gig.id === selected?.id && !showPitched;
              return (
                <li key={gig.id}>
                  <button
                    type="button"
                    aria-current={on ? 'true' : undefined}
                    onClick={() => pick(gig)}
                    className={`flex w-full flex-col gap-2 rounded-[14px] bg-white p-4 text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${on ? 'border-2 border-[#0167F6] p-[15px] shadow-[0_12px_28px_-18px_rgba(1,103,246,0.8)]' : 'border border-[#E1E5F2] hover:border-[#6378F9]'}`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 flex-col">
                        <span className={`text-[15px] font-bold ${INK}`}>{gig.title}</span>
                        <span className={`text-[14px] ${MUTED}`}>{[companyOf(gig), postedLower(gig.createdAt)].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className={`shrink-0 text-[16px] font-bold ${INK}`}>{budgetText(gig)}</span>
                    </span>
                    <span className={`text-[13.5px] ${BODY}`}>{[deliveryText(gig) && `Deliver in ${deliveryText(gig)}`, pitchCountText(gig.pitchCount)].filter(Boolean).join(' · ')}</span>
                    <StatusChip gig={gig} />
                  </button>
                </li>
              );
            })}
          </ul>
          {lockedCount > 0 && (
            <div className={`${CARD} relative flex flex-col gap-2.5 overflow-hidden p-[18px]`}>
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${GRADIENT}`} />
              <span className={`text-[15px] font-bold ${INK}`}>
                {lockedCount} more gig{lockedCount === 1 ? '' : 's'} in this list
              </span>
              <span className={BODY}>Free accounts see the top {FREE_PLAN_GIG_LIMIT} gigs of each list. Student Pro shows every gig, with search and filters.</span>
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
          {showPitched ? (
            <PitchSent gig={pitched} onShowMine={() => showMine(pitched.id)} onBack={() => setPitched(null)} />
          ) : selectedLocked ? (
            <LockedGig onUpgrade={() => setProOpen(true)} goToTab={goToTab} />
          ) : (
            selected && (
              <GigDetail
                key={selected.id}
                gig={selected}
                profile={profile}
                token={token}
                onPitch={pitch(selected)}
                onTakeTest={onTakeTest}
                onAddSkillWithoutTest={onAddSkillWithoutTest}
                onOpenCompanyProfile={onOpenCompanyProfile}
                goToTab={goToTab}
                onShowMine={() => showMine(selected.id)}
              />
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-1">
            <h1 className="m-0 text-[28px] leading-tight">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>Gigs</span>
            </h1>
            <p className={`m-0 text-[15.5px] ${MUTED}`}>{view === 'mine' ? 'Your pitches and the work you’ve been picked for.' : 'Short paid tasks from companies. Pitch for the ones that fit your skills.'}</p>
          </div>
          <div role="group" aria-label="Gigs view" className="flex rounded-[12px] bg-[#DCE4FB] p-1">
            {[
              ['browse', 'Browse'],
              ['mine', 'My gigs']
            ].map(([id, label]) => {
              const on = view === id;
              const count = id === 'mine' ? activeCount(mine.data) : 0;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setView(id);
                    setPitched(null);
                  }}
                  className={`inline-flex h-10 items-center gap-2 rounded-[9px] px-4 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${on ? 'bg-white text-[#0B3FA8] shadow-[0_2px_6px_rgba(14,27,61,0.18)]' : 'text-[#1B2B55] hover:bg-white/50'}`}
                >
                  {label}
                  {count > 0 && <span className="min-w-[22px] rounded-full bg-[#0167F6] px-1.5 text-center text-[12px] font-bold text-white">{count}</span>}
                </button>
              );
            })}
          </div>
        </header>

        {view === 'mine' ? (
          <MyGigs
            myGigs={mine.data}
            loading={!mine.loaded}
            error={mine.error}
            onRetry={loadMine}
            selectedId={mySelectedId}
            onSelect={setMySelectedId}
            token={token}
            myIds={myIds}
            onListChanged={loadMine}
            onBrowse={() => setView('browse')}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
                {TABS.map((item) => {
                  const on = item.id === tab;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setTab(item.id);
                        setPitched(null);
                      }}
                      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${on ? PILL_ON : PILL_OFF}`}
                    >
                      {item.label}
                      <span className={`min-w-[22px] rounded-full px-1.5 text-center text-[12px] font-bold ${on ? 'bg-white/20 text-white' : 'bg-[#E8EEFF] text-[#0B3FA8]'}`}>{counts[item.id]}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex min-w-0 flex-[0_1_520px] items-center justify-end gap-2.5">
                {isPremium ? (
                  <label className="relative flex h-10 min-w-0 flex-1 items-center">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 size-[18px] text-[#475373]" />
                    <span className="sr-only">Search gigs</span>
                    <input
                      type="search"
                      value={filters.search}
                      maxLength={80}
                      onChange={(event) => set('search')(cleanLine(event.target.value))}
                      placeholder="Search by title, skill, field or company"
                      className="h-10 w-full rounded-[10px] border border-[#C9D1E3] bg-white pl-10 pr-3.5 text-[15px] text-[#0E1B3D] placeholder:text-[#6B7591] hover:border-[#9AA6C8] focus:border-[#0167F6] focus:outline-none focus:ring-[3px] focus:ring-[#0167F6]/15"
                    />
                  </label>
                ) : (
                  <button type="button" onClick={() => setProOpen(true)} className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-[#C9D1E3] bg-white px-3.5 text-left text-[15px] text-[#475373] hover:border-[#6378F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]">
                    <Search aria-hidden="true" className="size-[18px] shrink-0" />
                    <span className="flex-1 truncate">Search gigs</span>
                    <span className="rounded-[6px] bg-[#F1ECFF] px-2 py-0.5 text-[12px] font-bold text-[#5B2AA6]">Pro</span>
                  </button>
                )}
                <button type="button" aria-expanded={isPremium ? filtersOpen : undefined} onClick={() => (isPremium ? setFiltersOpen((open) => !open) : setProOpen(true))} className={`${SECONDARY} h-10 shrink-0 px-3.5`}>
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
                    <label htmlFor="gigs-sort" className={`text-[14px] font-semibold ${INK}`}>
                      Sort by
                    </label>
                    <Dropdown id="gigs-sort" value={filters.sort} onChange={set('sort')} options={SORTS} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="gigs-field" className={`text-[14px] font-semibold ${INK}`}>
                      Field
                    </label>
                    <ComboInput id="gigs-field" value={filters.category} onChange={set('category')} onPick={set('category')} suggestions={GIG_CATEGORIES} clean={cleanLine} placeholder="e.g. Data Analytics" maxLength={60} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="gigs-delivery" className={`text-[14px] font-semibold ${INK}`}>
                      Delivery time
                    </label>
                    <Dropdown id="gigs-delivery" value={filters.delivery} onChange={set('delivery')} options={DELIVERY} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="gigs-level" className={`text-[14px] font-semibold ${INK}`}>
                      Skill level asked
                    </label>
                    <Dropdown id="gigs-level" value={filters.level} onChange={set('level')} options={LEVELS} />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                  <SkillFilter id="gigs-skill" value={filters.skills} onChange={set('skills')} />
                  <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
                    <legend className={`mb-1.5 p-0 text-[14px] font-semibold ${INK}`}>Budget</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {BUDGET_PRESETS.map((preset) => {
                        const on = filters.minBudget === preset.min && filters.maxBudget === preset.max;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setFilters((prev) => ({ ...prev, minBudget: on ? '' : preset.min, maxBudget: on ? '' : preset.max }))}
                            className={`h-9 rounded-full border px-3 text-[13.5px] font-semibold ${on ? 'border-[#0167F6] bg-[#0167F6] text-white' : 'border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9]'}`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <input aria-label="Minimum budget" inputMode="numeric" value={filters.minBudget} onChange={(event) => set('minBudget')(cleanDigits(event.target.value).slice(0, 8))} placeholder="Min ₹" className={NUMBER_FIELD} />
                      <span className={MUTED}>to</span>
                      <input aria-label="Maximum budget" inputMode="numeric" value={filters.maxBudget} onChange={(event) => set('maxBudget')(cleanDigits(event.target.value).slice(0, 8))} placeholder="Max ₹" className={NUMBER_FIELD} />
                    </div>
                    {filters.minBudget && filters.maxBudget && Number(filters.minBudget) > Number(filters.maxBudget) && <span className="text-[13px] font-medium text-[#B42318]">The minimum is above the maximum.</span>}
                  </fieldset>
                  <div className="flex flex-col justify-between gap-3">
                    <Checkbox id="gigs-verified" checked={filters.verifiedOnly} onChange={set('verifiedOnly')}>
                      Verified companies only
                    </Checkbox>
                    <button type="button" onClick={() => setFilters({ ...EMPTY_FILTERS, search: filters.search })} disabled={filterCount === 0} className={`${SECONDARY} ${SMALL}`}>
                      <RotateCcw aria-hidden="true" className="size-4" /> Reset filters
                    </button>
                  </div>
                </div>
              </section>
            )}

            {gone && <p className="m-0 rounded-[12px] bg-[#EEF0F6] px-3.5 py-3 font-semibold text-[#3B4A6B]">That gig isn’t open any more.</p>}
            {gigs.error && gigs.data.length > 0 && (
              <p role="alert" className="m-0 rounded-[12px] border border-[#F3C5C0] bg-[#FFF5F4] px-3.5 py-3 text-[14px] font-medium text-[#8C1D14]">
                {gigs.error}
              </p>
            )}
            {browseBody}
          </>
        )}
      </div>

      {proOpen && (
        <StudentProDialog
          token={token}
          user={user}
          profile={profile}
          jobsCount={jobsCount}
          onClose={() => setProOpen(false)}
          onUpgraded={() => {
            setProOpen(false);
            onPlanUpgraded?.();
            onNotify?.('Welcome to Student Pro. Every gig is now open to you, with search and filters.', 'success');
          }}
        />
      )}
    </div>
  );
}
