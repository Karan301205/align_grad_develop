import { useMemo, useState } from 'react';
import { Video, X } from 'lucide-react';
import ResumePdfTemplate from '../../../components/ResumePdfTemplate';
import { openResumePdfInNewTab } from '../../../services/resumePdf';
import { recordViewedCandidate } from '../../../utils/recentCandidateViews';
import { ACCOUNT_PAGE, CARD, MUTED, PAGE_TITLE, SECONDARY_BUTTON } from '../components/accountStyles';
import useEligiblePool from '../postJob/useEligiblePool';
import { candidateId, comparableJobs, educationOptions, externalResumeUrl, skillName } from './candidateData';
import useCandidateFilters from './useCandidateFilters';
import CandidateProfileModal from '../components/CandidateProfileModal';
import FiltersCard from './components/FiltersCard';
import CandidateCard from './components/CandidateCard';
import CandidateDossier from './components/CandidateDossier';

const PAGE_SIZE = 20;
const NO_BARS = [];

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
            <Video className="size-4 text-[#1447E6]" aria-hidden="true" />
            {video.title || 'Project demo'}
          </span>
          <button type="button" onClick={onClose} aria-label="Close video" className="rounded-[8px] p-1.5 text-[#4B5563] hover:bg-[#F8F8F6]">
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
 * Candidates (design: design/Candidates — talent search matched to a job-html), keeping
 * everything the previous talent directory did. Data: candidates and the recommended
 * order from the layout (GET /recruiter/candidates, /recruiter/top-talents), the
 * recruiter's jobs for "Compare with job", and which bars have a skill test from
 * POST /recruiter/jobs/eligible-count.
 */
export default function CandidatesPage({ candidates = [], loadError, topTalents, topTalentsError, jobs, token, setAlertConfig, onRetry }) {
  const [compareJobId, setCompareJobId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState({ key: '', count: PAGE_SIZE });
  const [generatingId, setGeneratingId] = useState(null);
  const [projectVideo, setProjectVideo] = useState(null);
  const [profileCandidate, setProfileCandidate] = useState(null);

  const compareJobs = useMemo(() => comparableJobs(jobs), [jobs]);
  const job = compareJobs.find((item) => item.id === compareJobId) || null;
  const pool = useEligiblePool(token, job ? job.requirements : NO_BARS);
  const comparison = useMemo(() => {
    if (!job) return null;
    return { job, gatesBySkill: new Map((pool.data?.requirements || []).map((req) => [req.skillName, req.gates])) };
  }, [job, pool.data]);
  const filter = useCandidateFilters({ candidates, topTalents, comparison });

  const { skillCounts, popularSkills } = useMemo(() => {
    const counts = {};
    candidates.forEach((cand) => (cand.skills || []).forEach((skill) => {
      const name = skillName(skill);
      if (name) counts[name] = (counts[name] || 0) + 1;
    }));
    return { skillCounts: counts, popularSkills: Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 8) };
  }, [candidates]);
  const education = useMemo(() => educationOptions(candidates), [candidates]);

  // "Load more": the page restarts whenever the filters or the compared job change.
  const pageKey = JSON.stringify([filter.filters, compareJobId]);
  const visibleCount = page.key === pageKey ? page.count : PAGE_SIZE;
  const results = filter.results;
  const visible = results.slice(0, visibleCount);
  const active = results.find((cand) => candidateId(cand) === selectedId) || results[0] || null;
  const meetsCount = job ? results.filter((cand) => cand.comparison?.meetsAll).length : 0;

  const select = (cand) => {
    setSelectedId(candidateId(cand));
    recordViewedCandidate(cand);
  };

  // Drive/Docs/Dropbox links open directly; otherwise the standard resume is built from the profile.
  const openResume = async (event, cand) => {
    event?.stopPropagation?.();
    const external = externalResumeUrl(cand);
    if (external) {
      window.open(external, '_blank', 'noopener,noreferrer');
      return;
    }
    const element = document.getElementById(`candidates-page-resume-${candidateId(cand)}`);
    if (!element) {
      setAlertConfig({ message: 'The resume is still being prepared. Please try again in a moment.', type: 'warning' });
      return;
    }
    setGeneratingId(candidateId(cand));
    try {
      await openResumePdfInNewTab(element, `${cand.name || 'Candidate'}_Resume`);
    } catch (err) {
      console.error('[resume] Could not open the resume PDF:', err);
      setAlertConfig({ message: 'Couldn’t open the resume. Allow pop-ups for AlignGrad and try again.', type: 'error' });
    } finally {
      setGeneratingId(null);
    }
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
          skillCounts={skillCounts}
          popularSkills={popularSkills}
          education={education}
          jobs={compareJobs}
          compareJobId={compareJobId}
          onCompareJob={setCompareJobId}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((open) => !open)}
          shownCount={results.length}
          totalCount={candidates.length}
        />

        {loadError ? (
          <Notice action={<button type="button" onClick={onRetry} className={`${SECONDARY_BUTTON} h-9 px-3`}>Try again</button>}>
            Couldn’t load candidates. {loadError}
          </Notice>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span className="text-[15px]">
                <strong className="font-bold">
                  {results.length.toLocaleString('en-IN')} candidate{results.length === 1 ? '' : 's'}
                </strong>{' '}
                <span className={MUTED}>
                  {job
                    ? filter.filters.onlyMeets
                      ? `meet all bars for ${job.title}`
                      : `compared with ${job.title} · ${meetsCount.toLocaleString('en-IN')} meet all bars`
                    : filter.isRecommendedOrder
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
                      className="size-[18px] accent-[#1447E6]"
                    />
                    Only people who meet all bars
                  </label>
                <span className={`flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] ${MUTED}`}>
                  {[
                    ['bg-[#EEF2FE] border-[#C7D4FB]', 'above bar'],
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

            {job && pool.status === 'error' && (
              <Notice action={<button type="button" onClick={pool.retry} className={`${SECONDARY_BUTTON} h-9 px-3`}>Try again</button>}>
                Couldn’t check which skills have a test ({pool.error}). Until it loads, every bar counts.
              </Notice>
            )}
            {!job && topTalentsError && <Notice tone="info">Recommended order isn’t available right now: {topTalentsError}</Notice>}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <div className="flex w-full min-w-0 flex-col gap-2 lg:w-[360px] lg:shrink-0 xl:w-[400px]">
                {results.length === 0 ? (
                  <div className={`${CARD} flex flex-col items-center gap-1 px-6 py-10 text-center`}>
                    <span className="font-semibold">No candidates found</span>
                    <span className={MUTED}>{candidates.length === 0 ? 'No candidate profiles yet.' : 'Try fewer filters or a different search.'}</span>
                  </div>
                ) : (
                  <ul aria-label="Candidates" className="m-0 flex list-none flex-col gap-2 p-0">
                    {visible.map((cand) => (
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
                {results.length > visibleCount && (
                  <button type="button" onClick={() => setPage({ key: pageKey, count: visibleCount + PAGE_SIZE })} className={`${SECONDARY_BUTTON} h-11`}>
                    Load more ({(results.length - visibleCount).toLocaleString('en-IN')} left)
                  </button>
                )}
              </div>

              <div className="min-w-0 flex-1 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:rounded-[12px]">
                <CandidateDossier cand={active} job={job} onViewProfile={() => setProfileCandidate(active)} onPlayProjectVideo={setProjectVideo} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Off-screen resume layouts for the cards on screen, used to build the PDF. */}
      {visible.map((cand) => (
        <ResumePdfTemplate key={`template-${candidateId(cand)}`} id={`candidates-page-resume-${candidateId(cand)}`} candidate={cand} />
      ))}

      {projectVideo && <ProjectVideo video={projectVideo} onClose={() => setProjectVideo(null)} />}

      {/* "View profile": the full candidate profile used across the recruiter portal (resume download inside). */}
      <CandidateProfileModal candidate={profileCandidate} job={job} onClose={() => setProfileCandidate(null)} />
    </div>
  );
}
