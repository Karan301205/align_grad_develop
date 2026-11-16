import { useMemo, useState } from 'react';
import { RefreshCw, RotateCcw, ShieldCheck, Sparkles, Users, Video } from 'lucide-react';
import { useAdminData } from '../../app/AdminDataContext.jsx';
import Button from '../../components/ui/Button.jsx';
import ColumnMenu, { MenuGroup, MenuOption } from '../../components/ui/ColumnMenu.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import { LoadError } from '../../components/ui/Notice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pager from '../../components/ui/Pager.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import { Loading } from '../../components/ui/States.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import SkillChips from '../../components/SkillChips.jsx';
import {
  CANDIDATE_TABS,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  activeTabKey,
  applicationsOf,
  describeSort,
  filterCandidates,
  filtersForTab,
  hasVideo,
  isDefaultView,
  skillsOf,
  sortCandidates,
  verifiedSkillCount
} from '../../utils/candidates.js';
import { countBy, paginate } from '../../utils/collections.js';
import { formatDate, plural } from '../../utils/format.js';
import CandidateDrawer from './CandidateDrawer.jsx';

const PAGE_SIZE = 8;
const TAB_TESTS = Object.fromEntries(CANDIDATE_TABS.map((tab) => [tab.key, tab.test]));
const percent = (part, total) => (total ? `${Math.round((part / total) * 100)}%` : '0%');

export default function CandidatesPage() {
  const { students } = useAdminData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null); // the candidate showing in the drawer

  const list = useMemo(() => students.data || [], [students.data]);
  const counts = useMemo(() => countBy(list, TAB_TESTS), [list]);
  const filtered = useMemo(() => sortCandidates(filterCandidates(list, { filters, query }), sort), [list, filters, query, sort]);
  const info = paginate(filtered, page, PAGE_SIZE);
  const tab = activeTabKey(filters); // null when the column filters are a custom mix

  // Every change to the view starts again from the first page.
  const changeTab = (key) => { setFilters(filtersForTab(key)); setPage(1); };
  const changeQuery = (value) => { setQuery(value); setPage(1); };
  const changeSort = (key, dir) => { setSort({ key, dir }); setPage(1); };
  const changeFilter = (name, value) => { setFilters((current) => ({ ...current, [name]: value })); setPage(1); };
  const resetView = () => { setSort(DEFAULT_SORT); setFilters(DEFAULT_FILTERS); setPage(1); };

  // The drawer browses the list as it is now (every page of it, in the current order).
  const openIndex = openId ? filtered.findIndex((c) => c.id === openId) : -1;
  const openCandidate = openId ? filtered[openIndex] || list.find((c) => c.id === openId) || null : null;
  const goTo = (index) => {
    setOpenId(filtered[index].id);
    setPage(Math.floor(index / PAGE_SIZE) + 1); // so the list behind the drawer shows them when it closes
  };

  const sortOption = (name, key, dir, text) => (
    <MenuOption name={name} checked={sort.key === key && sort.dir === dir} onSelect={() => changeSort(key, dir)}>
      {text}
    </MenuOption>
  );
  const filterOption = (name, field, value, text) => (
    <MenuOption name={name} checked={filters[field] === value} onSelect={() => changeFilter(field, value)}>
      {text}
    </MenuOption>
  );

  const columns = [
    {
      header: 'Candidate',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Candidate" active={sort.key === 'name'}>
          <MenuGroup title="Sort">
            {sortOption('candidate-sort', 'name', 'asc', 'A → Z')}
            {sortOption('candidate-sort', 'name', 'desc', 'Z → A')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => (
        <div className="min-w-0 max-w-[13rem]">
          <div className="truncate font-semibold" title={c.name}>{c.name}</div>
          <div className="truncate text-xs text-muted" title={c.email}>{c.email}</div>
        </div>
      )
    },
    {
      header: 'Skills',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Skills" active={sort.key === 'skills' || filters.skills !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('skills-sort', 'skills', 'desc', 'Most skills first')}
            {sortOption('skills-sort', 'skills', 'asc', 'Fewest skills first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('skills-show', 'skills', 'all', 'All candidates')}
            {filterOption('skills-show', 'skills', 'has', 'With skills')}
            {filterOption('skills-show', 'skills', 'none', 'No skills yet')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => <SkillChips candidate={c} />
    },
    {
      header: 'Verified skills',
      align: 'right',
      wrapHeader: true,
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Verified skills" active={sort.key === 'verified' || filters.verified !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('verified-sort', 'verified', 'desc', 'Most first')}
            {sortOption('verified-sort', 'verified', 'asc', 'Fewest first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('verified-show', 'verified', 'all', 'All candidates')}
            {filterOption('verified-show', 'verified', 'has', 'Has verified skills')}
            {filterOption('verified-show', 'verified', 'none', 'None verified')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => `${verifiedSkillCount(c)} / ${skillsOf(c).length}`
    },
    {
      header: 'Video résumé',
      wrapHeader: true,
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Video résumé" active={sort.key === 'video' || filters.video !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('video-sort', 'video', 'desc', 'Uploaded first')}
            {sortOption('video-sort', 'video', 'asc', 'None first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('video-show', 'video', 'all', 'All candidates')}
            {filterOption('video-show', 'video', 'yes', 'Uploaded')}
            {filterOption('video-show', 'video', 'none', 'No video yet')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => (hasVideo(c) ? <Pill tone="ok">Uploaded</Pill> : <Pill>None</Pill>)
    },
    {
      header: 'Applications',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Applications" active={sort.key === 'applications' || filters.applied !== 'all'}>
          <MenuGroup title="Sort by total">
            {sortOption('applications-sort', 'applications', 'desc', 'Most first')}
            {sortOption('applications-sort', 'applications', 'asc', 'Fewest first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('applications-show', 'applied', 'all', 'All candidates')}
            {filterOption('applications-show', 'applied', 'any', 'Applied to anything')}
            {filterOption('applications-show', 'applied', 'jobs', 'Applied to jobs')}
            {filterOption('applications-show', 'applied', 'internships', 'Applied to internships')}
            {filterOption('applications-show', 'applied', 'gigs', 'Pitched on gigs')}
            {filterOption('applications-show', 'applied', 'none', 'No applications yet')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => {
        const a = applicationsOf(c);
        if (!a) return '—';
        return (
          <div>
            <div className="font-semibold">{a.total}</div>
            <div className="flex flex-wrap gap-x-2.5 text-xs text-muted">
              <span className="whitespace-nowrap">Jobs {a.jobs}</span>
              <span className="whitespace-nowrap">Internships {a.internships}</span>
              <span className="whitespace-nowrap">Gigs {a.gigs}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Joined',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Joined" active={(sort.key === 'joined' && sort.dir !== 'desc') || filters.joined !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('joined-sort', 'joined', 'desc', 'Newest first')}
            {sortOption('joined-sort', 'joined', 'asc', 'Oldest first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('joined-show', 'joined', 'all', 'Any time')}
            {filterOption('joined-show', 'joined', '7d', 'Last 7 days')}
            {filterOption('joined-show', 'joined', '30d', 'Last 30 days')}
            {filterOption('joined-show', 'joined', 'older', 'Older than 30 days')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => formatDate(c.createdAt) || '—'
    },
    {
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (c) => (
        <Button size="sm" aria-label={`Open ${c.name}`} onClick={() => setOpenId(c.id)}>
          Open
        </Button>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Every candidate on the platform. Open one to review their profile, skills, education, projects and certificates."
        actions={
          <Button icon={RefreshCw} loading={students.loading} onClick={students.reload}>
            Refresh
          </Button>
        }
      />

      {students.error && <LoadError className="mb-4" what="the candidates" message={students.error} onRetry={students.reload} />}

      <section aria-label="Candidate totals" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total candidates" value={list.length} hint="Registered on the platform" icon={Users} />
        <KpiCard label="Skills added" value={counts.skills ?? 0} hint={`${percent(counts.skills ?? 0, list.length)} of candidates`} icon={Sparkles} tone="info" />
        <KpiCard label="Verified skills" value={counts.verified ?? 0} hint="Passed at least one skill test" icon={ShieldCheck} tone="ok" />
        <KpiCard label="Video résumé" value={list.filter(hasVideo).length} hint={`${percent(list.filter(hasVideo).length, list.length)} uploaded one`} icon={Video} tone="warn" />
      </section>

      <Panel>
        <Tabs
          label="Candidate filter"
          value={tab}
          onChange={changeTab}
          tabs={CANDIDATE_TABS.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] ?? 0 }))}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SearchInput className="w-full sm:w-96" value={query} onChange={changeQuery} placeholder="Search name, email, username or skill" />
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <span>
              {plural(filtered.length, 'candidate')} · sorted by {describeSort(sort)}
            </span>
            {!isDefaultView({ sort, filters }) && (
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={resetView}>
                Reset sort and filters
              </Button>
            )}
          </div>
        </div>
        {students.loading && !students.data ? (
          <Loading>Loading candidates…</Loading>
        ) : (
          <>
            <DataTable
              caption="Candidates"
              compact
              columns={columns}
              rows={info.rows}
              rowKey={(c) => c.id}
              onRowClick={(c) => setOpenId(c.id)}
              empty={list.length === 0 ? 'No candidates have registered yet.' : 'No candidates match these filters.'}
            />
            <Pager info={info} onPage={setPage} />
          </>
        )}
      </Panel>

      {openCandidate && (
        <CandidateDrawer
          candidate={openCandidate}
          position={openIndex >= 0 ? openIndex + 1 : null}
          total={filtered.length}
          onPrev={() => goTo(openIndex - 1)}
          onNext={() => goTo(openIndex + 1)}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
