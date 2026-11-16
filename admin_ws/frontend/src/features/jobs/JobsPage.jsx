import { useMemo, useState } from 'react';
import { Briefcase, Building2, GraduationCap, RefreshCw, RotateCcw } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import { useNavigation } from '../../app/NavigationContext.jsx';
import useResource from '../../hooks/useResource.js';
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
import { countBy, paginate } from '../../utils/collections.js';
import { formatDate, plural } from '../../utils/format.js';
import { DEFAULT_FILTERS, DEFAULT_SORT, JOB_TABS, activeTabKey, describeSort, filterJobs, filtersForTab, isDefaultView, requirementsOf, sortJobs } from '../../utils/jobs.js';
import JobDetail from './JobDetail.jsx';

const PAGE_SIZE = 8;
const TAB_TESTS = Object.fromEntries(JOB_TABS.map((tab) => [tab.key, tab.test]));

/** params: { jobId? } opens that posting (from a company's Jobs tab). */
export default function JobsPage({ params }) {
  const jobs = useResource(adminApi.getJobs, (json) => json.jobs);
  const { back } = useNavigation();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(params?.jobId || null);
  const arrivedOnJob = Boolean(params?.jobId);

  const list = useMemo(() => jobs.data || [], [jobs.data]);
  const counts = useMemo(() => countBy(list, TAB_TESTS), [list]);
  const filtered = useMemo(() => sortJobs(filterJobs(list, { filters, query }), sort), [list, filters, query, sort]);
  const info = paginate(filtered, page, PAGE_SIZE);
  const tab = activeTabKey(filters); // null when the column filters are a custom mix

  const selected = selectedId ? list.find((j) => j.id === selectedId) : null;
  if (selected) {
    return (
      <JobDetail
        key={selected.id}
        job={selected}
        backLabel={arrivedOnJob ? 'Back' : 'Job postings'}
        onBack={arrivedOnJob ? back : () => setSelectedId(null)}
      />
    );
  }
  if (selectedId && jobs.loading && !jobs.data) return <Loading>Loading job posting…</Loading>;

  // Every change to the view starts again from the first page.
  const changeTab = (key) => { setFilters(filtersForTab(key)); setPage(1); };
  const changeQuery = (value) => { setQuery(value); setPage(1); };
  const changeSort = (key, dir) => { setSort({ key, dir }); setPage(1); };
  const changeFilter = (name, value) => { setFilters((current) => ({ ...current, [name]: value })); setPage(1); };
  const resetView = () => { setSort(DEFAULT_SORT); setFilters(DEFAULT_FILTERS); setPage(1); };

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
      header: 'Posting',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Posting" active={sort.key === 'title' || (sort.key === 'posted' && sort.dir !== 'desc') || filters.posted !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('posting-sort', 'posted', 'desc', 'Newest posted first')}
            {sortOption('posting-sort', 'posted', 'asc', 'Oldest posted first')}
            {sortOption('posting-sort', 'title', 'asc', 'Title A → Z')}
            {sortOption('posting-sort', 'title', 'desc', 'Title Z → A')}
          </MenuGroup>
          <MenuGroup title="Posted">
            {filterOption('posting-show', 'posted', 'all', 'Any time')}
            {filterOption('posting-show', 'posted', '7d', 'Last 7 days')}
            {filterOption('posting-show', 'posted', '30d', 'Last 30 days')}
            {filterOption('posting-show', 'posted', 'older', 'Older than 30 days')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (job) => {
        const subtitle = [job.postedAt && `Posted ${formatDate(job.postedAt)}`, job.location].filter(Boolean).join(' · ');
        return (
          <div className="min-w-0 max-w-[18rem]">
            <div className="truncate font-semibold" title={job.title}>{job.title}</div>
            <div className="truncate text-xs text-muted" title={subtitle}>{subtitle}</div>
          </div>
        );
      }
    },
    {
      header: 'Company',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Company" active={sort.key === 'company'}>
          <MenuGroup title="Sort">
            {sortOption('company-sort', 'company', 'asc', 'A → Z')}
            {sortOption('company-sort', 'company', 'desc', 'Z → A')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (job) => <div className="max-w-[12rem] truncate" title={job.companyName}>{job.companyName}</div>
    },
    {
      header: 'Type',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Type" active={sort.key === 'type' || filters.type !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('type-sort', 'type', 'asc', 'A → Z')}
            {sortOption('type-sort', 'type', 'desc', 'Z → A')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('type-show', 'type', 'all', 'All types')}
            {filterOption('type-show', 'type', 'jobs', 'Jobs')}
            {filterOption('type-show', 'type', 'internships', 'Internships')}
            {filterOption('type-show', 'type', 'fulltime', 'Full-time')}
            {filterOption('type-show', 'type', 'parttime', 'Part-time')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (job) => <Pill tone="accent">{job.jobType}</Pill>
    },
    {
      header: 'Pay',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Pay" active={sort.key === 'pay' || filters.pay !== 'all'}>
          <MenuGroup title="Sort by monthly amount">
            {sortOption('pay-sort', 'pay', 'desc', 'Highest first')}
            {sortOption('pay-sort', 'pay', 'asc', 'Lowest first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('pay-show', 'pay', 'all', 'All postings')}
            {filterOption('pay-show', 'pay', 'listed', 'Pay listed')}
            {filterOption('pay-show', 'pay', 'none', 'Not specified')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (job) => job.salaryRange
    },
    {
      header: 'Skills required',
      align: 'right',
      wrapHeader: true,
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Skills required" active={sort.key === 'skills' || filters.skills !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('skills-sort', 'skills', 'desc', 'Most first')}
            {sortOption('skills-sort', 'skills', 'asc', 'Fewest first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('skills-show', 'skills', 'all', 'All postings')}
            {filterOption('skills-show', 'skills', 'has', 'With skill requirements')}
            {filterOption('skills-show', 'skills', 'none', 'No requirements')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (job) => requirementsOf(job).length
    },
    {
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (job) => (
        <Button size="sm" aria-label={`Open ${job.title}`} onClick={() => setSelectedId(job.id)}>
          Open
        </Button>
      )
    }
  ];

  const companies = new Set(list.map((job) => job.companyName)).size;

  return (
    <>
      <PageHeader
        title="Job postings"
        description="Every job and internship posted by recruiters. Open one to read the details and see who applied."
        actions={
          <Button icon={RefreshCw} loading={jobs.loading} onClick={jobs.reload}>
            Refresh
          </Button>
        }
      />

      {jobs.error && <LoadError className="mb-4" what="the job postings" message={jobs.error} onRetry={jobs.reload} />}

      <section aria-label="Job totals" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total postings" value={list.length} hint="Jobs and internships" icon={Briefcase} />
        <KpiCard label="Jobs" value={counts.jobs ?? 0} hint="Permanent roles" icon={Briefcase} tone="ok" />
        <KpiCard label="Internships" value={counts.internships ?? 0} hint="Fixed-duration roles" icon={GraduationCap} tone="info" />
        <KpiCard label="Companies hiring" value={companies} hint="With at least one posting" icon={Building2} tone="warn" />
      </section>

      <Panel>
        <Tabs
          label="Job filter"
          value={tab}
          onChange={changeTab}
          tabs={JOB_TABS.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] ?? 0 }))}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SearchInput className="w-full sm:w-80" value={query} onChange={changeQuery} placeholder="Search title, company or location" />
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <span>
              {plural(filtered.length, 'posting')} · sorted by {describeSort(sort)}
            </span>
            {!isDefaultView({ sort, filters }) && (
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={resetView}>
                Reset sort and filters
              </Button>
            )}
          </div>
        </div>
        {jobs.loading && !jobs.data ? (
          <Loading>Loading job postings…</Loading>
        ) : (
          <>
            <DataTable
              caption="Job postings"
              columns={columns}
              rows={info.rows}
              rowKey={(job) => job.id}
              onRowClick={(job) => setSelectedId(job.id)}
              empty={list.length === 0 ? 'No jobs have been posted yet.' : 'No postings match these filters.'}
            />
            <Pager info={info} onPage={setPage} />
          </>
        )}
      </Panel>
    </>
  );
}
