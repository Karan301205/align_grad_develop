import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { formatViewedTime, getRecentlyViewedCandidates } from '../../../utils/recentCandidateViews';
import { ACCOUNT_PAGE, MUTED, PAGE_TITLE } from '../components/accountStyles';
import CandidateProfileDrawer from '../components/CandidateProfileDrawer';
import useJobCredits from '../postJob/useJobCredits';
import { candidateId, educationLine } from '../candidates/candidateData';
import { useCandidateProfiles, useCandidateSearch } from '../candidates/useCandidates';
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
 * top matches, recently viewed candidates and job credits. Jobs come from the layout; the two
 * people lists ask the server for just those few candidates (POST /recruiter/candidates/search),
 * and "View profile" loads the full profile (GET /recruiter/candidates/:id). Candidate data is
 * only asked for once the company is approved (`canSeeCandidates`).
 */
export default function DashboardPage({ company, user, jobs, canSeeCandidates, token, goToTab, onViewApplications }) {
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

  // Top matches: best match % for the active jobs, people who haven't applied yet, filtered by the search box.
  const top = useCandidateSearch(
    token,
    canSeeCandidates ? { sort: 'recommended', match: 'any', excludeApplicants: true, q, pageSize: TOP_MATCH_LIMIT, countTotal: false } : null,
    { debounceMs: 300 }
  );
  const topMatches = top.items;

  // Recently viewed: this browser's list, refreshed with each person's current card from the server.
  const recentIds = useMemo(() => recent.map((entry) => candidateId(entry)).filter(Boolean), [recent]);
  const fresh = useCandidateSearch(token, canSeeCandidates && recentIds.length > 0 ? { ids: recentIds, sort: 'newest', pageSize: RECENT_LIMIT, countTotal: false } : null);
  const freshById = useMemo(() => new Map(fresh.items.map((cand) => [candidateId(cand), cand])), [fresh.items]);
  const recentPeople = recent
    .map((entry) => ({ ...entry, ...(freshById.get(candidateId(entry)) || {}), viewedAt: entry.viewedAt }))
    .filter((cand) => matches(q, cand.name, cand.username, educationLine(cand)));

  // "View profile": show the card at once, then the full profile when it arrives.
  const { load: loadProfile } = useCandidateProfiles(token);
  const openProfile = (person) => {
    const id = candidateId(person);
    setProfile(person);
    loadProfile(id)
      .then((full) => setProfile((current) => (current && candidateId(current) === id ? { ...full, matchScore: person.matchScore } : current)))
      .catch((err) => console.error('[dashboard] Could not load the full profile:', err));
  };
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
        <label className={`flex h-11 w-full max-w-[480px] items-center gap-2.5 rounded-[8px] border border-[#E4E6EA] bg-white px-3.5 focus-within:border-[#0F7A55] focus-within:ring-2 focus-within:ring-[#0F7A55]/20 ${MUTED}`}>
          <Search className="size-[18px] shrink-0" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search this dashboard"
            placeholder="Search jobs and candidates on this page"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#023836] placeholder:text-[#6B7280] focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-[4px] p-0.5 hover:text-[#023836]">
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
            <CreditsCard credits={credits} onBuy={() => goToTab('billing')} />
            <PeopleCard
              id="top-matches-title"
              title="Top matches who haven’t applied"
              subtitle={top.demand?.totalActiveJobs ? `Ranked by skill match across your ${top.demand.totalActiveJobs} active job${top.demand.totalActiveJobs === 1 ? '' : 's'}` : null}
              people={topMatches}
              error={top.status === 'error' ? `Couldn’t load recommendations. ${top.error}` : null}
              empty={top.status === 'loading' ? 'Loading matches…' : live.length === 0 ? 'Post a job with skill bars to get recommendations.' : q ? 'No matches for this search.' : 'No new matches for your live jobs yet.'}
              aside={(person) => <span className="font-semibold text-[#0F7A55]">{person.matchScore}% match</span>}
              footer={{ label: 'See all candidates', onClick: () => goToTab('candidates') }}
              onViewProfile={openProfile}
            />
            <PeopleCard
              id="recent-title"
              title="Recently viewed candidates"
              subtitle="Profiles you opened last, on this browser"
              people={recentPeople}
              empty={q ? 'No recently viewed candidates match this search.' : 'Profiles you open from Candidates or this page will show up here.'}
              aside={(person) => <span className={MUTED}>Viewed {formatViewedTime(person.viewedAt).toLowerCase()}</span>}
              onViewProfile={openProfile}
            />
          </div>
        </div>
      </div>

      <CandidateProfileDrawer candidate={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
