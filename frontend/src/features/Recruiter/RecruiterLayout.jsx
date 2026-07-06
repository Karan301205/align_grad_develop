import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  User,
  Plus,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import { API_BASE } from '../../constants';
import SidebarNavItem from '../../components/ui/SidebarNavItem';
import ThemeToggle from '../../components/ui/ThemeToggle';

// Import subcomponents
import RecruiterJobs from './components/RecruiterJobs';
import RecruiterCandidates from './components/RecruiterCandidates';
import RecruiterPostJob from './components/RecruiterPostJob';
import RecruiterCompany from './components/RecruiterCompany';

export default function RecruiterLayout({ user, token, activeTab, setActiveTab, handleLogout, theme, toggleTheme }) {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const fetchRecruiterData = async () => {
    setLoading(true);
    try {
      // Company Details
      const compRes = await fetch(`${API_BASE}/recruiter/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const compData = await compRes.json();
      if (compRes.ok) setCompany(compData);

      // Company Jobs
      const jobsRes = await fetch(`${API_BASE}/recruiter/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) setJobs(jobsData);

      // All Candidates
      const candRes = await fetch(`${API_BASE}/recruiter/candidates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const res = await fetch(`${API_BASE}/recruiter/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });
      if (res.ok) {
        alert('Job posted successfully!');
        fetchRecruiterData();
        setActiveTab('dashboard');
        return true;
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to post job');
        return false;
      }
    } catch (err) {
      alert('Error posting job');
      return false;
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleUpdateJob = async (jobId, jobData) => {
    try {
      const res = await fetch(`${API_BASE}/recruiter/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });
      if (res.ok) {
        alert('Job updated successfully!');
        fetchRecruiterData();
        return true;
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update job');
        return false;
      }
    } catch (err) {
      alert('Error updating job');
      return false;
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to manually delete this job opportunity? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/recruiter/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Job deleted successfully.');
        fetchRecruiterData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete job');
      }
    } catch (err) {
      alert('Error deleting job');
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setSubmittingDoc(true);
    try {
      const res = await fetch(`${API_BASE}/recruiter/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ docUrl: docLink })
      });
      if (res.ok) {
        alert('Verification documents uploaded! Trust established.');
        fetchRecruiterData();
      } else {
        const d = await res.json();
        alert(d.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload error');
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

      {/* Sidebar */}
      <aside className={`h-screen w-64 fixed left-0 top-0 bg-surface-container flex flex-col py-6 px-4 border-r border-outline-variant z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="mb-10 px-2 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <img
              src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
              alt="AlignGrade"
              className="h-12 w-auto object-contain self-start"
            />
            <p className="text-[9px] font-mono uppercase tracking-wider text-on-surface-variant opacity-70 px-0.5">Recruiter Hub</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-on-surface-variant hover:text-on-surface" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => goToTab(item.id)}
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-outline-variant space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Theme</span>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold shrink-0">
              {company?.name?.charAt(0) || 'R'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{company?.name || 'Loading...'}</p>
              <p className="text-xs text-on-surface-variant truncate">Recruiter</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-error rounded-xl font-medium hover:bg-error-container transition-all text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main stage */}
      <main ref={mainRef} className="md:ml-64 flex-1 min-h-screen pt-24 md:pt-10 p-6 md:p-10 bg-background overflow-y-auto custom-scrollbar scroll-smooth">
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
    </>
  );
}
