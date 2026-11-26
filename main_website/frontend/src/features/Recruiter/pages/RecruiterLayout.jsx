import { Suspense, useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiFetch, userMessage, SERVER_MESSAGE } from '../../../services/apiClient';
import { formatAlertMessage } from '../../../utils/errorFormatter';
import {
  COMPANY_VERIFICATION_STATUS,
  getCompanyVerificationStatus,
  getPortalLockedMessage
} from '../../../utils/companyVerification';

// Import subcomponents
import RecruiterSidebar from '../components/RecruiterSidebar';
import { lazyPage } from '../../../app/lazyPage';
import { PageLoader } from '../../../components/PageLoader';
import { BRAND_GRADIENT_X } from '../components/accountStyles';

// Each tab loads the first time it's opened.
const DashboardPage = lazyPage(() => import('../dashboard/DashboardPage'));
const FirstRunHome = lazyPage(() => import('../dashboard/FirstRunHome'));
const JobsPage = lazyPage(() => import('../jobs/JobsPage'));
const ApplicationsPage = lazyPage(() => import('../jobs/ApplicationsPage'));
const CandidatesPage = lazyPage(() => import('../candidates/CandidatesPage'));
const PostJobPage = lazyPage(() => import('../postJob/PostJobPage'));
const CompanyProfilePage = lazyPage(() => import('../companyProfile/CompanyProfilePage'));
const BillingPage = lazyPage(() => import('../billing/BillingPage'));
const GigsPage = lazyPage(() => import('../gigs/GigsPage'));
const SupportPage = lazyPage(() => import('../../Support/SupportPage'));

// Account pages (company profile, billing, Help & support) stay open before approval.
const ACCOUNT_TABS = ['verification', 'billing', 'support'];
// Before approval the recruiter can use Home (the first-run page) and the account pages.
const OPEN_BEFORE_APPROVAL = ['dashboard', ...ACCOUNT_TABS];
// Pages that draw their own header, padding and background (the 2026-11 designs).
const FULL_BLEED_TABS = [...ACCOUNT_TABS, 'dashboard', 'post-job', 'candidates', 'jobs', 'applications', 'gigs'];

export default function RecruiterLayout({ user, token, activeTab, setActiveTab, handleLogout }) {
  const [company, setCompany] = useState(null);
  const [companyError, setCompanyError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsError, setJobsError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  // Desktop rail: open by default; the arrow collapses it to icons and the page reflows.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Gigs view ('list' | 'post' | 'edit' | 'workspace') and the open gig, kept here so
  // they survive switching to another tab and back.
  const [gigsView, setGigsView] = useState('list');
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [selectedApplicationsJob, setSelectedApplicationsJob] = useState(null);
  const mainRef = useRef(null);


  // Verification state
  const [alertConfig, setAlertConfig] = useState(null);

  // `silent` refreshes data in place without the full-page spinner, so the open
  // section (e.g. the company profile form) is not unmounted mid-edit.
  const fetchRecruiterData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      // Company Details (the company profile page shows this error if it fails)
      try {
        const compRes = await apiFetch('/recruiter/company', { token });
        const body = await compRes.json().catch(() => ({}));
        if (compRes.ok) {
          setCompany(body);
          setCompanyError(null);
        } else {
          setCompanyError(body.error || SERVER_MESSAGE);
        }
      } catch (err) {
        setCompanyError(userMessage(err));
      }

      // Company jobs, each with its applications. A failure is kept for the Jobs and
      // Applications pages and doesn't stop the candidate data below from loading.
      try {
        const jobsRes = await apiFetch('/recruiter/jobs', { token });
        const jobsData = await jobsRes.json().catch(() => ({}));
        if (jobsRes.ok && Array.isArray(jobsData)) {
          setJobs(jobsData);
          setJobsError(null);
        } else {
          setJobsError(jobsData.error || SERVER_MESSAGE);
        }
      } catch (err) {
        setJobsError(userMessage(err));
      }

      // Candidates are not loaded here: each page asks the server for the few it shows
      // (candidates/useCandidates.js), once the company is approved.
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiterData();
  }, [token]);

  // Switches on the recruiter theme in styles/index.css (landing greens and Inter) for the whole
  // document, so modals rendered outside this layout get it too.
  useEffect(() => {
    document.body.classList.add('recruiter-app');
    return () => document.body.classList.remove('recruiter-app');
  }, []);

  // Publishes a job from the post-a-job wizard (POST /recruiter/jobs). The wizard
  // shows the returned error (and opens the credit pack on UPGRADE_REQUIRED).
  const handlePostJob = async (jobData) => {
    try {
      const res = await apiFetch('/recruiter/jobs', { token, method: 'POST', json: jobData });
      if (res.ok) {
        setAlertConfig({ message: 'Job posted successfully!', type: 'success' });
        fetchRecruiterData();
        setActiveTab('dashboard');
        return { success: true };
      }
      const d = await res.json().catch(() => ({}));
      return { success: false, error: d.error || 'Failed to post the job', code: d.code };
    } catch (err) {
      console.error('Error posting job:', err);
      return { success: false, error: userMessage(err, 'Could not reach the server to post the job') };
    }
  };

  const handleUpdateJob = async (jobId, jobData) => {
    try {
      const res = await apiFetch(`/recruiter/jobs/${jobId}`, {
        token,
        method: 'PUT',
        json: jobData
      });
      if (res.ok) {
        setAlertConfig({ message: 'Job updated successfully!', type: 'success' });
        // Silent, so the Jobs page keeps its tab, search and sort.
        fetchRecruiterData({ silent: true });
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to update job', type: 'error' });
        return false;
      }
    } catch (err) {
      setAlertConfig({ message: `Couldn’t update the job. ${userMessage(err)}`, type: 'error' });
      return false;
    }
  };

  const handleTogglePauseJob = async (jobId, currentIsPaused) => {
    try {
      const nextPaused = !currentIsPaused;
      const res = await apiFetch(`/recruiter/jobs/${jobId}/status`, {
        token,
        method: 'PATCH',
        json: {
          isPaused: nextPaused,
          status: nextPaused ? 'PAUSED' : 'ACTIVE'
        }
      });
      if (res.ok) {
        setAlertConfig({
          message: nextPaused ? 'Job paused. It will no longer showcase to candidates.' : 'Job resumed and is now live for candidates!',
          type: 'success'
        });
        await fetchRecruiterData({ silent: true });
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to update job status', type: 'error' });
        return false;
      }
    } catch (err) {
      setAlertConfig({ message: `Couldn’t change the job status. ${userMessage(err)}`, type: 'error' });
      return false;
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const res = await apiFetch(`/recruiter/jobs/${jobId}`, {
        token,
        method: 'DELETE'
      });
      if (res.ok) {
        setAlertConfig({ message: 'Job deleted successfully.', type: 'success' });
        await fetchRecruiterData({ silent: true });
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to delete job', type: 'error' });
        return false;
      }
    } catch (err) {
      setAlertConfig({ message: `Couldn’t delete the job. ${userMessage(err)}`, type: 'error' });
      return false;
    }
  };

  // Queues the company for admin review with already-uploaded documents
  // ([{ docType, docUrl, fileName }], uploaded by the company profile page).
  const handleVerification = async (verificationDocs, silent = false) => {
    try {
      const res = await apiFetch('/recruiter/verify', {
        token,
        method: 'POST',
        json: {
          docUrl: verificationDocs[0]?.docUrl || null,
          verificationDocs
        }
      });

      if (res.ok) {
        if (!silent) {
          setAlertConfig({ message: 'Verification documents submitted for admin review.', type: 'success' });
        }
        await fetchRecruiterData({ silent: true });
        return true;
      } else {
        const d = await res.json().catch(() => ({}));
        setAlertConfig({ message: d.error || 'Verification submission failed', type: 'error' });
        return false;
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: userMessage(err, 'Verification submission error'), type: 'error' });
      return false;
    }
  };

  const handleUpdateCompany = async (companyData, customSuccessMsg = null) => {
    try {
      const res = await apiFetch('/recruiter/company', {
        token,
        method: 'PUT',
        json: companyData
      });
      if (res.ok) {
        setAlertConfig({ 
          message: customSuccessMsg || 'Company profile updated successfully!', 
          type: 'success' 
        });
        await fetchRecruiterData({ silent: true });
        return true;
      } else {
        const d = await res.json().catch(() => ({}));
        setAlertConfig({ message: d.error || 'Failed to update company profile', type: 'error' });
        return false;
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Error updating company profile', type: 'error' });
      return false;
    }
  };

  const companyVerificationStatus = getCompanyVerificationStatus(company);
  const isCompanyApproved = companyVerificationStatus === COMPANY_VERIFICATION_STATUS.APPROVED;
  const portalLockedMessage = getPortalLockedMessage(companyVerificationStatus);

  // Until an admin approves the company, everything except Home and the account pages is locked.
  useEffect(() => {
    if (!loading && !isCompanyApproved && !OPEN_BEFORE_APPROVAL.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [loading, isCompanyApproved, activeTab]);

  const navItems = [
    // Before approval this tab is "Home" (first-run page); afterwards the hiring dashboard.
    { id: 'dashboard', icon: 'table-columns', label: isCompanyApproved ? 'Dashboard' : 'Home', locked: false },
    { id: 'jobs', icon: 'briefcase', label: 'Active jobs', locked: !isCompanyApproved },
    { id: 'candidates', icon: 'users', label: 'Candidates', locked: !isCompanyApproved },
    { id: 'post-job', icon: 'plus', label: 'Post new job', locked: !isCompanyApproved },
    // One entry: the Gigs page has its own list, Post a gig and workspace views.
    { id: 'gigs', icon: 'bolt', label: 'Gigs', locked: !isCompanyApproved },
    {
      id: 'verification',
      icon: 'building',
      label: 'Company profile',
      locked: false,
      group: 'Account',
      // Amber dot until approved: "Under review" while pending, otherwise it needs action.
      dot: isCompanyApproved ? null : companyVerificationStatus === COMPANY_VERIFICATION_STATUS.PENDING ? 'Under review' : 'Needs your action'
    },
    { id: 'billing', icon: 'file-invoice', label: 'Plan & billing', locked: false, group: 'Account' },
    { id: 'support', icon: 'circle-question', label: 'Help & support', locked: false, group: 'Account' },
  ];
  // Applications live under "Active jobs" in the sidebar.
  const activeNavId = activeTab === 'applications' ? 'jobs' : activeTab;
  const isFullBleedPage = FULL_BLEED_TABS.includes(activeTab);

  const goToTab = (tabId) => {
    if (!OPEN_BEFORE_APPROVAL.includes(tabId) && !isCompanyApproved) {
      setAlertConfig({ message: portalLockedMessage, type: 'warning' });
      return;
    }
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  // Smoothly scroll the main content area back to the top whenever the
  // active menu section changes, instead of jumping abruptly.
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <>
      <RecruiterSidebar
        navItems={navItems}
        activeItemId={activeNavId}
        onNavigate={goToTab}
        company={company}
        user={user}
        onLogout={handleLogout}
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main stage */}
      {/* The margin follows the sidebar width, so content reflows instead of sitting under it.
          `relative` keeps absolutely positioned children (e.g. hidden file inputs) inside this
          scroll area; without it they stretched the page and the whole window scrolled,
          leaving an empty band at the bottom. */}
      <main
        ref={mainRef}
        className={`relative flex-1 min-w-0 h-screen overflow-y-auto custom-scrollbar scroll-smooth transition-[margin] duration-300 ease-out ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        } ${isFullBleedPage ? 'pt-16 md:pt-0 bg-[#F4F8F6]' : 'pt-24 md:pt-10 p-6 md:p-10 bg-background'}`}
      >
        {/* Thin line in the logo gradient along the top of every page (desktop; the
            mobile top bar carries its own). It takes no space and stays while scrolling. */}
        <div aria-hidden="true" className="pointer-events-none sticky top-0 z-30 hidden h-0 md:block">
          <div className={`h-[3px] ${BRAND_GRADIENT_X}`} />
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div key={activeTab}>
            <Suspense fallback={<PageLoader />}>
            {activeTab === 'dashboard' && !isCompanyApproved && <FirstRunHome company={company} user={user} goToTab={goToTab} />}

            {activeTab === 'dashboard' && isCompanyApproved && (
              <DashboardPage
                company={company}
                user={user}
                jobs={jobs}
                canSeeCandidates={isCompanyApproved}
                token={token}
                goToTab={goToTab}
                onViewApplications={(job) => {
                  setSelectedApplicationsJob(job);
                  setActiveTab('applications');
                }}
              />
            )}

            {activeTab === 'jobs' && (
              <JobsPage
                jobs={jobs}
                loadError={jobsError}
                token={token}
                goToTab={goToTab}
                handleUpdateJob={handleUpdateJob}
                handleDeleteJob={handleDeleteJob}
                handleTogglePauseJob={handleTogglePauseJob}
                onRefresh={() => fetchRecruiterData({ silent: true })}
                setAlertConfig={setAlertConfig}
                onViewApplications={(job) => {
                  setSelectedApplicationsJob(job);
                  setActiveTab('applications');
                }}
              />
            )}

            {activeTab === 'applications' && (
              <ApplicationsPage
                job={selectedApplicationsJob}
                jobs={jobs}
                loadError={jobsError}
                token={token}
                setAlertConfig={setAlertConfig}
                onBack={() => {
                  setSelectedApplicationsJob(null);
                  setActiveTab('jobs');
                }}
                onRefresh={() => fetchRecruiterData({ silent: true })}
              />
            )}

            {activeTab === 'candidates' && (
              <CandidatesPage jobs={jobs} token={token} setAlertConfig={setAlertConfig} />
            )}

            {activeTab === 'post-job' && (
              <PostJobPage
                company={company}
                user={user}
                token={token}
                handlePostJob={handlePostJob}
                goToTab={goToTab}
                setAlertConfig={setAlertConfig}
                onRefresh={fetchRecruiterData}
              />
            )}

            {activeTab === 'gigs' && (
              <GigsPage
                view={gigsView}
                onView={setGigsView}
                selectedGigId={selectedGigId}
                onSelectGig={setSelectedGigId}
                user={user}
                company={company}
                token={token}
                setAlertConfig={setAlertConfig}
              />
            )}

            {activeTab === 'verification' && (
              <CompanyProfilePage
                company={company}
                loadError={companyError}
                onRetry={() => fetchRecruiterData()}
                token={token}
                handleVerification={handleVerification}
                handleUpdateCompany={handleUpdateCompany}
                setAlertConfig={setAlertConfig}
              />
            )}

            {activeTab === 'support' && (
              <SupportPage
                token={token}
                user={user}
                theme="recruiter"
                onNotify={(message, type = 'success') => setAlertConfig({ message, type })}
              />
            )}

            {activeTab === 'billing' && (
              <BillingPage
                token={token}
                user={user}
                jobs={jobs}
                setAlertConfig={setAlertConfig}
                onRefresh={fetchRecruiterData}
              />
            )}
            </Suspense>
          </div>
        )}
      </main>

      {/* Top-Right Sliding Toast Notification */}
      {alertConfig && (
        formatAlertMessage(alertConfig.message, alertConfig.type, () => setAlertConfig(null))
      )}
    </>
  );
}
