import React, { useState } from 'react';
import { adminApi } from '../api/adminApi';
import {
  LayoutDashboard,
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  Award, 
  HardDrive, 
  BarChart3, 
  FileSpreadsheet, 
  Settings, 
  Activity, 
  CheckCircle2, 
  Search, 
  Download, 
  Server, 
  TrendingUp, 
  AlertTriangle,
  Menu,
  X,
  FileCheck,
  RefreshCw,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [stats, setStats] = useState({
    totalStudents: '...',
    totalRecruiters: '...',
    activeJobs: '...',
    verifiedCerts: '...',
    storageSize: '...',
    recentStudents: []
  });

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [recruiters, setRecruiters] = useState([]);
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobApplicants, setSelectedJobApplicants] = useState(null);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showAllRecruiterSkills, setShowAllRecruiterSkills] = useState(false);
  const [showAllStudentSkills, setShowAllStudentSkills] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardStats = () => {
    return adminApi.getDashboardStats()
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(err => console.error('Error fetching admin stats:', err));
  };

  const fetchStudents = () => {
    setLoadingStudents(true);
    return adminApi.getStudents()
      .then(data => {
        if (data.success) {
          setStudents(data.students);
        }
        setLoadingStudents(false);
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        setLoadingStudents(false);
      });
  };

  const fetchRecruiters = () => {
    setLoadingRecruiters(true);
    return adminApi.getRecruiters()
      .then(data => {
        if (data.success) {
          setRecruiters(data.recruiters);
        }
        setLoadingRecruiters(false);
      })
      .catch(err => {
        console.error('Error fetching recruiters:', err);
        setLoadingRecruiters(false);
      });
  };

  const fetchJobs = () => {
    setLoadingJobs(true);
    return adminApi.getJobs()
      .then(data => {
        if (data.success) {
          setJobs(data.jobs);
        }
        setLoadingJobs(false);
      })
      .catch(err => {
        console.error('Error fetching jobs:', err);
        setLoadingJobs(false);
      });
  };

  const fetchStorage = () => {
    setLoadingStorage(true);
    return adminApi.getStorage()
      .then(data => {
        if (data.success) {
          setStorageInfo(data);
        }
        setLoadingStorage(false);
      })
      .catch(err => {
        console.error('Error fetching S3 metrics:', err);
        setLoadingStorage(false);
      });
  };

  const fetchAnalytics = () => {
    setLoadingAnalytics(true);
    return adminApi.getAnalytics()
      .then(data => {
        if (data.success) {
          setAnalyticsData(data);
        }
        setLoadingAnalytics(false);
      })
      .catch(err => {
        console.error('Error fetching analytics metrics:', err);
        setLoadingAnalytics(false);
      });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'dashboard') await fetchDashboardStats();
      else if (activeTab === 'students') await fetchStudents();
      else if (activeTab === 'recruiters') await fetchRecruiters();
      else if (activeTab === 'jobs') await fetchJobs();
      else if (activeTab === 'storage') await fetchStorage();
      else if (activeTab === 'analytics') await fetchAnalytics();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
    };
    window.addEventListener('admin-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('admin-unauthorized', handleUnauthorized);
    };
  }, []);

  React.useEffect(() => {
    if (token) {
      fetchDashboardStats();
    }
  }, [token]);

  React.useEffect(() => {
    if (token && activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab, token]);

  React.useEffect(() => {
    if (token && activeTab === 'recruiters') {
      fetchRecruiters();
    }
  }, [activeTab, token]);

  React.useEffect(() => {
    if (token && activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, token]);

  React.useEffect(() => {
    if (token && activeTab === 'storage') {
      fetchStorage();
    }
  }, [activeTab, token]);

  React.useEffect(() => {
    if (token && activeTab === 'jobs') {
      fetchJobs();
    }
  }, [activeTab, token]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setActiveTab('dashboard');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    adminApi.login(emailInput, passwordInput)
      .then(data => {
        if (data.success && data.token) {
          localStorage.setItem('adminToken', data.token);
          setToken(data.token);
          setEmailInput('');
          setPasswordInput('');
        } else {
          setAuthError(data.error || 'Invalid credentials');
        }
        setAuthLoading(false);
      })
      .catch(err => {
        setAuthError(err.message || 'Server error. Please try again.');
        setAuthLoading(false);
      });
  };

  const viewJobApplicants = (job) => {
    setSelectedJobForApplicants(job);
    setLoadingApplicants(true);
    setSelectedJobApplicants([]);
    adminApi.getJobApplicants(job.id)
      .then(data => {
        if (data.success) {
          setSelectedJobApplicants(data.applicants);
        }
        setLoadingApplicants(false);
      })
      .catch(err => {
        console.error('Error fetching job applicants:', err);
        setLoadingApplicants(false);
      });
  };

  // Sidebar navigation mapping
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students Directory', icon: Users },
    { id: 'recruiters', label: 'Recruiters Directory', icon: Building2 },
    { id: 'jobs', label: 'Active Jobs', icon: Briefcase },
    { id: 'storage', label: 'Storage Explorer', icon: HardDrive },
    { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
  ];

  // Mock data for analytics
  const kpiStats = [
    { label: 'Total Students', value: stats.totalStudents, change: '+12.5%', color: 'from-indigo-500 to-purple-500', icon: Users },
    { label: 'Total Recruiters', value: stats.totalRecruiters, change: '+8.3%', color: 'from-blue-500 to-sky-500', icon: Building2 },
    { label: 'Active Job Openings', value: stats.activeJobs, change: '+15.2%', color: 'from-emerald-500 to-teal-500', icon: Briefcase },
    { label: 'Certifications Verified', value: stats.verifiedCerts, change: '+22.1%', color: 'from-amber-500 to-orange-500', icon: Award },
  ];

  if (!token) {
    return (
      <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] flex items-center justify-center font-sans p-4 relative overflow-hidden select-none">
        {/* Decorative background gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md z-10">
          {/* Glassmorphic Chassis Container */}
          <div className="glass-card rounded-2xl p-8 md:p-10 border border-slate-900 relative shadow-2xl">
            {/* Corner Decorative Dots/Screws to match design details */}
            <div className="absolute top-3 left-3 w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="absolute top-3 right-3 w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="absolute bottom-3 right-3 w-1 h-1 rounded-full bg-slate-700"></div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
                <Settings className="w-3.5 h-3.5" />
                <span>Admin Gateway</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-headline">
                AlignGrade Workspace
              </h1>
              <p className="text-xs text-slate-400 mt-2">
                Enter your administrative credentials to manage verified candidates, audits, and settings.
              </p>
            </div>

            {authError && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@aligngrade.com"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 transition-all focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                  System Security Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 transition-all focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-semibold text-xs tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Authenticate Access</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] flex font-sans">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-all backdrop-blur-md"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Panel */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/80 border-r border-slate-900/60 backdrop-blur-xl flex flex-col py-6 px-4 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-sm text-white tracking-wide">AG</span>
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white leading-tight">AlignGrade</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Admin Workspace</p>
          </div>
        </div>

        {/* Navigation Tabs List */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-indigo-600/15 border-l-2 border-indigo-500 text-indigo-400 font-bold' 
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Database & AWS Health status card */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-900/80 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            <span>System Status</span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-300">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>MongoDB</span>
              </div>
              <span className="text-emerald-400 font-mono text-[10px]">Connected</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                <span>AWS S3</span>
              </div>
              <span className="text-emerald-400 font-mono text-[10px]">{stats.storageSize}</span>
            </div>
          </div>
        </div>

        {/* Log Out button */}
        <button
          onClick={handleLogout}
          className="mt-auto w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-rose-400 hover:bg-rose-950/25 border border-slate-900/40 hover:border-rose-900/30 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          Log Out Admin
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8 overflow-y-auto">
        
        {/* Top bar header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900/60">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time administration portal and platform verification dashboard.
            </p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Section'}
            </button>
          </div>
          
          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
              type="text" 
              placeholder="Quick search student, job..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-900 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
            />
          </div>
        </div>

        {/* Tab content conditional routing */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiStats.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md flex items-center justify-between shadow-sm hover:border-slate-800 transition-all">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 font-medium tracking-wide">{kpi.label}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-white tracking-tight">{kpi.value}</span>
                        <span className="text-[10px] font-bold text-emerald-400">{kpi.change}</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${kpi.color} p-0.5 shadow-md shadow-indigo-500/5`}>
                      <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom SVG Charts Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Enrollment Growth Chart */}
              <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-wide">Platform Enrollment Growth</h3>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Users Enrolled</span>
                </div>
                
                {/* SVG Graph rendering */}
                <div className="h-48 w-full relative pb-4">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="30" y1="10" x2="270" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="30" y1="36" x2="270" y2="36" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="30" y1="63" x2="270" y2="63" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="30" y1="90" x2="270" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                    
                    {/* Vertical grid lines */}
                    <line x1="30" y1="10" x2="30" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                    <line x1="110" y1="10" x2="110" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="190" y1="10" x2="190" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="270" y1="10" x2="270" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

                    {/* Y-Axis Label Numbers */}
                    <text x="5" y="13" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">12</text>
                    <text x="5" y="39" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">8</text>
                    <text x="5" y="66" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">4</text>
                    <text x="5" y="93" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">0</text>

                    {/* Stroke line connecting the dots */}
                    <path 
                      d="M 30 70 L 110 50 L 190 30 L 270 10" 
                      fill="none" 
                      stroke="#6366f1" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />

                    {/* Glowing Dots */}
                    {/* Point 1: Week 1 (3 users) */}
                    <circle cx="30" cy="70" r="5" fill="rgba(99, 102, 241, 0.2)" className="animate-pulse" />
                    <circle cx="30" cy="70" r="3" fill="#6366f1" stroke="#ffffff" strokeWidth="1" title="Week 1: 3 Users Enrolled" />

                    {/* Point 2: Week 2 (6 users) */}
                    <circle cx="110" cy="50" r="5" fill="rgba(99, 102, 241, 0.2)" className="animate-pulse" />
                    <circle cx="110" cy="50" r="3" fill="#6366f1" stroke="#ffffff" strokeWidth="1" title="Week 2: 6 Users Enrolled" />

                    {/* Point 3: Week 3 (9 users) */}
                    <circle cx="190" cy="30" r="5" fill="rgba(99, 102, 241, 0.2)" className="animate-pulse" />
                    <circle cx="190" cy="30" r="3" fill="#6366f1" stroke="#ffffff" strokeWidth="1" title="Week 3: 9 Users Enrolled" />

                    {/* Point 4: Week 4 (12 users) */}
                    <circle cx="270" cy="10" r="5" fill="rgba(99, 102, 241, 0.2)" className="animate-pulse" />
                    <circle cx="270" cy="10" r="3" fill="#6366f1" stroke="#ffffff" strokeWidth="1" title="Week 4: 12 Users Enrolled" />
                  </svg>
                  
                  {/* X-Axis labels */}
                  <div className="absolute left-[30px] right-0 bottom-[-4px] flex justify-between text-[8px] text-slate-500 font-mono">
                    <span className="w-16 text-center -ml-8">Week 1 - Jul</span>
                    <span className="w-16 text-center -ml-8">Week 2 - Jul</span>
                    <span className="w-16 text-center -ml-8">Week 3 - Jul</span>
                    <span className="w-16 text-center -ml-8">Week 4 - Jul</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown Circle Ring */}
              <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-6">
                <h3 className="text-sm font-bold text-white tracking-wide">User Roles Distribution</h3>
                
                {(() => {
                  const numStudents = parseInt(stats.totalStudents) || 0;
                  const numRecruiters = parseInt(stats.totalRecruiters) || 0;
                  const totalUsers = numStudents + numRecruiters;
                  const candPct = totalUsers > 0 ? Math.round((numStudents / totalUsers) * 100) : 0;
                  const recPct = totalUsers > 0 ? 100 - candPct : 0;

                  return (
                    <>
                      <div className="flex justify-center">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="15.915"
                              stroke="rgba(255,255,255,0.03)"
                              strokeWidth="3.5"
                              fill="none"
                            />
                            {totalUsers > 0 && (
                              <>
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15.915"
                                  stroke="#6366f1"
                                  strokeWidth="3.5"
                                  strokeDasharray={`${candPct} 100`}
                                  fill="none"
                                  strokeLinecap="round"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15.915"
                                  stroke="#10b981"
                                  strokeWidth="3.5"
                                  strokeDasharray={`${recPct} 100`}
                                  strokeDashoffset={`-${candPct}`}
                                  fill="none"
                                  strokeLinecap="round"
                                />
                              </>
                            )}
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-xl font-extrabold text-white tracking-tight">
                              {stats.totalStudents === '...' ? '...' : totalUsers}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">Total Users</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded bg-indigo-500"></span>
                            <span className="text-slate-400">Candidates</span>
                          </div>
                          <span className="font-bold text-white">
                            {stats.totalStudents === '...' ? '...' : `${numStudents} (${candPct}%)`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                            <span className="text-slate-400">Recruiters</span>
                          </div>
                          <span className="font-bold text-white">
                            {stats.totalRecruiters === '...' ? '...' : `${numRecruiters} (${recPct}%)`}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Recent Students Table Panel */}
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide">Recent Registrations</h3>
                <button onClick={() => setActiveTab('students')} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all">View All</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      <th className="py-3.5">Name</th>
                      <th className="py-3.5">Email</th>
                      <th className="py-3.5">Verified Skills</th>
                      <th className="py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {stats.recentStudents.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-slate-500 font-mono">No registrations found</td>
                      </tr>
                    ) : (
                      stats.recentStudents.map((student, index) => (
                        <tr key={index} className="hover:bg-slate-900/10">
                          <td className="py-4 font-bold text-white">{student.name}</td>
                          <td className="py-4 text-slate-400 font-mono">{student.email}</td>
                          <td className="py-4">{student.skills}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              student.status === 'Fully Verified'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Students Directory</h3>
                <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">{students.length} Registered</span>
              </div>

              {loadingStudents ? (
                <div className="text-center py-10 font-mono text-xs text-slate-500 animate-pulse">
                  Loading students...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-3.5">Name</th>
                        <th className="py-3.5">Email</th>
                        <th className="py-3.5">Verified Skills</th>
                        <th className="py-3.5">Nationality</th>
                        <th className="py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {students.filter(student => 
                        student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (student.username && student.username.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-500 font-mono">No students found</td>
                        </tr>
                      ) : (
                        students.filter(student => 
                          student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (student.username && student.username.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).map((student) => (
                          <tr key={student.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="py-4 font-bold text-white">{student.name}</td>
                            <td className="py-4 text-slate-400 font-mono">{student.email}</td>
                            <td className="py-4">
                              {student.skills && student.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {student.skills.slice(0, 3).map((s, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-indigo-400 font-mono font-medium">
                                      {s.name}
                                    </span>
                                  ))}
                                  {student.skills.length > 3 && <span className="text-[9px] text-slate-500">+{student.skills.length - 3}</span>}
                                </div>
                              ) : (
                                <span className="text-slate-500 font-mono text-[10px]">No skills added</span>
                              )}
                            </td>
                            <td className="py-4 text-slate-400">{student.nationality || 'N/A'}</td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => setSelectedStudent(student)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] tracking-wide transition-colors"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'recruiters' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Recruiters Directory</h3>
                <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">{recruiters.length} Registered</span>
              </div>

              {loadingRecruiters ? (
                <div className="text-center py-10 font-mono text-xs text-slate-500 animate-pulse">
                  Loading recruiters...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-3.5">Company Name</th>
                        <th className="py-3.5">Contact Email</th>
                        <th className="py-3.5">Verification</th>
                        <th className="py-3.5">Jobs Posted</th>
                        <th className="py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {recruiters.filter(recruiter => 
                        recruiter.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        recruiter.email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-500 font-mono">No recruiters found</td>
                        </tr>
                      ) : (
                        recruiters.filter(recruiter => 
                          recruiter.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          recruiter.email.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((recruiter) => (
                          <tr key={recruiter.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="py-4 font-bold text-white">{recruiter.companyName}</td>
                            <td className="py-4 text-slate-400 font-mono">{recruiter.email}</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                recruiter.verified 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {recruiter.verified ? 'Verified' : 'Pending Verification'}
                              </span>
                            </td>
                            <td className="py-4 text-slate-400 font-mono">{recruiter.jobs ? recruiter.jobs.length : 0} Jobs</td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => setSelectedRecruiter(recruiter)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] tracking-wide transition-colors"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Jobs Directory</h3>
                <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">{jobs.length} Active Openings</span>
              </div>

              {loadingJobs ? (
                <div className="text-center py-10 font-mono text-xs text-slate-500 animate-pulse">
                  Loading jobs...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.filter(job => 
                    job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    job.companyName.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="col-span-full py-10 text-center text-slate-500 font-mono text-xs">
                      No jobs found
                    </div>
                  ) : (
                    jobs.filter(job => 
                      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      job.companyName.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((job) => (
                      <div key={job.id} className="p-6 rounded-2xl bg-slate-950/60 border border-slate-900/80 hover:border-slate-800 transition-all flex flex-col justify-between space-y-4 shadow-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-extrabold text-sm text-white tracking-wide leading-snug">{job.title}</h4>
                              <p className="text-[10px] font-semibold text-slate-400 font-mono mt-0.5">{job.companyName}</p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] text-indigo-400 font-mono font-bold uppercase tracking-wider shrink-0">
                              {job.jobType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">{job.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-900/80 flex flex-col gap-3">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-semibold">
                            <span>📍 {job.location}</span>
                            <span className="text-emerald-400 font-bold">{job.salaryRange}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => setSelectedJob(job)}
                              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => viewJobApplicants(job)}
                              className="w-full py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 font-bold text-[9px] uppercase tracking-wider transition-all"
                            >
                              Who Applied
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-6 animate-fade-in">
            {/* Storage Explorer Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">S3 Storage Explorer</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Bucket: <span className="text-indigo-400">{storageInfo?.bucketName || '...'}</span> | Region: <span className="text-indigo-400">{storageInfo?.region || '...'}</span>
                </p>
              </div>
              {storageInfo?.isMock && (
                <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-mono font-bold rounded-lg uppercase tracking-wider shrink-0">
                  ⚠️ Local Sandbox Mode (Simulated Data)
                </span>
              )}
            </div>

            {loadingStorage ? (
              <div className="text-center py-20 font-mono text-xs text-slate-500 animate-pulse">
                Analyzing AWS S3 storage volumes...
              </div>
            ) : (
              <>
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Total Space Used</span>
                    <div className="text-2xl font-black text-white leading-none font-mono">
                      {storageInfo?.formattedTotalBytes || '0 Bytes'}
                    </div>
                    <span className="text-[9px] text-slate-400 block leading-tight font-medium">Accumulated size of all user assets</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Estimated Monthly Bill</span>
                    <div className="text-2xl font-black text-emerald-400 leading-none font-mono">
                      ${storageInfo?.estimatedMonthlyBill?.toFixed(4) || '0.0000'}
                    </div>
                    <span className="text-[9px] text-slate-400 block leading-tight font-medium">Based on Standard S3 rate ($0.023/GB)</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Total Objects Stored</span>
                    <div className="text-2xl font-black text-indigo-400 leading-none font-mono">
                      {storageInfo?.totalFiles || 0}
                    </div>
                    <span className="text-[9px] text-slate-400 block leading-tight font-medium">Total index of files in AWS bucket</span>
                  </div>
                </div>

                {/* Categories Summary Table */}
                <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-4">
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">Usage by Category</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          <th className="py-3">Asset Type</th>
                          <th className="py-3">Files Count</th>
                          <th className="py-3">Storage Space</th>
                          <th className="py-3 text-right">Est. Cost / Month</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40 font-mono text-[11px]">
                        {storageInfo?.categories && Object.entries(storageInfo.categories).map(([key, cat]) => (
                          <tr key={key} className="hover:bg-slate-900/10">
                            <td className="py-3.5 font-sans font-bold text-slate-200">{cat.name}</td>
                            <td className="py-3.5 text-slate-400">{cat.count} files</td>
                            <td className="py-3.5 text-slate-300">{cat.formattedBytes}</td>
                            <td className="py-3.5 text-right text-emerald-400 font-bold">${cat.cost.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* S3 Objects Browser Table */}
                <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-4">
                  <div className="flex justify-between items-center pb-2">
                    <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">AWS Bucket File List</h4>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">{storageInfo?.files?.length || 0} items listed</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          <th className="py-3.5">Filename</th>
                          <th className="py-3.5">Category</th>
                          <th className="py-3.5">File Size</th>
                          <th className="py-3.5">Last Modified</th>
                          <th className="py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40 font-mono text-[11px]">
                        {storageInfo?.files?.filter(file => 
                          file.key.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-6 text-center text-slate-500">No objects found</td>
                          </tr>
                        ) : (
                          storageInfo?.files?.filter(file => 
                            file.key.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((file, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-4 font-sans font-bold text-slate-200 max-w-[200px] truncate" title={file.key}>
                                {file.name}
                              </td>
                              <td className="py-4">
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-indigo-400 font-bold uppercase">
                                  {file.category}
                                </span>
                              </td>
                              <td className="py-4 text-slate-400">{file.formattedSize}</td>
                              <td className="py-4 text-slate-500 text-[10px]">
                                {new Date(file.lastModified).toLocaleString()}
                              </td>
                              <td className="py-4 text-right">
                                <a 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold text-[9px] uppercase tracking-wider transition-colors inline-block"
                                >
                                  Open File
                                </a>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MongoDB Storage Explorer */}
                <div className="pt-6 border-t border-slate-900/60 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">MongoDB Database Explorer</h3>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Database: <span className="text-indigo-400">{storageInfo?.mongoStats?.dbName || '...'}</span> | Total Documents: <span className="text-indigo-400">{storageInfo?.mongoStats?.totalDocuments || 0}</span>
                      </p>
                    </div>
                    {storageInfo?.mongoStats?.isMock && (
                      <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-mono font-bold rounded-lg uppercase tracking-wider shrink-0">
                        ⚠️ Local Sandbox Mode (Simulated Data)
                      </span>
                    )}
                  </div>

                  {/* MongoDB Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Total DB Storage Size</span>
                      <div className="text-2xl font-black text-white leading-none font-mono">
                        {storageInfo?.mongoStats?.formattedStorageSize || '0 Bytes'}
                      </div>
                      <span className="text-[9px] text-slate-400 block leading-tight font-medium">Disk space allocated for database records</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Estimated Monthly DB Bill</span>
                      <div className="text-2xl font-black text-emerald-400 leading-none font-mono">
                        ${storageInfo?.mongoStats?.estimatedMonthlyBill?.toFixed(4) || '0.0000'}
                      </div>
                      <span className="text-[9px] text-slate-400 block leading-tight font-medium">Based on Atlas Serverless storage rate ($0.10/GB)</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Total Index Size</span>
                      <div className="text-2xl font-black text-indigo-400 leading-none font-mono">
                        {storageInfo?.mongoStats?.formattedIndexSize || '0 Bytes'}
                      </div>
                      <span className="text-[9px] text-slate-400 block leading-tight font-medium">Total memory footprint of lookup indexes</span>
                    </div>
                  </div>

                  {/* Collections Breakdown Table */}
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-4">
                    <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">Usage by Collection</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            <th className="py-3">Collection Name</th>
                            <th className="py-3">Record Count</th>
                            <th className="py-3">Data Size</th>
                            <th className="py-3">Index Size</th>
                            <th className="py-3 text-right">Est. Cost / Month</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/40 font-mono text-[11px]">
                          {storageInfo?.mongoStats?.collections && storageInfo.mongoStats.collections.map((col, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/10">
                              <td className="py-3.5 font-sans font-bold text-slate-200">{col.name}</td>
                              <td className="py-3.5 text-slate-400">{col.count} documents</td>
                              <td className="py-3.5 text-slate-300">{col.formattedSize}</td>
                              <td className="py-3.5 text-slate-500">{col.formattedIndexSize}</td>
                              <td className="py-3.5 text-right text-emerald-400 font-bold">${col.cost.toFixed(6)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Platform Skills Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Real-time skills demand and supply tracking. Compare market skill requirements with candidate profiles.
              </p>
            </div>

            {loadingAnalytics ? (
              <div className="text-center py-20 font-mono text-xs text-slate-500 animate-pulse">
                Loading live platform metrics...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Recruiter Skill Demands Chart */}
                <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-6 flex flex-col justify-between animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">Most In-Demand Skills (Recruiters)</h4>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">Market Demand</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Ranked by the number of active job postings requiring each technical skill.
                    </p>
                  </div>

                  <div className="space-y-4 flex-1 pt-2">
                    {analyticsData?.recruiterSkills?.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-500 font-mono">No skill requirements recorded.</div>
                    ) : (
                      (showAllRecruiterSkills 
                        ? analyticsData?.recruiterSkills 
                        : analyticsData?.recruiterSkills?.slice(0, 8)
                      )?.map((skill, idx) => (
                        <div key={idx} className="group space-y-1.5 relative">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-300 group-hover:text-white transition-colors">{skill.name}</span>
                            <span className="text-indigo-400 font-mono">{skill.count} jobs ({skill.percentage}%)</span>
                          </div>
                          
                          {/* Horizontal Bar container */}
                          <div className="h-6 w-full bg-slate-900/80 rounded-lg overflow-hidden border border-slate-800/40 flex items-center relative">
                            {/* Animated colored bar */}
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-600/90 to-indigo-400/90 group-hover:from-indigo-500 group-hover:to-indigo-300 rounded-r-md transition-all duration-500 ease-out" 
                              style={{ width: `${Math.max(skill.percentage, 5)}%` }}
                              title={`Skill: ${skill.name} | Used in ${skill.count} active job postings (${skill.percentage}% of all requirements)`}
                            />
                            {/* Hover tooltip indicator */}
                            <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[9px] text-slate-400 font-mono pointer-events-none">
                              Click list to inspect jobs
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {analyticsData?.recruiterSkills?.length > 8 && (
                    <div className="pt-4 border-t border-slate-900/40 text-center">
                      <button
                        onClick={() => setShowAllRecruiterSkills(!showAllRecruiterSkills)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-indigo-400 font-mono font-bold rounded-xl transition-all uppercase tracking-wider"
                      >
                        {showAllRecruiterSkills ? 'Show Top 8 Only' : `View All (${analyticsData.recruiterSkills.length} skills)`}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Student Skill Preferences Chart */}
                <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md space-y-6 flex flex-col justify-between animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">Most Preferred Skills (Students)</h4>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Candidate Supply</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Ranked by the number of students listing or rating each skill in their profile pages.
                    </p>
                  </div>

                  <div className="space-y-4 flex-1 pt-2">
                    {analyticsData?.studentSkills?.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-500 font-mono">No student skills recorded.</div>
                    ) : (
                      (showAllStudentSkills 
                        ? analyticsData?.studentSkills 
                        : analyticsData?.studentSkills?.slice(0, 8)
                      )?.map((skill, idx) => (
                        <div key={idx} className="group space-y-1.5 relative">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-300 group-hover:text-white transition-colors">{skill.name}</span>
                            <span className="text-emerald-400 font-mono">{skill.count} students ({skill.percentage}%)</span>
                          </div>
                          
                          {/* Horizontal Bar container */}
                          <div className="h-6 w-full bg-slate-900/80 rounded-lg overflow-hidden border border-slate-800/40 flex items-center relative">
                            {/* Animated colored bar */}
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-600/90 to-emerald-400/90 group-hover:from-emerald-500 group-hover:to-emerald-300 rounded-r-md transition-all duration-500 ease-out" 
                              style={{ width: `${Math.max(skill.percentage, 5)}%` }}
                              title={`Skill: ${skill.name} | Listed by ${skill.count} students (${skill.percentage}% of all students)`}
                            />
                            {/* Hover tooltip indicator */}
                            <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[9px] text-slate-400 font-mono pointer-events-none">
                              Click list to inspect profiles
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {analyticsData?.studentSkills?.length > 8 && (
                    <div className="pt-4 border-t border-slate-900/40 text-center">
                      <button
                        onClick={() => setShowAllStudentSkills(!showAllStudentSkills)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-emerald-400 font-mono font-bold rounded-xl transition-all uppercase tracking-wider"
                      >
                        {showAllStudentSkills ? 'Show Top 8 Only' : `View All (${analyticsData.studentSkills.length} skills)`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback component rendering for non-implemented placeholder views */}
        {activeTab !== 'dashboard' && activeTab !== 'students' && activeTab !== 'recruiters' && activeTab !== 'jobs' && activeTab !== 'storage' && activeTab !== 'analytics' && (
          <div className="p-10 rounded-2xl bg-slate-950/20 border border-slate-900/60 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Module Scaffold Active</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The folder directory structure for <strong>{activeTab.replace('-', ' ')}</strong> has been successfully constructed in the codebase. Database routers and analytics metrics are fully mapped to bind live controllers here.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-slate-900/80 border border-slate-800 text-[10px] text-indigo-400 font-mono rounded-lg">
                Ready for API endpoints integrations
              </span>
            </div>
          </div>
        )}


      </main>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#090d16] border border-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedStudent.email}</p>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Row 1: Intro Video & General info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1-min video */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">1-Minute Video Resume</h4>
                  {selectedStudent.introVideoUrl ? (
                    <video 
                      src={selectedStudent.introVideoUrl} 
                      controls 
                      className="w-full rounded-xl border border-slate-900 bg-slate-950 aspect-video object-contain"
                    />
                  ) : (
                    <div className="h-48 rounded-xl border border-slate-900 bg-slate-950/40 flex items-center justify-center text-slate-500 font-mono text-xs">
                      No video resume uploaded
                    </div>
                  )}
                </div>

                {/* General Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">General Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase font-mono">Username</span>
                      <span className="text-slate-300 font-mono">@{selectedStudent.username}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase font-mono">Nationality</span>
                      <span className="text-slate-300">{selectedStudent.nationality || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase font-mono">Gender</span>
                      <span className="text-slate-300">{selectedStudent.gender || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase font-mono">Date of Birth</span>
                      <span className="text-slate-300 font-mono">{selectedStudent.dob || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[9px] text-slate-500 uppercase font-mono">Phone Number</span>
                      <span className="text-slate-300 font-mono">{selectedStudent.phone || 'N/A'}</span>
                    </div>
                  </div>

                  {selectedStudent.bio && (
                    <div className="pt-2">
                      <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">Biography</span>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{selectedStudent.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Skills & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-900/60">
                
                {/* Skills */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Technical & Non-Technical Skills</h4>
                  {selectedStudent.skills && selectedStudent.skills.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {selectedStudent.skills.map((skill, index) => (
                        <div key={index} className="p-2.5 rounded-xl bg-slate-950 border border-slate-900/80 flex items-center justify-between">
                          <span className="font-bold text-slate-300">{skill.name}</span>
                          <span className="text-indigo-400 text-[10px] font-bold">Rating: {skill.rating}/10</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-mono">No skills specified.</p>
                  )}
                </div>

                {/* Education */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Education History</h4>
                  {selectedStudent.education && selectedStudent.education.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedStudent.education.map((edu, index) => (
                        <div key={index} className="p-3 rounded-xl bg-slate-950 border border-slate-900/80 text-xs space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-200">{edu.institute}</span>
                            <span className="text-[9px] text-indigo-400 font-mono font-bold capitalize">{edu.eduType}</span>
                          </div>
                          <p className="text-slate-400 text-[11px] font-medium">
                            {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                          </p>
                          {(edu.startDate || edu.endDate) && (
                            <span className="block text-[10px] text-slate-500 font-mono font-medium">
                              {edu.startDate || 'N/A'} - {edu.endDate || 'Present'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-mono">No education history details.</p>
                  )}
                </div>
              </div>

              {/* Row 3: Experience & Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-900/60">
                
                {/* Experience */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Work Experience</h4>
                  {selectedStudent.experience && selectedStudent.experience.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedStudent.experience.map((exp, index) => (
                        <div key={index} className="p-3 rounded-xl bg-slate-950 border border-slate-900/80 text-xs space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-200">{exp.companyName}</span>
                            <span className="text-[9px] text-slate-500 font-mono font-bold">{exp.startDate || 'N/A'} - {exp.endDate || 'Present'}</span>
                          </div>
                          <p className="text-indigo-400 text-[11px] font-bold">{exp.designation}</p>
                          {exp.description && <p className="text-slate-400 text-[10px] leading-relaxed mt-1 font-medium">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-mono">No work experience history details.</p>
                  )}
                </div>

                {/* Projects */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Academic Projects</h4>
                  {selectedStudent.projects && selectedStudent.projects.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedStudent.projects.map((proj, index) => (
                        <div key={index} className="p-3 rounded-xl bg-slate-950 border border-slate-900/80 text-xs space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-200">{proj.title}</span>
                            <span className="text-[9px] text-indigo-400 font-mono font-bold">{proj.role}</span>
                          </div>
                          {proj.description && <p className="text-slate-400 text-[10px] leading-relaxed mt-1 font-medium">{proj.description}</p>}
                          <div className="flex gap-3 pt-1 text-[10px] font-mono font-bold">
                            {proj.codeUrl && <a href={proj.codeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Code Link</a>}
                            {proj.hostedUrl && <a href={proj.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Live Link</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-mono">No projects specified.</p>
                  )}
                </div>
              </div>

              {/* Row 4: Certifications & Co-curricular */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-900/60">
                
                {/* Certifications */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Certifications</h4>
                  {selectedStudent.certificates && selectedStudent.certificates.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedStudent.certificates.map((cert, index) => (
                        <div key={index} className="p-3 rounded-xl bg-slate-950 border border-slate-900/80 text-xs space-y-1">
                          <span className="font-bold text-slate-200 block">{cert.title}</span>
                          <span className="text-[11px] text-slate-400 block">{cert.org}</span>
                          {cert.certNumber && <span className="text-[10px] text-slate-500 font-mono font-medium block">ID: {cert.certNumber}</span>}
                          {cert.link && <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 font-mono font-bold underline block mt-1">Verification Link</a>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-mono">No certifications earned.</p>
                  )}
                </div>

                {/* Co-curricular */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Co-curricular & POR</h4>
                  {selectedStudent.cocurricular && Array.isArray(selectedStudent.cocurricular) && selectedStudent.cocurricular.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedStudent.cocurricular.map((act, index) => (
                        <div key={index} className="p-3 rounded-xl bg-slate-950 border border-slate-900/80 text-xs space-y-1">
                          <span className="font-bold text-slate-200 block">{act.activity}</span>
                          {act.description && <p className="text-slate-400 text-[10px] leading-relaxed mt-1 font-medium">{act.description}</p>}
                          {act.link && <a href={act.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 font-mono font-bold underline block mt-1">Activity Link</a>}
                        </div>
                      ))}
                    </div>
                  ) : selectedStudent.cocurricular && typeof selectedStudent.cocurricular === 'string' ? (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-900/80 text-xs space-y-1">
                      <span className="font-bold text-slate-200 block">Certificate Portfolio Link</span>
                      <a href={selectedStudent.cocurricular} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 font-mono font-bold underline block mt-1">
                        View Drive Link
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-mono">No co-curricular records.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Recruiter Profile Modal */}
      {selectedRecruiter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#090d16] border border-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedRecruiter.companyName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedRecruiter.email}</p>
              </div>
              <button 
                onClick={() => setSelectedRecruiter(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Verification Info */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Company Verification Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${selectedRecruiter.verified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    <span className="text-xs font-bold text-slate-200">
                      {selectedRecruiter.verified ? 'Verified Recruiter Profile' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                {selectedRecruiter.docUrl && (
                  <a 
                    href={selectedRecruiter.docUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-bold text-xs transition-all flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" /> View Verification Document
                  </a>
                )}
              </div>

              {/* Jobs Posted List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Jobs Posted ({selectedRecruiter.jobs ? selectedRecruiter.jobs.length : 0})</h4>
                
                {selectedRecruiter.jobs && selectedRecruiter.jobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRecruiter.jobs.map((job) => (
                      <div key={job.id} className="p-5 rounded-xl bg-slate-950 border border-slate-900/80 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-sm text-slate-200">{job.title}</h5>
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
                              {job.jobType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 font-medium">{job.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-900/80 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                            <span>📍 {job.location}</span>
                            <span className="text-emerald-400 font-bold">{job.salaryRange}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => setSelectedJob(job)}
                              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRecruiter(null);
                                viewJobApplicants(job);
                              }}
                              className="w-full py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 font-bold text-[9px] uppercase tracking-wider transition-all"
                            >
                              Who Applied
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-900/80 text-slate-500 font-mono text-xs">
                    No jobs posted yet.
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedRecruiter(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#090d16] border border-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedJob.title}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedJob.companyName}</p>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Job Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Location</span>
                  <span className="text-slate-300">📍 {selectedJob.location}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Salary Range</span>
                  <span className="text-emerald-400 font-bold">{selectedJob.salaryRange}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase font-mono">Job Type</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-wider inline-block">
                    {selectedJob.jobType}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-4 border-t border-slate-900/60">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Job Description</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-line">{selectedJob.description}</p>
              </div>

              {/* Requirements */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-900/60">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Skill Requirements</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {selectedJob.requirements.map((req, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-900/80 flex items-center justify-between">
                        <span className="font-bold text-slate-300">{req.skill}</span>
                        <span className="text-indigo-400 text-[10px] font-bold">Min Rating: {req.rating || req.minRating || 5}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Applicants List Modal */}
      {selectedJobForApplicants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#090d16] border border-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Candidates Applied</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedJobForApplicants.title} — {selectedJobForApplicants.companyName}
                </p>
              </div>
              <button 
                onClick={() => setSelectedJobForApplicants(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {loadingApplicants ? (
                <div className="text-center py-10 font-mono text-xs text-slate-500 animate-pulse">
                  Loading applicants list...
                </div>
              ) : selectedJobApplicants && selectedJobApplicants.length > 0 ? (
                <div className="space-y-3">
                  {selectedJobApplicants.map((applicant) => (
                    <div key={applicant.id} className="p-4 rounded-xl bg-slate-950 border border-slate-900/80 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">{applicant.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono font-medium block">@{applicant.username}</span>
                        <span className="text-xs text-slate-400 font-mono mt-1 block">{applicant.email}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedStudent(applicant)}
                        className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] tracking-wide uppercase transition-colors shrink-0"
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-950/40 rounded-xl border border-slate-900/80 text-slate-500 font-mono text-xs">
                  No candidates have applied to this job opening yet.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedJobForApplicants(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                Close List
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
