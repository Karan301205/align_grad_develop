import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  User,
  FileText,
  CheckCircle,
  LogOut,
  BookOpen,
  RefreshCw,
  Video,
  Award,
  Menu,
  X,
  ChevronRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Lock,
  DollarSign,
  Users,
  Zap
} from 'lucide-react';
import GigsMarketplace from '../Gigs/GigsMarketplace';
import { apiFetch } from '../../services/apiClient';
import { putFileToS3 } from '../../services/uploadService';
import { generateResumePdf } from '../../services/resumePdf';
import { formatAlertMessage } from '../../utils/errorFormatter';
import {
  hasGeneralInfo as hasGeneralInfoRule,
  hasSkills as hasSkillsRule,
  hasIntroVideo as hasIntroVideoRule,
  isProfileComplete
} from '../../utils/profileCompleteness';
import SidebarNavItem from '../../components/ui/SidebarNavItem';
import ThemeToggle from '../../components/ui/ThemeToggle';

// Import subcomponents
import StudentDashboard from './components/StudentDashboard';
import StudentProfile from './components/StudentProfile';
import StudentResume from './components/StudentResume';
import StudentSkillTests from './components/StudentSkillTests';
import StudentShowcase from './components/StudentShowcase';
import StudentProgress from './components/StudentProgress';


export default function StudentLayout({ user, token, activeTab, setActiveTab, testSkill, setTestSkill, handleLogout, theme, toggleTheme, onOpenCompanyProfile, autoSelectOpportunity, setAutoSelectOpportunity }) {
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillsList, setSkillsList] = useState([]);
  const [selectedNewSkill, setSelectedNewSkill] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [profileTab, setProfileTab] = useState('general');
  const [wasComplete, setWasComplete] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  
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

  // Builders local states
  const [newEdu, setNewEdu] = useState({ eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' });
  const [newExp, setNewExp] = useState({ expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' });
  const [newCert, setNewCert] = useState({ title: '', org: '', startDate: '', link: '', certNumber: '', attachment: '', description: '' });
  const [newProj, setNewProj] = useState({ title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
  const [newCocurricular, setNewCocurricular] = useState({ activity: '', link: '', description: '' });

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [techSkills, setTechSkills] = useState([]);
  const [loadingTechSkills, setLoadingTechSkills] = useState(false);

  // Skill testing states
  const [activeTestSkill, setActiveTestSkill] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [testSessionId, setTestSessionId] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [generatingTest, setGeneratingTest] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const fetchStudentApplications = async () => {
    setLoadingApplications(true);
    try {
      const res = await apiFetch('/student/applications', { token });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
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
  const hasSkills = hasSkillsRule(profile);
  const hasIntroVideo = hasIntroVideoRule(profile);
  const isComplete = isProfileComplete(profile);

  const fetchProfileAndJobs = async () => {
    setLoading(true);
    try {
      // Fetch Profile
      const profRes = await apiFetch('/student/profile', { token });
      const profData = await profRes.json();
      if (profRes.ok) {
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
      }

      // Fetch Jobs
      const jobsRes = await apiFetch('/student/jobs', { token });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) {
        setJobs(jobsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndJobs();
  }, [token]);

  useEffect(() => {
    if (user?.email && !profileEmail) {
      setProfileEmail(user.email);
    }
  }, [user?.email, profileEmail]);

  useEffect(() => {
    if (!loading && profile) {
      const hasGen = !!(
        profile.name?.trim() &&
        profile.bio?.trim() &&
        profile.nationality?.trim() &&
        profile.gender?.trim() &&
        profile.email?.trim() &&
        profile.dob?.trim() &&
        profile.phone?.trim()
      );
      const hasSk = profile.skills && profile.skills.length > 0;
      const hasVid = !!(profile.introVideoUrl && profile.introVideoUrl.trim());
      const complete = hasGen && hasSk && hasVid;
      
      if (wasComplete === false && complete === true) {
        // Just completed profile, redirect to dashboard
        setActiveTab('dashboard');
      }
      setWasComplete(complete);

      if (!complete && activeTab !== 'profile' && activeTab !== 'showcase') {
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

  const handleStartSkillTest = async (skillName) => {
    setActiveTestSkill(skillName);
    setGeneratingTest(true);
    setTestQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setTestResult(null);

    try {
      const res = await apiFetch('/student/tests/generate', {
        token,
        method: 'POST',
        json: { skillName }
      });
      if (res.ok) {
        const data = await res.json();
        setTestQuestions(data.questions || []);
        setTestSessionId(data.sessionId || null); // server-side scoring session
      } else {
        alert('Failed to generate test. Please try again.');
        setActiveTestSkill(null);
      }
    } catch (err) {
      console.error(err);
      alert('Network error generating test.');
      setActiveTestSkill(null);
    } finally {
      setGeneratingTest(false);
    }
  };

  useEffect(() => {
    if (testSkill && testSkill.skillName) {
      setActiveTab('tests');
      handleStartSkillTest(testSkill.skillName);
      setTestSkill(null);
    }
  }, [testSkill]);

  const handleSubmitSkillTest = async () => {
    // Server-side scoring: submit the selected option index per question (in served
    // order). The client no longer computes a score or sees the answer key.
    const answers = testQuestions.map((_, idx) => (selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : 0));

    setSubmittingTest(true);
    try {
      const res = await apiFetch('/student/tests/submit', {
        token,
        method: 'POST',
        json: {
          sessionId: testSessionId,
          answers
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          rating: data.rating,   // 1-10 level (applied to profile only when passed)
          percent: data.score,   // 0-100
          passed: data.passed,
          results: data.results // [{ correct: boolean }] per served question; answer key is never sent
        });
        if (data.skills) {
          setSkillsList(data.skills);
          setProfile(prev => prev ? { ...prev, skills: data.skills } : prev);
        }
        fetchTechnicalSkills();
      } else {
        setAlertConfig({ message: 'Failed to submit test results.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Network error submitting test.', type: 'error' });
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setFeedbackMsg('');
    try {
      const res = await apiFetch('/student/profile', {
        token,
        method: 'PUT',
        json: {
          name: profile.name,
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
          openToAnyLocation
        }
      });
      if (res.ok) {
        setFeedbackMsg('Profile updated successfully!');
        fetchProfileAndJobs();
      } else {
        const d = await res.json();
        setFeedbackMsg(d.error || 'Failed to update profile');
      }
    } catch (err) {
      setFeedbackMsg('Network error updating profile');
    } finally {
      setSubmittingProfile(false);
    }
  };



  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      setAlertConfig({ message: 'Please upload a valid PDF or DOCX file.', type: 'error' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAlertConfig({ message: 'File size exceeds the 10MB limit.', type: 'error' });
      return;
    }

    try {
      await executeResumeUploadAndParse(file, false);
    } catch (err) {
      setAlertConfig({ message: err.message || 'Error processing resume file.', type: 'error' });
    }
  };









  const handleDownloadUploadedResume = () => {
    if (!resumeUrl) return;
    window.open(resumeUrl, '_blank');
  };

  const handleDeleteUploadedResume = async () => {
    if (!window.confirm('Are you sure you want to delete your uploaded resume?')) return;
    setResumeUrl('');

    try {
      const res = await apiFetch('/student/profile', {
        token,
        method: 'PUT',
        json: {
          name: profile?.name,
          resumeUrl: '',
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
          cocurricular
        }
      });
      if (res.ok) {
        const d = await res.json();
        setProfile(d);
        setFeedbackMsg('Resume deleted successfully.');
      } else {
        alert('Failed to update profile after deleting resume.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting resume.');
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

  const handleApply = async (jobId) => {
    try {
      const res = await apiFetch(`/student/jobs/${jobId}/apply`, {
        token,
        method: 'POST'
      });
      if (res.ok) {
        setAlertConfig({ message: 'Application submitted successfully!', type: 'success' });
        fetchProfileAndJobs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Could not apply', type: 'error' });
      }
    } catch (err) {
      setAlertConfig({ message: 'Error applying', type: 'error' });
    }
  };

  const handleRatingChange = (name, val) => {
    setSkillsList(prev => prev.map(s => s.name === name ? { ...s, rating: parseInt(val) } : s));
  };

  // Stats computation
  const skillCount = profile?.skills?.length || 0;
  const appliedCount = jobs.filter(j => j.applied).length;

  const navItems = [
    { id: 'dashboard', icon: Briefcase, label: 'Opportunities', locked: !isComplete },
    { id: 'profile', icon: User, label: 'Profile & Ratings', locked: false },
    { id: 'resume', icon: FileText, label: 'Resume', locked: !isComplete },
    { id: 'tests', icon: BookOpen, label: 'Your Tests', locked: !isComplete },
    { id: 'progress', icon: ClipboardList, label: 'Your Job Progress', locked: !isComplete },
    { id: 'gigs', icon: Zap, label: 'Gigs Marketplace', locked: !isComplete },
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
                  <p className="text-[9px] font-mono uppercase tracking-wider text-on-surface-variant opacity-70 px-1 animate-fade-in">Candidate Dashboard</p>
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
                  locked={item.locked}
                  onClick={() => goToTab(item.id)}
                  collapsed={!isExpanded}
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
                {isExpanded && (
                  <div className="min-w-0 animate-fade-in">
                    <p className="text-sm font-bold text-on-surface truncate">{profile?.name || 'Loading...'}</p>
                    <p className="text-xs text-on-surface-variant truncate">Candidate - {user?.regNo || 'CAN001'}</p>
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
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div key={activeTab} className="animate-fade-in">
            {/* Show profile complete banner if incomplete */}
            {!isComplete && (
              <div className="mb-6 p-4 bg-tertiary-container border border-tertiary/30 text-on-tertiary-container rounded-xl text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Profile Setup Incomplete</span>
                </div>
                <p>
                  To unlock Job Opportunities, Resume Builder, and Skill Tests, please complete the following sections:
                </p>
                <ul className="list-disc pl-5 space-y-1 font-semibold">
                  {!hasGeneralInfo && <li>Fill in all fields in Profile & Ratings &rarr; General tab (Describe Yourself, Nationality, Gender, Email, DOB, Phone)</li>}
                  {!hasSkills && <li>Add at least one skill in Profile & Ratings &rarr; Skills tab</li>}
                  {!hasIntroVideo && <li>Upload an intro video in Profile & Ratings &rarr; Video Showcase tab</li>}
                </ul>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <StudentDashboard
                profile={profile}
                user={user}
                jobs={jobs}
                applications={applications}
                skillCount={skillCount}
                appliedCount={appliedCount}
                handleApply={handleApply}
                setTestSkill={setTestSkill}
                onRefresh={async () => {
                  await fetchProfileAndJobs();
                  await fetchStudentApplications();
                }}
                onOpenCompanyProfile={onOpenCompanyProfile}
                autoSelectOpportunity={autoSelectOpportunity}
                setAutoSelectOpportunity={setAutoSelectOpportunity}
                goToTab={goToTab}
              />
            )}

            {activeTab === 'profile' && (
              <StudentProfile
                profile={profile}
                setProfile={setProfile}
                username={username}
                setUsername={setUsername}
                profilePic={profilePic}
                setProfilePic={setProfilePic}
                token={token}
                skillsList={skillsList}
                setSkillsList={setSkillsList}
                selectedNewSkill={selectedNewSkill}
                setSelectedNewSkill={setSelectedNewSkill}
                bio={bio}
                setBio={setBio}
                nationality={nationality}
                setNationality={setNationality}
                gender={gender}
                setGender={setGender}
                profileEmail={profileEmail}
                setProfileEmail={setProfileEmail}
                dob={dob}
                setDob={setDob}
                phone={phone}
                setPhone={setPhone}
                preferredWorkModes={preferredWorkModes}
                setPreferredWorkModes={setPreferredWorkModes}
                preferredWorkTypes={preferredWorkTypes}
                setPreferredWorkTypes={setPreferredWorkTypes}
                preferredLocations={preferredLocations}
                setPreferredLocations={setPreferredLocations}
                openToAnyLocation={openToAnyLocation}
                setOpenToAnyLocation={setOpenToAnyLocation}
                resumeUrl={resumeUrl}
                setResumeUrl={setResumeUrl}
                socialLinks={socialLinks}
                setSocialLinks={setSocialLinks}
                educationList={educationList}
                setEducationList={setEducationList}
                experienceList={experienceList}
                setExperienceList={setExperienceList}
                certificatesList={certificatesList}
                setCertificatesList={setCertificatesList}
                projectsList={projectsList}
                setProjectsList={setProjectsList}
                cocurricular={cocurricular}
                setCocurricular={setCocurricular}
                newEdu={newEdu}
                setNewEdu={setNewEdu}
                newExp={newExp}
                setNewExp={setNewExp}
                newCert={newCert}
                setNewCert={setNewCert}
                newProj={newProj}
                setNewProj={setNewProj}
                newCocurricular={newCocurricular}
                setNewCocurricular={setNewCocurricular}
                profileTab={profileTab}
                setProfileTab={setProfileTab}
                submittingProfile={submittingProfile}
                feedbackMsg={feedbackMsg}
                handleUpdateProfile={handleUpdateProfile}
                handleRatingChange={handleRatingChange}
              />
            )}

            {activeTab === 'resume' && (
              <StudentResume
                profile={profile}
                generatingPdf={generatingPdf}
                handleDownloadGeneratedResume={handleDownloadGeneratedResume}
                feedbackMsg={feedbackMsg}
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
            )}

            {activeTab === 'tests' && (
              <StudentSkillTests
                techSkills={techSkills}
                loadingTechSkills={loadingTechSkills}
                activeTestSkill={activeTestSkill}
                generatingTest={generatingTest}
                testQuestions={testQuestions}
                testResult={testResult}
                currentQuestionIdx={currentQuestionIdx}
                selectedAnswers={selectedAnswers}
                submittingTest={submittingTest}
                handleStartSkillTest={handleStartSkillTest}
                handleSubmitSkillTest={handleSubmitSkillTest}
                setCurrentQuestionIdx={setCurrentQuestionIdx}
                setSelectedAnswers={setSelectedAnswers}
                setActiveTestSkill={setActiveTestSkill}
                setTestResult={setTestResult}
              />
            )}

            {activeTab === 'progress' && (
              <StudentProgress
                applications={applications}
                loading={loadingApplications}
              />
            )}

            {activeTab === 'gigs' && (
              <GigsMarketplace
                user={{ id: profile?.id, name: profile?.name, email: profileEmail, role: 'STUDENT' }}
                token={token}
                theme={theme}
                profile={profile}
                onUpdateProfile={fetchProfileAndJobs}
                onNavigateToTests={() => goToTab('tests')}
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
