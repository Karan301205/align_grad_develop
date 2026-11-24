import { useEffect, useMemo, useState } from 'react';
import { Loader2, Video, X } from 'lucide-react';
import ResumePdfTemplate from '../../../components/ResumePdfTemplate';
import { openPendingResumeTab, openResumePdfInNewTab } from '../../../services/resumePdf';
import { recordViewedCandidate } from '../../../utils/recentCandidateViews';
import { ACCOUNT_PAGE, CARD, MUTED, PAGE_TITLE, SECONDARY_BUTTON } from '../components/accountStyles';
import { candidateId, comparableJobs, externalResumeUrl } from './candidateData';
import useCandidateFilters from './useCandidateFilters';
import { useCandidateFacets, useCandidateProfiles, useCandidateSearch } from './useCandidates';
import CandidateProfileDrawer from '../components/CandidateProfileDrawer';
import FiltersCard from './components/FiltersCard';
import CandidateCard from './components/CandidateCard';
import CandidateDossier from './components/CandidateDossier';

const PAGE_SIZE = 20;
const NO_EDUCATION = { colleges: [], degrees: [], years: [] };
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

function Notice({ tone = 'error', children, action }) {
  const tones = { error: 'border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]', info: 'border-[#E4E6EA] bg-white text-[#334155]' };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex flex-wrap items-center justify-between gap-2 rounded-[10px] border px-4 py-3 ${tones[tone]}`}>
      <span>{children}</span>
      {action}
    </div>
  );
}

function ProjectVideo({ video, onClose }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={video.title || 'Project video'} className={`${CARD} flex w-full max-w-3xl flex-col gap-3 p-4 sm:p-5`} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-semibold">
            <Video className="size-4 text-[#0F7A55]" aria-hidden="true" />
            {video.title || 'Project demo'}
          </span>
          <button type="button" onClick={onClose} aria-label="Close video" className="rounded-[8px] p-1.5 text-[#4B5563] hover:bg-[#F4F8F6]">
            <X className="size-4" />
          </button>
        </div>
        <div className="aspect-video overflow-hidden rounded-[10px] bg-black">
          <video src={video.url} controls autoPlay className="size-full object-contain" />
        </div>
      </div>
    </div>
  );
}

/**
 * Candidates (design: design/Candidates — talent search matched to a job-html). Search, filters,
 * sort, the recommended order and "Compare with job" run on the server
 * (POST /recruiter/candidates/search), which returns 20 cards at a time; "Load more" asks for the
 * next 20. The selected candidate's full profile comes from GET /recruiter/candidates/:id, and the
 * filter menus from GET /recruiter/candidates/facets. The recruiter's jobs come from the layout.
 */
export default function CandidatesPage({ jobs, token, setAlertConfig }) {
  const [compareJobId, setCompareJobId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [resumeCandidate, setResumeCandidate] = useState(null);
  const [projectVideo, setProjectVideo] = useState(null);
  const [profileCandidate, setProfileCandidate] = useState(null);

  const compareJobs = useMemo(() => comparableJobs(jobs), [jobs]);
  const job = compareJobs.find((item) => item.id === compareJobId) || null;
  const filter = useCandidateFilters({ compareJobId: job ? job.id : '' });
  const request = useMemo(() => ({ ...filter.request, pageSize: PAGE_SIZE }), [filter.request]);
  const search = useCandidateSearch(token, request);
  const facets = useCandidateFacets(token);
  const profiles = useCandidateProfiles(token);

  const results = search.items;
  const totalCount = facets.data?.total ?? 0;
  const active = results.find((cand) => candidateId(cand) === selectedId) || results[0] || null;
  const activeId = active ? candidateId(active) : null;
  const activeEntry = activeId ? profiles.entries[activeId] : null;
  // The panel shows the full profile, with this search's comparison bars and match %.
  const activeProfile = activeEntry?.data ? { ...activeEntry.data, comparison: active.comparison, matchScore: active.matchScore } : null;
  const isRecommendedOrder = filter.filters.sort === 'recommended' && filter.isUnfiltered && search.recommended;
  const loading = search.status === 'loading';

  const { load: loadProfile } = profiles;
  useEffect(() => {
    if (activeId) loadProfile(activeId).catch(() => {});
  }, [activeId, loadProfile]);

  const select = (cand) => {
    setSelectedId(candidateId(cand));
    recordViewedCandidate(cand);
  };

  // Drive/Docs/Dropbox links open directly; otherwise the standard resume is built from the full
  // profile. The tab opens on the click itself (pop-up blockers), then the profile loads.
  const openResume = async (event, cand) => {
    event?.stopPropagation?.();
    const external = externalResumeUrl(cand);
    if (external) {
      window.open(external, '_blank', 'noopener,noreferrer');
      return;
    }
    const id = candidateId(cand);
    const tab = openPendingResumeTab(`${cand.name || 'Candidate'}_Resume`);
    setGeneratingId(id);
    try {
      const full = await loadProfile(id);
      setResumeCandidate(full);
      await nextFrame();
      const element = document.getElementById(`candidates-page-resume-${id}`);
      if (!element) throw new Error('The resume layout was not ready.');
      await openResumePdfInNewTab(element, `${cand.name || 'Candidate'}_Resume`, tab);
    } catch (err) {
      if (tab && !tab.closed) tab.close();
      console.error('[resume] Could not open the resume PDF:', err);
      setAlertConfig({ message: 'Couldn’t open the resume. Allow pop-ups for AlignGrad and try again.', type: 'error' });
    } finally {
      setGeneratingId(null);
      setResumeCandidate(null);
    }
  };

  const viewProfile = () => {
    if (activeProfile) setProfileCandidate(activeProfile);
  };

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
        <header className="flex flex-col gap-1">
          <h1 className={PAGE_TITLE}>
            <span className="font-bold">Candidates</span>
          </h1>
          <p className={`m-0 text-[15px] ${MUTED}`}>Candidates on AlignGrad. Pick one of your jobs to see who already meets its bars.</p>
        </header>

        <FiltersCard
          filter={filter}
          skillCounts={facets.data?.skillCounts || {}}
          popularSkills={facets.data?.popularSkills || []}
          education={facets.data?.education || NO_EDUCATION}
          jobs={compareJobs}
          compareJobId={compareJobId}
          onCompareJob={setCompareJobId}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((open) => !open)}
          shownCount={search.total}
          totalCount={totalCount}
        />

        {facets.status === 'error' && (
          <Notice tone="info" action={<button type="button" onClick={facets.retry} className={`${SECONDARY_BUTTON} h-9 px-3`}>Try again</button>}>
            Couldn’t load the skill and college lists for the filters. {facets.error}
          </Notice>
        )}

        {search.status === 'error' ? (
          <Notice action={<button type="button" onClick={search.retry} className={`${SECONDARY_BUTTON} h-9 px-3`}>Try again</button>}>
            Couldn’t load candidates. {search.error}
          </Notice>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2 text-[15px]">
                {loading && <Loader2 className="size-4 animate-spin text-[#0F7A55]" aria-label="Updating" />}
                <strong className="font-bold">
                  {search.total.toLocaleString('en-IN')} candidate{search.total === 1 ? '' : 's'}
                </strong>{' '}
                <span className={MUTED}>
                  {job
                    ? filter.filters.onlyMeets
                      ? `meet all bars for ${job.title}`
                      : `compared with ${job.title} · ${(search.meetsCount ?? 0).toLocaleString('en-IN')} meet all bars`
                    : isRecommendedOrder
                      ? 'in recommended order for your active jobs'
                      : ''}
                </span>
              </span>
              {job && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={filter.filters.onlyMeets}
                      onChange={(event) => filter.set('onlyMeets')(event.target.checked)}
                      className="size-[18px] accent-[#0F7A55]"
                    />
                    Only people who meet all bars
                  </label>
                <span className={`flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] ${MUTED}`}>
                  {[
                    ['bg-[#E3F1EE] border-[#BFE0D8]', 'above bar'],
                    ['bg-[#F1F3F6] border-[#D5D9E0]', 'meets bar'],
                    ['bg-[#FFF1E8] border-[#FED7AA]', 'below bar']
                  ].map(([swatch, label]) => (
                    <span key={label} className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className={`size-3 rounded-[3px] border ${swatch}`} />
                      {label}
                    </span>
                  ))}
                </span>
                </div>
              )}
            </div>


            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <div className={`flex w-full min-w-0 flex-col gap-2 transition-opacity lg:w-[360px] lg:shrink-0 xl:w-[400px] ${loading && results.length > 0 ? 'opacity-60' : ''}`} aria-busy={loading}>
                {results.length === 0 ? (
                  <div className={`${CARD} flex flex-col items-center gap-1 px-6 py-10 text-center`}>
                    {loading ? (
                      <span className={`inline-flex items-center gap-2 ${MUTED}`}>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading candidates…
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold">No candidates found</span>
                        <span className={MUTED}>{facets.status === 'ready' && totalCount === 0 ? 'No candidate profiles yet.' : 'Try fewer filters or a different search.'}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <ul aria-label="Candidates" className="m-0 flex list-none flex-col gap-2 p-0">
                    {results.map((cand) => (
                      <CandidateCard
                        key={candidateId(cand)}
                        cand={cand}
                        selected={active && candidateId(active) === candidateId(cand)}
                        onSelect={() => select(cand)}
                        onResume={(event) => openResume(event, cand)}
                        generating={generatingId === candidateId(cand)}
                        filteredSkills={filter.filters.skills}
                      />
                    ))}
                  </ul>
                )}
                {search.hasMore && (
                  <button type="button" onClick={search.loadMore} disabled={search.loadingMore} className={`${SECONDARY_BUTTON} h-11 disabled:opacity-60`}>
                    {search.loadingMore ? 'Loading…' : `Load more (${(search.total - results.length).toLocaleString('en-IN')} left)`}
                  </button>
                )}
                {search.moreError && (
                  <Notice action={<button type="button" onClick={search.loadMore} className={`${SECONDARY_BUTTON} h-9 px-3`}>Try again</button>}>
                    Couldn’t load more candidates. {search.moreError}
                  </Notice>
                )}
              </div>

              <div className="min-w-0 flex-1 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:rounded-[12px]">
                {active && activeEntry?.status === 'error' ? (
                  <Notice action={<button type="button" onClick={() => loadProfile(activeId).catch(() => {})} className={`${SECONDARY_BUTTON} h-9 px-3`}>Try again</button>}>
                    Couldn’t load {active.name ? `${active.name}’s` : 'this'} profile. {activeEntry.error}
                  </Notice>
                ) : active && !activeProfile ? (
                  <section aria-label="Selected candidate" aria-busy="true" className={`${CARD} flex items-center justify-center gap-2 p-10 ${MUTED}`}>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading {active.name ? `${active.name}’s` : 'the'} profile…
                  </section>
                ) : (
                  <CandidateDossier cand={activeProfile} job={job} onViewProfile={viewProfile} onPlayProjectVideo={setProjectVideo} />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Off-screen resume layout for the resume being built (full profile), used to make the PDF. */}
      {resumeCandidate && <ResumePdfTemplate id={`candidates-page-resume-${candidateId(resumeCandidate)}`} candidate={resumeCandidate} />}

      {projectVideo && <ProjectVideo video={projectVideo} onClose={() => setProjectVideo(null)} />}

      {/* "View profile": the full candidate profile used across the recruiter portal (resume download inside). */}
      <CandidateProfileDrawer candidate={profileCandidate} job={job} onClose={() => setProfileCandidate(null)} />
    </div>
  );
}
