import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import {
  Briefcase,
  User,
  LogOut,
  BookOpen,
  RefreshCw,
  Menu,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Lock,
  Zap,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy
} from 'lucide-react';
import { apiFetch, userMessage } from '../../../services/apiClient';
import { generateResumePdf } from '../../../services/resumePdf';
import { formatAlertMessage } from '../../../utils/errorFormatter';
import {
  PLATFORM_UNLOCK_PERCENT,
  getProfileCompletionDetails,
  hasGeneralInfo as hasGeneralInfoRule,
  hasIntroVideo as hasIntroVideoRule,
  isProfileComplete
} from '../../../utils/profileCompleteness';
import { isPremiumCandidate } from '../../../utils/jobAccess';
import SidebarNavItem from '../../../components/ui/SidebarNavItem';

// Import subcomponents
import StudentResume from '../components/StudentResume'; // always drawn off-screen for PDF downloads
import { lazyPage } from '../../../app/lazyPage';
import { PageLoader } from '../../../components/PageLoader';

// Each tab loads the first time it's opened.
const CandidateHome = lazyPage(() => import('../home/CandidateHome'));
const JobsPage = lazyPage(() => import('../jobs/JobsPage'));
const SkillsTestsPage = lazyPage(() => import('../tests/SkillsTestsPage'));
const ApplicationsPage = lazyPage(() => import('../applications/ApplicationsPage'));
const LearnPage = lazyPage(() => import('../learn/LearnPage'));
const ProfilePage = lazyPage(() => import('../profile/ProfilePage'));
const SupportPage = lazyPage(() => import('../../Support/SupportPage'));
const GigsPage = lazyPage(() => import('../gigs/GigsPage'));


export default function StudentLayout({ user, token, activeTab, setActiveTab, handleLogout, theme, toggleTheme, onOpenCompanyProfile, autoSelectOpportunity, setAutoSelectOpportunity }) {
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillsList, setSkillsList] = useState([]);
  const [resumeUrl, setResumeUrl] = useState('');
  const [wasComplete, setWasComplete] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  // Where the Gigs page starts ({ view: 'browse' | 'mine' }), a new object per link.
  const [gigsFocus, setGigsFocus] = useState(null);
  // List the Jobs page opens on when a link asks for one ('' = Can apply).
  const [opportunitiesSubTab, setOpportunitiesSubTab] = useState('');
  // Where the Applications page starts ({ stage, applicationId, jobId }), a new object per link.
  const [progressFocus, setProgressFocus] = useState(null);
  // A job to open on the Jobs page, from a Home card (company profiles use
  // autoSelectOpportunity). A new object per request, so the page knows it's new.
  // /job_brief links are handled by App.jsx (public job brief page).
  const [jobsFocus, setJobsFocus] = useState(null);

  // General Section
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [nationality, setNationality] = useState('');
  const [gender, setGender] = useState('');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredWorkModes, setPreferredWorkModes] = useState([]);
  const [preferredWorkTypes, setPreferredWorkTypes] = useState([]);
  const [preferredLocations, setPreferredLocations] = useState([]);
  const [openToAnyLocation, setOpenToAnyLocation] = useState(false);

  // Social Links
  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    github: '',
    hackerEarth: '',
    hackerRank: '',
    codechef: '',
    leetcode: '',
    codeforces: '',
    kaggle: '',
    portfolio: '',
    showLinkedin: false,
    showGithub: false,
    showHackerEarth: false,
    showHackerRank: false,
    showCodechef: false,
    showLeetcode: false,
    showCodeforces: false,
    showKaggle: false,
    showPortfolio: false,
  });

  // Education, Experience, Certificates, Projects
  const [educationList, setEducationList] = useState([]);
  const [experienceList, setExperienceList] = useState([]);
  const [certificatesList, setCertificatesList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [cocurricular, setCocurricular] = useState([]);

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [techSkills, setTechSkills] = useState([]);
  const [loadingTechSkills, setLoadingTechSkills] = useState(false);

  // A test to open on the Skills & tests page ({ skill, need, opens }), a new object per request.
  const [testFocus, setTestFocus] = useState(null);
  const [learnFocus, setLearnFocus] = useState(null);
  const [profileFocus, setProfileFocus] = useState(null); // { section: 'video' } opens the intro video dialog

  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsError, setApplicationsError] = useState('');

  const fetchStudentApplications = async () => {
    setLoadingApplications(true);
    try {
      const res = await apiFetch('/student/applications', { token });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data)) {
        setApplications(data);
        setApplicationsError('');
      } else {
        setApplicationsError(res.status >= 500 || !data?.error ? 'Your applications couldn’t be loaded. Try again.' : data.error);
      }
    } catch (err) {
      setApplicationsError(userMessage(err, 'Your applications couldn’t be loaded. Try again.'));
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'progress') {
      fetchStudentApplications();
    }
  }, [activeTab, token]);

  const hasGeneralInfo = hasGeneralInfoRule(profile);
  const hasIntroVideo = hasIntroVideoRule(profile);
  const isComplete = isProfileComplete(profile);
  const profilePercent = getProfileCompletionDetails(profile).percentage;
  const unlockMessage = `Please fill in **About you** and complete **${PLATFORM_UNLOCK_PERCENT}%** of your profile to unlock this section. You’re at ${profilePercent}%.`;

  // Copies a profile from the API into the layout state (used by the load and by
  // saves, which answer with the updated profile).
  const applyProfile = (profData) => {
    setProfile(profData);
    setResumeUrl(profData.resumeUrl || '');
    setSkillsList(profData.skills || []);

    setBio(profData.bio || '');
    setUsername(profData.username || '');
    setProfilePic(profData.profilePic || '');
    setNationality(profData.nationality || '');
    setGender(profData.gender || '');
    setProfileEmail(profData.email || user?.email || '');
    setDob(profData.dob || '');
    setPhone(profData.phone || '');
    setPreferredWorkModes(profData.preferredWorkModes || []);
    setPreferredWorkTypes(profData.preferredWorkTypes || []);
    setPreferredLocations(profData.preferredLocations || []);
    setOpenToAnyLocation(Boolean(profData.openToAnyLocation));
    setSocialLinks(profData.socialLinks || {
      linkedin: '',
      github: '',
      hackerEarth: '',
      hackerRank: '',
      codechef: '',
      leetcode: '',
      codeforces: '',
      kaggle: '',
      portfolio: '',
      showLinkedin: false,
      showGithub: false,
      showHackerEarth: false,
      showHackerRank: false,
      showCodechef: false,
      showLeetcode: false,
      showCodeforces: false,
      showKaggle: false,
      showPortfolio: false,
    });
    setEducationList(profData.education || []);
    setExperienceList(profData.experience || []);
    setCertificatesList(profData.certificates || []);
    setProjectsList(profData.projects || []);
    let cocurArr = [];
    if (Array.isArray(profData.cocurricular)) {
      cocurArr = profData.cocurricular;
    } else if (profData.cocurricular) {
      cocurArr = [{ activity: 'Co-curricular Activity', link: profData.cocurricular, description: '' }];
    }
    setCocurricular(cocurArr);
  };

  // Job matches depend on skills and preferences, so saves refresh them quietly.
  const refreshJobs = async () => {
    const jobsRes = await apiFetch('/student/jobs', { token });
    const jobsData = await jobsRes.json();
    if (jobsRes.ok) {
      setJobs(jobsData);
    }
  };

  // `options.silent` refreshes without the full-page spinner.
  const fetchProfileAndJobs = async (options) => {
    const silent = Boolean(options?.silent);
    if (!silent) setLoading(true);
    try {
      const profRes = await apiFetch('/student/profile', { token });
      const profData = await profRes.json();
      if (profRes.ok) {
        applyProfile(profData);
      }
      await refreshJobs();
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndJobs();
    fetchTechnicalSkills();
    fetchStudentApplications();
  }, [token]);

  // Switches on the candidate font (Inter, styles/index.css) for the whole document, so modals
  // and the full-screen test layer get it too.
  useEffect(() => {
    document.body.classList.add('candidate-app');
    return () => document.body.classList.remove('candidate-app');
  }, []);

  useEffect(() => {
    if (user?.email && !profileEmail) {
      setProfileEmail(user.email);
    }
  }, [user?.email, profileEmail]);

  useEffect(() => {
    if (!loading && profile) {
      const complete = isProfileComplete(profile);
      
      if (wasComplete === false && complete === true) {
        // The profile just reached the unlock level; stay on the Profile page and say so.
        setAlertConfig({ message: `Your profile is ${PLATFORM_UNLOCK_PERCENT}% complete, so jobs, tests, courses and gigs are unlocked.`, type: 'success' });
      }
      setWasComplete(complete);

      // Help & support stays open so someone stuck on their profile can still ask for help.
      if (!complete && activeTab !== 'profile' && activeTab !== 'support') {
        setActiveTab('profile');
      }
    }
  }, [loading, profile, activeTab, setActiveTab, wasComplete]);

  const fetchTechnicalSkills = async () => {
    setLoadingTechSkills(true);
    try {
      const res = await apiFetch('/student/tests/skills', { token });
      if (res.ok) {
        const data = await res.json();
        setTechSkills(data.technicalSkills || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTechSkills(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tests') {
      fetchTechnicalSkills();
    }
  }, [activeTab]);

  // Opens a skill test (its intro; the questions are fetched when the candidate presses
  // Start). Tests stay locked until the profile reaches the unlock level (the server also
  // checks the General tab on /student/tests/generate). A skill that isn't on the
  // profile yet is added by the server with the score from the test.
  const openTest = ({ skillName, need = 0, opens = '' }) => {
    if (!isComplete) {
      setAlertConfig({
        message: unlockMessage,
        type: 'warning'
      });
      setActiveTab('profile');
      return;
    }
    goToTab('tests');
    setTestFocus({ skill: skillName, need, opens });
  };

  // PUT /student/profile replaces the profile, so every field is resent;
  // `changes` overrides the fields being saved.
  const buildProfilePayload = (changes = {}) => ({
    name: profile?.name,
    username,
    profilePic,
    resumeUrl,
    skills: skillsList,
    bio,
    nationality,
    gender,
    email: profileEmail,
    dob,
    phone,
    socialLinks,
    education: educationList,
    experience: experienceList,
    certificates: certificatesList,
    projects: projectsList,
    cocurricular,
    preferredWorkModes,
    preferredWorkTypes,
    preferredLocations,
    openToAnyLocation,
    ...changes
  });

  // Saves the full profile with an updated skills list.
  const saveSkillsList = (updatedSkills) => apiFetch('/student/profile', {
    token,
    method: 'PUT',
    json: buildProfilePayload({ skills: updatedSkills })
  });

  // Saves changes made on the Profile page. Resolves to { ok, error }; the layout
  // state only changes once the server has accepted the save.
  const saveProfileChanges = async (changes) => {
    try {
      const res = await apiFetch('/student/profile', {
        token,
        method: 'PUT',
        json: buildProfilePayload(changes)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: body.error || 'Your changes couldn’t be saved. Please try again.' };
      }
      applyProfile({ ...body, plan: profile?.plan });
      refreshJobs().catch((err) => console.error('[profile] Could not refresh job matches:', err));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: userMessage(err, 'Your changes couldn’t be saved. Please try again.') };
    }
  };

  // For required skills with no test in the question bank: add the skill as a
  // self-rated skill (the server accepts self-ratings only for untestable skills).
  const handleAddSkillWithoutTest = async ({ skillName, rating }) => {
    const exists = (skillsList || []).some(s => s.name?.toLowerCase() === skillName?.toLowerCase());
    if (exists) {
      setAlertConfig({ message: `**${skillName}** is already on your profile.`, type: 'info' });
      return { success: true };
    }
    const safeRating = Math.min(10, Math.max(1, parseInt(rating, 10) || 1));
    try {
      const res = await saveSkillsList([...(skillsList || []), { name: skillName, rating: safeRating }]);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setAlertConfig({ message: d.error || `Could not add **${skillName}** to your profile. Please try again.`, type: 'error' });
        return { success: false };
      }
      await fetchProfileAndJobs({ silent: true });
      setAlertConfig({
        message: `**${skillName}** was added to your profile without a skill test (self-rated Level ${safeRating}/10).`,
        type: 'success'
      });
      return { success: true };
    } catch (err) {
      console.error('Failed to add skill without test:', err);
      setAlertConfig({ message: 'Network error adding the skill. Please try again.', type: 'error' });
      return { success: false };
    }
  };



  const handleDownloadGeneratedResume = async () => {
    setGeneratingPdf(true);
    try {
      const element = document.getElementById('resume-pdf-template');
      if (!element) {
        alert('Resume template element not found.');
        setGeneratingPdf(false);
        return;
      }

      // Render template to an A4 PDF and trigger download
      await generateResumePdf(element, `${profile?.name || 'Resume'}_Generated_Resume.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Check browser console.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Sends an application. Resolves to { success, error }; the Jobs page shows the
  // result in its apply dialog, then jobs and applications refresh quietly.
  const handleApply = async (jobId, answers = []) => {
    try {
      const res = await apiFetch(`/student/jobs/${jobId}/apply`, {
        token,
        method: 'POST',
        json: { answers }
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return { success: false, error: d.error || 'Your application couldn’t be sent. Try again.' };
      }
      await Promise.all([fetchProfileAndJobs({ silent: true }), fetchStudentApplications()]);
      return { success: true };
    } catch (err) {
      return { success: false, error: userMessage(err, 'Your application couldn’t be sent. Try again.') };
    }
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', locked: !isComplete },
    { id: 'opportunities', icon: Briefcase, label: 'Opportunities', locked: !isComplete },
    { id: 'profile', icon: User, label: 'Your Profile', locked: false },
    { id: 'tests', icon: BookOpen, label: 'Your Tests', locked: !isComplete },
    { id: 'progress', icon: ClipboardList, label: 'Your Job Progress', locked: !isComplete },
    { id: 'courses', icon: GraduationCap, label: 'Courses', locked: !isComplete },
    { id: 'gigs', icon: Zap, label: 'Gigs Marketplace', locked: !isComplete },
    { id: 'support', icon: LifeBuoy, label: 'Help & support', locked: false },
  ];

  const goToTab = (tabId, options = {}) => {
    const item = navItems.find(i => i.id === tabId);
    if (item && item.locked) {
      setAlertConfig({
        message: unlockMessage,
        type: 'warning'
      });
      return;
    }
    if (tabId === 'opportunities') {
      setOpportunitiesSubTab(options.subTab || '');
    }
    if (tabId === 'gigs') {
      setGigsFocus({ view: options.view === 'mine' ? 'mine' : 'browse' });
    }
    if (tabId === 'courses') {
      setLearnFocus({ skill: options.skill || '' });
    }
    if (tabId === 'profile') {
      setProfileFocus({ section: options.section || '' });
    }
    if (tabId === 'progress') {
      setProgressFocus({ stage: options.stage || 'ALL', applicationId: options.applicationId || null, jobId: options.jobId || null });
    }
    // A job or gig opened from elsewhere only applies to that visit of its page.
    if (tabId !== 'opportunities') {
      setJobsFocus(null);
      if (autoSelectOpportunity?.type === 'job') setAutoSelectOpportunity?.(null);
    }
    if (tabId !== 'gigs' && autoSelectOpportunity?.type === 'gig') setAutoSelectOpportunity?.(null);
    setTestFocus(null); // openTest sets its request right after this
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const isPremium = isPremiumCandidate(profile, user);
  // The Profile and Home pages paint their own background and padding; <main> must
  // not be a scroll container there so the Profile section bar can stick to the top.
  const isFullBleedPage = ['profile', 'dashboard', 'opportunities', 'progress', 'gigs', 'tests', 'courses', 'support'].includes(activeTab) && !loading;

  // The saved profile as the Profile page reads it (field names as the API uses them).
  const profileData = useMemo(() => ({
    ...profile,
    name: profile?.name || '',
    username,
    profilePic,
    bio,
    gender,
    email: profileEmail,
    dob,
    phone,
    socialLinks,
    resumeUrl,
    preferredWorkModes,
    preferredWorkTypes,
    preferredLocations,
    openToAnyLocation,
    skills: skillsList,
    education: educationList,
    experience: experienceList,
    certificates: certificatesList,
    projects: projectsList,
    cocurricular,
    introVideoUrl: profile?.introVideoUrl || ''
  }), [profile, username, profilePic, bio, gender, profileEmail, dob, phone, socialLinks, resumeUrl, preferredWorkModes, preferredWorkTypes, preferredLocations, openToAnyLocation, skillsList, educationList, experienceList, certificatesList, projectsList, cocurricular]);

  // Home cards open the job on the Jobs page.
  const openJob = (job) => {
    setJobsFocus({ id: job.id });
    goToTab('opportunities');
  };

  // Smoothly scroll the main content area back to the top whenever the
  // active menu section or job brief changes or an alert is displayed, instead of jumping abruptly.
  // Not for alerts on the Profile page: it is one long scrolling page and its save
  // messages would otherwise throw the candidate back to the top after every save.
  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  useEffect(scrollToTop, [activeTab]);
  useEffect(() => {
    if (alertConfig && !['profile', 'opportunities', 'gigs', 'tests', 'courses', 'support'].includes(activeTab)) scrollToTop();
    // Only a new alert should scroll; tab changes are handled above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertConfig]);

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
            className={`h-screen fixed left-0 top-0 bg-surface-container flex flex-col py-6 px-3 border-r border-outline-variant z-50 transition-all duration-300 ${
              isExpandedState ? 'w-64' : 'w-20'
            } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
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
                    className="p-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-outline-variant transition-all cursor-pointer shadow-xs"
                    title="Open sidebar"
                    aria-label="Open sidebar"
                  >
                    <ChevronRight className="w-4 h-4" />
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
                    <p className="text-[11px] font-headline font-medium text-on-surface-variant opacity-70 px-1 animate-fade-in">Candidate Dashboard</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setSidebarOpen(false);
                    }}
                    className="p-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-outline-variant transition-all cursor-pointer shadow-xs"
                    title="Close sidebar"
                    aria-label="Close sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
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

            <div className="mt-auto pt-6 border-t border-outline-variant space-y-4 px-1">
              <div className="flex items-center gap-3 px-2.5">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold shrink-0 overflow-hidden">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.charAt(0) || 'S'
                  )}
                </div>
                {isExpandedState && (
                  <div className="min-w-0 animate-fade-in">
                    <p className="text-sm font-bold text-on-surface truncate">{profile?.name || 'Loading...'}</p>
                    <p className="text-xs text-on-surface-variant truncate">Candidate - {user?.regNo || 'CAN001'}</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                title={isExpandedState ? undefined : "Log Out"}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-error rounded-xl font-medium hover:bg-error-container transition-all text-sm cursor-pointer"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {isExpandedState && <span className="animate-fade-in truncate">Log Out</span>}
              </button>
            </div>
          </aside>
        );
      })()}

      {/* Main stage */}
      {/* Desktop: content margin tracks the sidebar width so expanding it pushes content instead of overlapping it */}
      <main
        ref={mainRef}
        className={`${isExpanded ? 'md:ml-64' : 'md:ml-20'} ${isFullBleedPage ? 'bg-[#F4F6FE] pt-16 md:pt-0' : 'bg-background pt-24 md:pt-10 p-6 md:p-10 overflow-y-auto custom-scrollbar scroll-smooth'} relative transition-[margin] duration-300 ease-in-out flex-1 min-w-0 min-h-screen`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div key={activeTab} className="animate-fade-in">
            {/* Profile set-up reminder; the Profile page shows its own set-up card. */}
            {!isComplete && activeTab !== 'profile' && activeTab !== 'support' && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-200 rounded-none text-xs flex flex-col gap-2 shadow-2xs">
                <div className="flex items-center gap-2 font-headline font-bold text-sm text-blue-800 dark:text-blue-300 tracking-wider">
                  <Lock className="w-4 h-4 shrink-0 text-blue-700 dark:text-blue-400" />
                  <span>Mandatory Profile Setup Incomplete</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-sans">
                  To unlock Dashboard, Opportunities, Your Tests, Job Progress, Courses, and Gigs Marketplace, please finish your profile:
                </p>
                <ul className="list-disc pl-5 space-y-1 font-sans font-semibold text-slate-900 dark:text-slate-100">
                  {!hasGeneralInfo && <li>Fill in About you on Your Profile (name, username, short intro, date of birth, mobile number, email and gender)</li>}
                  <li>Complete {PLATFORM_UNLOCK_PERCENT}% of your profile (you’re at {profilePercent}%)</li>
                </ul>
              </div>
            )}

            <Suspense fallback={<PageLoader />}>
                {activeTab === 'dashboard' && (
                  <CandidateHome
                    profile={profile}
                    user={user}
                    jobs={jobs}
                    applications={applications}
                    techSkills={techSkills}
                    goToTab={goToTab}
                    onSelectJob={openJob}
                    onTakeTest={openTest}
                  />
                )}

                {activeTab === 'opportunities' && (
                  <JobsPage
                    profile={profileData}
                    user={user}
                    token={token}
                    jobs={jobs}
                    isPremium={isPremium}
                    initialSubTab={opportunitiesSubTab}
                    focus={autoSelectOpportunity?.type === 'job' ? autoSelectOpportunity : jobsFocus}
                    onApply={handleApply}
                    onTakeTest={openTest}
                    onAddSkillWithoutTest={handleAddSkillWithoutTest}
                    onOpenCompanyProfile={onOpenCompanyProfile}
                    goToTab={goToTab}
                    onPlanUpgraded={() => fetchProfileAndJobs({ silent: true })}
                    onNotify={(message, type = 'success') => setAlertConfig({ message, type })}
                  />
                )}

            {activeTab === 'profile' && (
              <ProfilePage
                data={profileData}
                user={user}
                token={token}
                focus={profileFocus}
                generalDone={hasGeneralInfo}
                videoDone={hasIntroVideo}
                unlocked={isComplete}
                techSkills={techSkills}
                jobsCount={jobs.length}
                isPremium={isPremium}
                generatingPdf={generatingPdf}
                onDownloadResume={handleDownloadGeneratedResume}
                onSaveProfile={saveProfileChanges}
                onIntroVideoSaved={(url) => setProfile(prev => ({ ...prev, introVideoUrl: url || null }))}
                onPlanUpgraded={() => fetchProfileAndJobs({ silent: true })}
                onNotify={(message, type = 'success') => setAlertConfig({ message, type })}
              />
            )}

            {/* Off-screen Resume Template for PDF generation triggered from Profile page */}
            <div
              aria-hidden="true"
              style={{
                position: 'fixed',
                left: '-9999px',
                top: '-9999px',
                pointerEvents: 'none'
              }}
            >
              <StudentResume
                profile={profile}
                generatingPdf={generatingPdf}
                handleDownloadGeneratedResume={handleDownloadGeneratedResume}
                phone={phone}
                profileEmail={profileEmail}
                nationality={nationality}
                socialLinks={socialLinks}
                educationList={educationList}
                experienceList={experienceList}
                certificatesList={certificatesList}
                skillsList={skillsList}
                projectsList={projectsList}
              />
            </div>

            {activeTab === 'tests' && (
              <SkillsTestsPage
                profile={profileData}
                techSkills={techSkills}
                loading={loadingTechSkills}
                jobs={jobs}
                token={token}
                focus={testFocus}
                sidebarExpanded={isExpanded}
                onFinished={() => Promise.all([fetchProfileAndJobs({ silent: true }), fetchTechnicalSkills()])}
                onSaveSkills={(skills) => saveProfileChanges({ skills })}
                onOpenJob={openJob}
                goToTab={goToTab}
                onNotify={(message, type = 'success') => setAlertConfig({ message, type })}
              />
            )}

            {activeTab === 'progress' && (
              <ApplicationsPage
                applications={applications}
                loading={loadingApplications}
                error={applicationsError}
                onRetry={fetchStudentApplications}
                profile={profileData}
                jobs={jobs}
                focus={progressFocus}
                goToTab={goToTab}
              />
            )}

            {activeTab === 'support' && (
              <SupportPage
                token={token}
                user={user}
                theme="candidate"
                onNotify={(message, type = 'success') => setAlertConfig({ message, type })}
              />
            )}

            {activeTab === 'courses' && (
              <LearnPage profile={profileData} jobs={jobs} token={token} focus={learnFocus} onTakeTest={openTest} />
            )}

            {activeTab === 'gigs' && (
              <GigsPage
                profile={profileData}
                user={user}
                token={token}
                isPremium={isPremium}
                jobsCount={jobs.length}
                focus={autoSelectOpportunity?.type === 'gig' ? autoSelectOpportunity : gigsFocus}
                onTakeTest={openTest}
                onAddSkillWithoutTest={handleAddSkillWithoutTest}
                onOpenCompanyProfile={onOpenCompanyProfile}
                goToTab={goToTab}
                onPlanUpgraded={() => fetchProfileAndJobs({ silent: true })}
                onNotify={(message, type = 'success') => setAlertConfig({ message, type })}
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
