import { useMemo, useState } from 'react';
import { Building2, CircleCheck, Clock, RefreshCw, Briefcase, RotateCcw } from 'lucide-react';
import { useAdminData } from '../../app/AdminDataContext.jsx';
import { useNavigation } from '../../app/NavigationContext.jsx';
import { usePageActive } from '../../app/PageActiveContext.js';
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
import { DEFAULT_FILTERS, DEFAULT_SORT, describeSort, filterCompanies, isDefaultView, sortCompanies } from '../../utils/companies.js';
import { formatDate, plural } from '../../utils/format.js';
import { COMPANY_TABS, verificationMeta } from '../../utils/verification.js';
import CompanyDrawer from './CompanyDrawer.jsx';

const PAGE_SIZE = 8;
const TAB_TESTS = Object.fromEntries(COMPANY_TABS.map((tab) => [tab.key, tab.test]));

/** params: { tab? } opens a status filter; { id? } opens that company's drawer (the dashboard's "Review"). */
export default function CompaniesPage({ params }) {
  const { recruiters } = useAdminData();
  const { back } = useNavigation();
  const active = usePageActive(); // false while a job opened from the drawer is on top of this page
  const [tab, setTab] = useState(params?.tab || 'all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(params?.id || null); // the company showing in the drawer
  const [order, setOrder] = useState(null); // the ids the drawer steps through, fixed when it opened
  const [section, setSection] = useState('overview'); // the drawer's tab
  const arrivedOnCompany = Boolean(params?.id);

  const list = useMemo(() => recruiters.data || [], [recruiters.data]);
  const counts = useMemo(() => countBy(list, TAB_TESTS), [list]);
  const filtered = useMemo(() => sortCompanies(filterCompanies(list, { tab, query, ...filters }), sort), [list, tab, query, filters, sort]);
  const info = paginate(filtered, page, PAGE_SIZE);

  // The drawer steps through the list as it was when it opened. A company that leaves the filtered list
  // because it was just approved or rejected therefore stays on screen, with its new status.
  const filteredIds = useMemo(() => filtered.map((c) => c.id), [filtered]);
  const sequence = order || filteredIds;
  const openIndex = openId ? sequence.indexOf(openId) : -1;
  const openCompany = openIndex >= 0 ? list.find((c) => c.id === openId) || null : null;

  const openDrawer = (id) => {
    setOrder(filteredIds);
    setOpenId(id);
    setSection('overview'); // the decision buttons are on Overview, so every company opens there
  };
  // Arriving from the dashboard's "Review", closing the drawer goes back to the dashboard.
  const closeDrawer = () => {
    setOpenId(null);
    setOrder(null);
    if (arrivedOnCompany) back();
  };
  const goTo = (index) => {
    setOpenId(sequence[index]);
    setPage(Math.floor(index / PAGE_SIZE) + 1); // so the list behind the drawer shows it when the drawer closes
  };

  // Every change to the view starts again from the first page.
  const changeTab = (key) => { setTab(key); setPage(1); };
  const changeQuery = (value) => { setQuery(value); setPage(1); };
  const changeSort = (key, dir) => { setSort({ key, dir }); setPage(1); };
  const changeFilter = (name, value) => { setFilters((current) => ({ ...current, [name]: value })); setPage(1); };
  const resetView = () => { setSort(DEFAULT_SORT); setFilters(DEFAULT_FILTERS); setTab('all'); setPage(1); };

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
      header: 'Company',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Company" active={sort.key === 'name'}>
          <MenuGroup title="Sort">
            {sortOption('company-sort', 'name', 'asc', 'A → Z')}
            {sortOption('company-sort', 'name', 'desc', 'Z → A')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => (
        <div className="min-w-0">
          <div className="font-semibold">{c.companyName}</div>
          <div className="truncate text-xs text-muted">{[c.company?.industry, c.company?.location].filter(Boolean).join(' · ') || 'No company profile'}</div>
        </div>
      )
    },
    {
      header: 'Contact',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Contact" active={sort.key === 'contact'}>
          <MenuGroup title="Sort by recruiter name">
            {sortOption('contact-sort', 'contact', 'asc', 'A → Z')}
            {sortOption('contact-sort', 'contact', 'desc', 'Z → A')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => (
        <div className="min-w-0">
          <div>{c.company?.recruiterName || '—'}</div>
          <div className="truncate text-xs text-muted">{c.email}</div>
        </div>
      )
    },
    {
      header: 'Verification',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Verification" active={sort.key === 'status' || tab !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('verification-sort', 'status', 'asc', 'Needs review first')}
            {sortOption('verification-sort', 'status', 'desc', 'Approved first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {COMPANY_TABS.map((t) => (
              <MenuOption key={t.key} name="verification-show" checked={tab === t.key} onSelect={() => changeTab(t.key)}>
                {t.label} <span className="font-normal text-muted">({counts[t.key] ?? 0})</span>
              </MenuOption>
            ))}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => {
        const meta = verificationMeta(c.verificationStatus);
        return <Pill tone={meta.tone}>{meta.label}</Pill>;
      }
    },
    {
      header: 'Jobs posted',
      align: 'right',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Jobs posted" active={sort.key === 'jobs' || filters.jobs !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('jobs-sort', 'jobs', 'desc', 'Most first')}
            {sortOption('jobs-sort', 'jobs', 'asc', 'Fewest first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('jobs-show', 'jobs', 'all', 'All companies')}
            {filterOption('jobs-show', 'jobs', 'with', 'With jobs')}
            {filterOption('jobs-show', 'jobs', 'none', 'No jobs yet')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => (c.jobs || []).length
    },
    {
      header: 'Submitted',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="Submitted" active={sort.key === 'submitted' || filters.submitted !== 'all'}>
          <MenuGroup title="Sort">
            {sortOption('submitted-sort', 'submitted', 'desc', 'Newest first')}
            {sortOption('submitted-sort', 'submitted', 'asc', 'Oldest first')}
          </MenuGroup>
          <MenuGroup title="Show">
            {filterOption('submitted-show', 'submitted', 'all', 'All companies')}
            {filterOption('submitted-show', 'submitted', 'yes', 'Sent documents')}
            {filterOption('submitted-show', 'submitted', 'no', 'Not sent yet')}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (c) => formatDate(c.verificationSubmittedAt) || '—'
    },
    {
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (c) => (
        <Button size="sm" variant={c.verificationStatus === 'PENDING' ? 'primary' : 'default'} aria-label={`${c.verificationStatus === 'PENDING' ? 'Review' : 'Open'} ${c.companyName}`} onClick={() => openDrawer(c.id)}>
          {c.verificationStatus === 'PENDING' ? 'Review' : 'Open'}
        </Button>
      )
    }
  ];

  const totalJobs = list.reduce((sum, c) => sum + (c.jobs || []).length, 0);

  return (
    <>
      <PageHeader
        title="Companies (HR)"
        description="Every recruiting company on the platform. Open a company to review its documents and approve or reject it."
        actions={
          <Button icon={RefreshCw} loading={recruiters.loading} onClick={recruiters.reload}>
            Refresh
          </Button>
        }
      />

      {recruiters.error && <LoadError className="mb-4" what="the companies" message={recruiters.error} onRetry={recruiters.reload} />}

      <section aria-label="Company totals" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total companies" value={list.length} hint="Registered recruiters" icon={Building2} />
        <KpiCard label="Pending review" value={counts.PENDING ?? 0} hint="Waiting for your decision" icon={Clock} tone="warn" />
        <KpiCard label="Approved" value={counts.APPROVED ?? 0} hint="Can post jobs and gigs" icon={CircleCheck} tone="ok" />
        <KpiCard label="Jobs posted" value={totalJobs} hint="Across all companies" icon={Briefcase} tone="info" />
      </section>

      <Panel>
        <Tabs
          label="Company filter"
          value={tab}
          onChange={changeTab}
          tabs={COMPANY_TABS.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] ?? 0 }))}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SearchInput className="w-full sm:w-96" value={query} onChange={changeQuery} placeholder="Search company, recruiter, email or city" />
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <span>
              {plural(filtered.length, 'company', 'companies')} · sorted by {describeSort(sort)}
            </span>
            {!isDefaultView({ sort, filters, tab }) && (
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={resetView}>
                Reset sort and filters
              </Button>
            )}
          </div>
        </div>
        {recruiters.loading && !recruiters.data ? (
          <Loading>Loading companies…</Loading>
        ) : (
          <>
            <DataTable
              caption="Companies"
              columns={columns}
              rows={info.rows}
              rowKey={(c) => c.id}
              onRowClick={(c) => openDrawer(c.id)}
              empty={list.length === 0 ? 'No recruiters have registered yet.' : 'No companies match these filters.'}
            />
            <Pager info={info} onPage={setPage} />
          </>
        )}
      </Panel>

      {openCompany && active && (
        <CompanyDrawer
          company={openCompany}
          section={section}
          onSection={setSection}
          position={openIndex + 1}
          total={sequence.length}
          onPrev={() => goTo(openIndex - 1)}
          onNext={() => goTo(openIndex + 1)}
          onClose={closeDrawer}
          onUpdated={(updated) => recruiters.setData((current) => current.map((c) => (c.id === updated.id ? updated : c)))}
        />
      )}
    </>
  );
}
