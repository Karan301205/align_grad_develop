import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { cx } from '../utils/cx.js';
import Sidebar from './Sidebar.jsx';
import { useAdminData } from './AdminDataContext.jsx';
import { PageActiveContext } from './PageActiveContext.js';
import { useNavigation } from './NavigationContext.jsx';
import AnalyticsPage from '../features/analytics/AnalyticsPage.jsx';
import CandidatesPage from '../features/candidates/CandidatesPage.jsx';
import CompaniesPage from '../features/companies/CompaniesPage.jsx';
import CoursesPage from '../features/courses/CoursesPage.jsx';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import JobsPage from '../features/jobs/JobsPage.jsx';
import StoragePage from '../features/storage/StoragePage.jsx';
import SupportPage from '../features/support/SupportPage.jsx';

// Screen id (see navigation.js) → page. Pages are added here as they are built.
const PAGES = {
  dashboard: DashboardPage,
  companies: CompaniesPage,
  candidates: CandidatesPage,
  jobs: JobsPage,
  support: SupportPage,
  courses: CoursesPage,
  analytics: AnalyticsPage,
  storage: StoragePage
};

export default function AdminShell({ onLogout }) {
  const { stack, current, switchTo } = useNavigation();
  const { recruiters, supportTickets } = useAdminData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // open on every visit; the arrow collapses it to icons (desktop only)

  const pendingCompanies = (recruiters.data || []).filter((c) => c.verificationStatus === 'PENDING').length;
  const ticketsNeedingReply = (supportTickets.data || []).filter((t) => t.status === 'OPEN').length;

  // A new screen starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [current.key]);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        section={current.section}
        open={drawerOpen}
        collapsed={collapsed}
        badges={{ companies: pendingCompanies, support: ticketsNeedingReply }}
        onClose={() => setDrawerOpen(false)}
        onLogout={onLogout}
        onSelect={(id) => {
          switchTo(id);
          setDrawerOpen(false);
        }}
      />

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        aria-controls="admin-sidebar"
        className={cx(
          'fixed top-6 z-50 hidden size-6 place-items-center rounded-full border border-line-strong bg-panel text-ink-2 shadow-sm transition-[left,background-color] duration-200 hover:bg-subtle md:grid',
          collapsed ? 'left-[60px]' : 'left-[228px]'
        )}
      >
        {collapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronLeft className="size-4" aria-hidden="true" />}
      </button>

      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-panel px-4 py-2.5 md:hidden">
        <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 text-ink-2 hover:bg-subtle">
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-bold">AlignGrad Admin</span>
      </div>

      <main className={cx('px-4 py-6 transition-[margin] duration-200 md:px-8 md:py-7', collapsed ? 'md:ml-[72px]' : 'md:ml-60')}>
        <div className="mx-auto max-w-[1280px]">
          {stack.map((entry) => {
            const Page = PAGES[entry.section];
            return (
              <div key={entry.key} hidden={entry.key !== current.key}>
                <PageActiveContext.Provider value={entry.key === current.key}>
                  <Page params={entry.params} />
                </PageActiveContext.Provider>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
