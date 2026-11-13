import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { formatViewedTime, getRecentlyViewedCandidates } from '../../../utils/recentCandidateViews';
import { ACCOUNT_PAGE, MUTED, PAGE_TITLE } from '../components/accountStyles';
import CandidateProfileModal from '../components/CandidateProfileModal';
import useJobCredits from '../postJob/useJobCredits';
import { candidateId, educationLine } from '../candidates/candidateData';
import { attentionItems, dashboardMetrics, greeting, liveJobs } from './dashboardData';
import MetricCards from './components/MetricCards';
import AttentionCard from './components/AttentionCard';
import ActiveJobsCard from './components/ActiveJobsCard';
import PeopleCard from './components/PeopleCard';
import CreditsCard from './components/CreditsCard';

const RECENT_LIMIT = 6;
const TOP_MATCH_LIMIT = 5;

const matches = (query, ...fields) => !query || fields.some((field) => String(field || '').toLowerCase().includes(query));

/**
 * Recruiter Home (design: design/Home — recruiter dashboard-html). Hiring metrics
 * (moved from the Jobs page) sit on top; then what needs attention, live jobs,
 * top matches, recently viewed candidates and job credits. Data comes from the
 * layout (jobs, candidates, top talents) and GET /payments/status.
 */
export default function DashboardPage({ company, user, jobs, candidates = [], candidatesError, topTalents, topTalentsError, demandProfile, token, goToTab, onViewApplications }) {
  const credits = useJobCredits(token);
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState(null);
  // Recently viewed profiles are kept per recruiter in this browser (utils/recentCandidateViews).
  const [recent, setRecent] = useState(() => getRecentlyViewedCandidates(undefined, RECENT_LIMIT));

  useEffect(() => {
    const sync = () => setRecent(getRecentlyViewedCandidates(undefined, RECENT_LIMIT));
    window.addEventListener('recently_viewed_candidates_changed', sync);
    return () => window.removeEventListener('recently_viewed_candidates_changed', sync);
  }, []);

  const metrics = useMemo(() => dashboardMetrics(jobs), [jobs]);
  const live = useMemo(() => liveJobs(jobs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [jobs]);
  const attention = attentionItems({ jobs, quota: credits.quota });
  const q = query.trim().toLowerCase();

  // Latest saved profile for each id, so the lists show current data.
  const byId = useMemo(() => new Map(candidates.map((cand) => [candidateId(cand), cand])), [candidates]);
  const applicantIds = useMemo(() => new Set((jobs || []).flatMap((job) => (job.applications || []).map((app) => app.studentId))), [jobs]);

  const topMatches = (Array.isArray(topTalents) ? topTalents : [])
    .filter((talent) => talent.matchScore > 0 && !applicantIds.has(candidateId(talent)))
    .map((talent) => ({ ...(byId.get(candidateId(talent)) || talent), matchScore: talent.matchScore }))
    .filter((cand) => matches(q, cand.name, cand.username, educationLine(cand)))
    .slice(0, TOP_MATCH_LIMIT);
  const recentPeople = recent
    .map((entry) => ({ ...(byId.get(candidateId(entry)) || entry), viewedAt: entry.viewedAt }))
    .filter((cand) => matches(q, cand.name, cand.username, educationLine(cand)));
  const shownJobs = live.filter((job) => matches(q, job.title, job.workMode, job.location));

  const name = company?.recruiterName || user?.name || company?.name || '';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const onAttention = (item) => {
    if (item.action === 'review') onViewApplications(item.job);
    else if (item.action === 'jobs') goToTab('jobs');
    else if (item.action === 'billing') goToTab('billing');
    else if (item.action === 'post') goToTab('post-job');
  };

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
        <label className={`flex h-11 w-full max-w-[480px] items-center gap-2.5 rounded-[8px] border border-[#E4E6EA] bg-white px-3.5 focus-within:border-[#1447E6] focus-within:ring-2 focus-within:ring-[#1447E6]/20 ${MUTED}`}>
          <Search className="size-[18px] shrink-0" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search this dashboard"
            placeholder="Search jobs and candidates on this page"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-[4px] p-0.5 hover:text-[#0F172A]">
              <X className="size-4" />
            </button>
          )}
        </label>

        <header className="flex flex-col gap-1">
          <h1 className={PAGE_TITLE}>
            <span className="font-bold">
              {greeting()}
              {name ? `, ${name}` : ''}
            </span>
          </h1>
          <p className={`m-0 text-[15px] ${MUTED}`}>
            {today} · {metrics.liveRoles} live job{metrics.liveRoles === 1 ? '' : 's'} · {metrics.newApplicants} new applicant{metrics.newApplicants === 1 ? '' : 's'} in the last 7 days
          </p>
        </header>

        <MetricCards metrics={metrics} />

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <AttentionCard items={attention} onAction={onAttention} />
            <ActiveJobsCard jobs={shownJobs} onOpenJob={(job) => onViewApplications(job)} onViewAll={() => goToTab('jobs')} />
          </div>

          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-6">
            <PeopleCard
              id="top-matches-title"
              title="Top matches who haven’t applied"
              subtitle={demandProfile?.totalActiveJobs ? `Ranked by skill match across your ${demandProfile.totalActiveJobs} active job${demandProfile.totalActiveJobs === 1 ? '' : 's'}` : null}
              people={topMatches}
              error={topTalentsError ? `Couldn’t load recommendations. ${topTalentsError}` : candidatesError ? `Couldn’t load candidates. ${candidatesError}` : null}
              empty={live.length === 0 ? 'Post a job with skill bars to get recommendations.' : q ? 'No matches for this search.' : 'No new matches for your live jobs yet.'}
              aside={(person) => <span className="font-semibold text-[#1447E6]">{person.matchScore}% match</span>}
              footer={{ label: 'See all candidates', onClick: () => goToTab('candidates') }}
              onViewProfile={setProfile}
            />
            <PeopleCard
              id="recent-title"
              title="Recently viewed candidates"
              subtitle="Profiles you opened last, on this browser"
              people={recentPeople}
              empty={q ? 'No recently viewed candidates match this search.' : 'Profiles you open from Candidates or this page will show up here.'}
              aside={(person) => <span className={MUTED}>Viewed {formatViewedTime(person.viewedAt).toLowerCase()}</span>}
              onViewProfile={setProfile}
            />
            <CreditsCard credits={credits} onBuy={() => goToTab('billing')} />
          </div>
        </div>
      </div>

      <CandidateProfileModal candidate={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
