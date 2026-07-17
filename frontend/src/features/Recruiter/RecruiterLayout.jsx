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
  DollarSign
} from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { putFileToS3 } from '../../services/uploadService';
import SidebarNavItem from '../../components/ui/SidebarNavItem';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { formatAlertMessage } from '../../utils/errorFormatter';

// Import subcomponents
import RecruiterJobs from './components/RecruiterJobs';
import RecruiterCandidates from './components/RecruiterCandidates';
import RecruiterPostJob from './components/RecruiterPostJob';
import RecruiterCompany from './components/RecruiterCompany';
import GigsMarketplace from '../Gigs/GigsMarketplace';

export default function RecruiterLayout({ user, token, activeTab, setActiveTab, handleLogout, theme, toggleTheme }) {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
        return true;
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to post opportunity', type: 'error' });
        return false;
      }
    } catch (err) {
      console.error('Error posting opportunity:', err);
      setAlertConfig({ message: 'Error posting opportunity', type: 'error' });
      return false;
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

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to manually delete this job opportunity? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await apiFetch(`/recruiter/jobs/${jobId}`, {
        token,
        method: 'DELETE'
      });
      if (res.ok) {
        setAlertConfig({ message: 'Job deleted successfully.', type: 'success' });
        fetchRecruiterData();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to delete job', type: 'error' });
      }
    } catch (err) {
      setAlertConfig({ message: 'Error deleting job', type: 'error' });
    }
  };

  const handleVerification = async (file) => {
    setSubmittingDoc(true);
    try {
      // 1. Request secure S3 upload URL from backend
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

      // 2. Upload file directly to S3
      const s3Res = await putFileToS3(uploadUrl, file, file.type, token);

      if (!s3Res.ok) {
        throw new Error('Failed to upload verification document to S3.');
      }

      // 3. Submit document URL to recruiter verification endpoint
      const res = await apiFetch('/recruiter/verify', {
        token,
        method: 'POST',
        json: { docUrl: publicUrl }
      });

      if (res.ok) {
        setAlertConfig({ message: 'Verification documents uploaded! Trust established.', type: 'success' });
        setDocLink(publicUrl);
        fetchRecruiterData();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Upload failed', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: err.message || 'Upload error', type: 'error' });
    } finally {
      setSubmittingDoc(false);
    }
  };

  const updateReqRating = (skillName, val) => {
    setReqs(prev => prev.map(r => r.skillName === skillName ? { ...r, minRating: parseInt(val) } : r));
  };

  const navItems = [
    { id: 'dashboard', icon: Briefcase, label: 'Job Dashboard' },
    { id: 'candidates', icon: User, label: 'Search Candidates' },
    { id: 'post-job', icon: Plus, label: 'Post New Job' },
    { id: 'gigs', icon: DollarSign, label: 'Gigs Marketplace' },
    { id: 'verification', icon: ShieldCheck, label: 'Verification Status' },
  ];

  const goToTab = (tabId) => {
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

      {/* Desktop hover backdrop blur overlay */}
      {isHovered && (
        <div className="hidden md:block fixed inset-0 left-20 bg-black/5 backdrop-blur-[2px] z-40 transition-all duration-300 pointer-events-none animate-fade-in"></div>
      )}

      {/* Sidebar */}
      {(() => {
        const isExpanded = isHovered || sidebarOpen;
        return (
          <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`h-screen fixed left-0 top-0 bg-surface-container flex flex-col py-6 px-3 border-r border-outline-variant z-50 transition-all duration-300 ${
              isExpanded ? 'w-64' : 'w-20'
            } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
          >
            <div className="mb-10 flex items-center justify-between px-2.5">
              <div className="flex flex-col gap-1.5 min-w-0 w-full">
                <img
                  src={isExpanded ? (theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp') : '/a_g_l_Background_Removed.png'}
                  alt="AlignGrade"
                  className={`w-auto object-contain transition-all duration-300 self-start pl-1 ${
                    isExpanded ? 'h-12' : 'h-10'
                  }`}
                />
                {isExpanded && (
                  <p className="text-[9px] font-mono uppercase tracking-wider text-on-surface-variant opacity-70 px-1 animate-fade-in">Recruiter Hub</p>
                )}
              </div>
              {isExpanded && (
                <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-on-surface-variant hover:text-on-surface" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-1">
              {navItems.map(item => (
                <SidebarNavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={() => goToTab(item.id)}
                  collapsed={!isExpanded}
                />
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-outline-variant space-y-4 px-1">
              <div className="flex items-center justify-between px-2.5">
                {isExpanded && <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant animate-fade-in">Theme</span>}
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              </div>
              <div className="flex items-center gap-3 px-2.5">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold shrink-0 overflow-hidden">
                  {company?.name?.charAt(0) || 'R'}
                </div>
                {isExpanded && (
                  <div className="min-w-0 animate-fade-in">
                    <p className="text-sm font-bold text-on-surface truncate">{company?.name || 'Loading...'}</p>
                    <p className="text-xs text-on-surface-variant truncate">Recruiter - {user?.regNo || 'REC001'}</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                title={isExpanded ? undefined : "Log Out"}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-error rounded-xl font-medium hover:bg-error-container transition-all text-sm"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {isExpanded && <span className="animate-fade-in truncate">Log Out</span>}
              </button>
            </div>
          </aside>
        );
      })()}

      {/* Main stage */}
      <main ref={mainRef} className="md:ml-20 flex-1 min-h-screen pt-24 md:pt-10 p-6 md:p-10 bg-background overflow-y-auto custom-scrollbar scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div key={activeTab} className="animate-fade-in">
            {activeTab === 'dashboard' && (
              <RecruiterJobs 
                jobs={jobs} 
                company={company} 
                token={token}
                handleUpdateJob={handleUpdateJob} 
                handleDeleteJob={handleDeleteJob} 
                onRefresh={fetchRecruiterData}
              />
            )}

            {activeTab === 'candidates' && (
              <RecruiterCandidates candidates={candidates} />
            )}

            {activeTab === 'post-job' && (
              <RecruiterPostJob 
                submittingJob={submittingJob}
                handlePostJob={handlePostJob}
              />
            )}

            {activeTab === 'gigs' && (
              <GigsMarketplace
                user={user}
                token={token}
                theme={theme}
                profile={null}
                onUpdateProfile={fetchRecruiterData}
              />
            )}

            {activeTab === 'verification' && (
              <RecruiterCompany 
                company={company}
                docLink={docLink}
                setDocLink={setDocLink}
                submittingDoc={submittingDoc}
                handleVerification={handleVerification}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Alert Modal Overlay */}
      {alertConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md shadow-2xl relative">
            {formatAlertMessage(alertConfig.message, alertConfig.type, () => setAlertConfig(null))}
          </div>
        </div>
      )}
    </>
  );
}
