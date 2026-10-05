import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  User,
  Plus,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  LayoutDashboard,
  Users,
  Zap,
  Search
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';
import SidebarNavItem from '../../../components/ui/SidebarNavItem';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import { formatAlertMessage } from '../../../utils/errorFormatter';
import { isCompanyProfileComplete } from '../../../utils/profileCompleteness';

// Import subcomponents
import RecruiterDashboard from '../components/RecruiterDashboard';
import RecruiterJobs from '../components/RecruiterJobs';
import RecruiterCandidates from '../components/RecruiterCandidates';
import RecruiterPostJob from '../components/RecruiterPostJob';
import RecruiterCompany from '../components/RecruiterCompany';
import GigsMarketplace from '../../Gigs/GigsMarketplace';
import CommunityLayout from '../../Community/CommunityLayout';

export default function RecruiterLayout({ user, token, activeTab, setActiveTab, handleLogout, theme, toggleTheme }) {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [topTalents, setTopTalents] = useState([]);
  const [demandProfile, setDemandProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [gigsSubTab, setGigsSubTab] = useState('browse');
  const [isGigsOpen, setIsGigsOpen] = useState(true);
  const mainRef = useRef(null);

  // Job Posting state
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [reqs, setReqs] = useState([]);
  const [selectedReqSkill, setSelectedReqSkill] = useState('');
  const [submittingJob, setSubmittingJob] = useState(false);

  // Verification state
  const [docLink, setDocLink] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  const fetchRecruiterData = async () => {
    setLoading(true);
    try {
      // Company Details
      const compRes = await apiFetch('/recruiter/company', { token });
      const compData = await compRes.json();
      if (compRes.ok) setCompany(compData);

      // Company Jobs
      const jobsRes = await apiFetch('/recruiter/jobs', { token });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) setJobs(jobsData);

      // All Candidates
      const candRes = await apiFetch('/recruiter/candidates', { token });
      const candData = await candRes.json();
      if (candRes.ok) setCandidates(candData);

      // Top Matching Talents derived from Recruiter Demand Profile
      const talentsRes = await apiFetch('/recruiter/top-talents?limit=500', { token });
      const talentsData = await talentsRes.json();
      if (talentsRes.ok) {
        setTopTalents(talentsData.topTalents || []);
        setDemandProfile(talentsData.demandProfile || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiterData();
  }, [token]);

  const handlePostJob = async (jobData) => {
    setSubmittingJob(true);
    try {
      let res;
      if (jobData.opportunityType === 'GIG') {
        let uploadedUrl = null;
        if (jobData.attachmentFile) {
          const urlRes = await apiFetch('/upload/request-url', {
            token,
            method: 'POST',
            json: {
              fileType: 'doc',
              fileName: jobData.attachmentFile.name,
              contentType: jobData.attachmentFile.type
            }
          });
          if (urlRes.ok) {
            const { uploadUrl, publicUrl } = await urlRes.json();
            await putFileToS3(uploadUrl, jobData.attachmentFile, jobData.attachmentFile.type, token);
            uploadedUrl = publicUrl;
          }
        }

        const gigPayload = {
          title: jobData.title,
          description: jobData.description,
          skills: jobData.skills,
          budget: jobData.budget,
          deliveryTime: jobData.deliveryTime,
          attachments: uploadedUrl ? [uploadedUrl] : []
        };

        res = await apiFetch('/gigs', {
          token,
          method: 'POST',
          json: gigPayload
        });
      } else {
        res = await apiFetch('/recruiter/jobs', {
          token,
          method: 'POST',
          json: jobData
        });
      }

      if (res.ok) {
        setAlertConfig({ message: jobData.opportunityType === 'GIG' ? 'Gig posted successfully in Marketplace!' : 'Job posted successfully!', type: 'success' });
        fetchRecruiterData();
        setActiveTab(jobData.opportunityType === 'GIG' ? 'gigs' : 'dashboard');
        return { success: true };
      } else {
        const d = await res.json();
        return { success: false, error: d.error || 'Failed to post opportunity' };
      }
    } catch (err) {
      console.error('Error posting opportunity:', err);
      return { success: false, error: err.message || 'Error posting opportunity' };
    } finally {
      setSubmittingJob(false);
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
        fetchRecruiterData();
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to update job', type: 'error' });
        return false;
      }
    } catch (err) {
      setAlertConfig({ message: 'Error updating job', type: 'error' });
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
        fetchRecruiterData();
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to update job status', type: 'error' });
        return false;
      }
    } catch (err) {
      setAlertConfig({ message: 'Error updating job status', type: 'error' });
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
        fetchRecruiterData();
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to delete job', type: 'error' });
        return false;
      }
    } catch (err) {
      setAlertConfig({ message: 'Error deleting job', type: 'error' });
      return false;
    }
  };

  const handleVerification = async (docsOrFile, silent = false) => {
    setSubmittingDoc(true);
    try {
      let verificationDocs = [];
      let primaryDocUrl = null;

      if (Array.isArray(docsOrFile)) {
        verificationDocs = docsOrFile;
        primaryDocUrl = docsOrFile[0]?.docUrl || null;
      } else if (docsOrFile) {
        // Single file upload path
        const file = docsOrFile;
        const urlRes = await apiFetch('/upload/request-url', {
          token,
          method: 'POST',
          json: {
            fileType: 'doc',
            fileName: file.name,
            contentType: file.type
          }
        });

        if (!urlRes.ok) {
          throw new Error('Failed to request upload URL from server.');
        }

        const { uploadUrl, publicUrl } = await urlRes.json();
        const s3Res = await putFileToS3(uploadUrl, file, file.type, token);

        if (!s3Res.ok) {
          throw new Error('Failed to upload verification document to S3.');
        }

        primaryDocUrl = publicUrl;
        verificationDocs = [{ docType: 'Certificate of Incorporation', docUrl: publicUrl, fileName: file.name }];
      }

      // Submit document URLs to recruiter verification endpoint
      const res = await apiFetch('/recruiter/verify', {
        token,
        method: 'POST',
        json: {
          docUrl: primaryDocUrl,
          verificationDocs
        }
      });

      if (res.ok) {
        if (!silent) {
          setAlertConfig({ message: 'Verification documents confirmed! Trust established.', type: 'success' });
        }
        if (primaryDocUrl) setDocLink(primaryDocUrl);
        await fetchRecruiterData();
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Verification submission failed', type: 'error' });
        return false;
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: err.message || 'Verification submission error', type: 'error' });
      return false;
    } finally {
      setSubmittingDoc(false);
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
        await fetchRecruiterData();
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to update company profile', type: 'error' });
        return false;
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Error updating company profile', type: 'error' });
      return false;
    }
  };

  const updateReqRating = (skillName, val) => {
    setReqs(prev => prev.map(r => r.skillName === skillName ? { ...r, minRating: parseInt(val) } : r));
  };

  const isCompanyComplete = isCompanyProfileComplete(company);

  // If company profile is incomplete, automatically default to the verification (company profile) section
  useEffect(() => {
    if (!loading && !isCompanyComplete && activeTab !== 'verification') {
      setActiveTab('verification');
    }
  }, [loading, isCompanyComplete, activeTab]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', locked: !isCompanyComplete },
    { id: 'jobs', icon: Briefcase, label: 'Active Jobs', locked: !isCompanyComplete },
    { id: 'candidates', icon: User, label: 'Candidates', locked: !isCompanyComplete },
    { id: 'post-job', icon: Plus, label: 'Post New Job', locked: !isCompanyComplete },
    {
      id: 'gigs',
      icon: Zap,
      label: 'Gigs Marketplace',
      locked: !isCompanyComplete,
      subItems: [
        { id: 'browse', label: 'Browse Gigs', icon: Search },
        { id: 'post', label: 'Post a Gig', icon: Plus },
        { id: 'my-gigs', label: 'My Gigs Workspace', icon: Briefcase },
      ],
      activeSubId: gigsSubTab,
      onSubItemClick: (subId) => {
        if (!isCompanyComplete) {
          setAlertConfig({ message: 'Please complete the company profile.', type: 'warning' });
          return;
        }
        setGigsSubTab(subId);
        setActiveTab('gigs');
        setSidebarOpen(false);
      }
    },
    { id: 'verification', icon: ShieldCheck, label: 'Company Profile', locked: false },
  ];

  const goToTab = (tabId) => {
    if (tabId !== 'verification' && !isCompanyComplete) {
      setAlertConfig({ message: 'Please complete the company profile.', type: 'warning' });
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
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface-container border-b border-outline-variant flex items-center justify-between px-4 z-40">
        <div className="flex items-center">
          <img
            src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
            alt="AlignGrade"
            className="h-9 w-auto object-contain"
          />
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-on-surface-variant hover:text-on-surface" aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      {(() => {
        const isExpandedState = isExpanded || sidebarOpen;
        return (
          <aside
            className={`h-screen fixed left-0 top-0 bg-surface flex flex-col py-6 px-3 border-r border-slate-300 dark:border-slate-700 z-50 transition-all duration-300 ${
              isExpandedState ? 'w-64' : 'w-20'
            } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xs`}
          >
            <div className="mb-8 flex items-center justify-between px-1">
              {!isExpandedState ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <img
                    src="/a_g_l_Background_Removed.png"
                    alt="AlignGrade"
                    className="h-9 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="p-1.5 rounded-none bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                    title="Open sidebar"
                    aria-label="Open sidebar"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1 min-w-0">
                    <img
                      src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
                      alt="AlignGrade"
                      className="h-10 w-auto object-contain self-start pl-1"
                    />
                    <p className="text-[10px] font-headline font-bold tracking-wider text-slate-500 dark:text-slate-400 px-1 animate-fade-in">Recruiter Hub</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setSidebarOpen(false);
                    }}
                    className="p-1.5 rounded-none bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
                    title="Close sidebar"
                    aria-label="Close sidebar"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                </>
              )}
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-1">
              {navItems.map(item => (
                <SidebarNavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  locked={item.locked}
                  onClick={() => goToTab(item.id)}
                  collapsed={!isExpandedState}
                  subItems={item.subItems}
                  isOpen={item.isOpen}
                  onToggle={item.onToggle}
                  activeSubId={item.activeSubId}
                  onSubItemClick={item.onSubItemClick}
                />
              ))}
            </nav>

            <div className="mt-auto pt-5 border-t border-slate-300 dark:border-slate-700 space-y-3 px-1">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-none bg-blue-700 border border-blue-800 flex items-center justify-center text-white font-headline font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                  {company?.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    company?.name?.charAt(0) || 'R'
                  )}
                </div>
                {isExpandedState && (
                  <div className="min-w-0 animate-fade-in">
                    <p className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100 truncate">{company?.name || user?.name || user?.email || 'Recruiter'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-medium truncate">Recruiter - {user?.regNo || 'REC001'}</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                title={isExpandedState ? undefined : "Log Out"}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-600 dark:text-rose-400 rounded-none font-headline font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all text-xs cursor-pointer shadow-2xs"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {isExpandedState && <span className="animate-fade-in truncate">Log Out</span>}
              </button>
            </div>
          </aside>
        );
      })()}

      {/* Main stage */}
      <main ref={mainRef} className="md:ml-20 flex-1 h-screen pt-24 md:pt-10 p-6 md:p-10 bg-background overflow-y-auto custom-scrollbar scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div key={activeTab}>
            {activeTab === 'dashboard' && (
              <RecruiterDashboard
                company={company}
                jobs={jobs}
                candidates={candidates}
                topTalents={topTalents}
                demandProfile={demandProfile}
                goToTab={goToTab}
                onRefresh={fetchRecruiterData}
              />
            )}

            {activeTab === 'jobs' && (
              <RecruiterJobs 
                jobs={jobs} 
                company={company} 
                token={token}
                handleUpdateJob={handleUpdateJob} 
                handleDeleteJob={handleDeleteJob} 
                handleTogglePauseJob={handleTogglePauseJob}
                onRefresh={fetchRecruiterData}
              />
            )}

            {activeTab === 'candidates' && (
              <RecruiterCandidates candidates={candidates} topTalents={topTalents} />
            )}

            {activeTab === 'post-job' && (
              <RecruiterPostJob 
                company={company}
                user={user}
                submittingJob={submittingJob}
                handlePostJob={handlePostJob}
                recentJobs={jobs}
                goToTab={goToTab}
                setAlertConfig={setAlertConfig}
              />
            )}

            {activeTab === 'gigs' && (
              <GigsMarketplace
                user={user}
                token={token}
                theme={theme}
                profile={null}
                onUpdateProfile={fetchRecruiterData}
                activeSubTab={gigsSubTab}
                onSubTabChange={setGigsSubTab}
              />
            )}

            {activeTab === 'verification' && (
              <RecruiterCompany 
                company={company}
                token={token}
                docLink={docLink}
                setDocLink={setDocLink}
                submittingDoc={submittingDoc}
                handleVerification={handleVerification}
                handleUpdateCompany={handleUpdateCompany}
                setAlertConfig={setAlertConfig}
              />
            )}
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
