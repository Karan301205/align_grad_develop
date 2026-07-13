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
  Lock
} from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { putFileToS3 } from '../../services/uploadService';
import { generateResumePdf } from '../../services/resumePdf';
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


export default function StudentLayout({ user, token, activeTab, setActiveTab, testSkill, setTestSkill, handleLogout, theme, toggleTheme }) {
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
  
  // General Section
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [nationality, setNationality] = useState('');
  const [gender, setGender] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');

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
        setProfileEmail(profData.email || '');
        setDob(profData.dob || '');
        setPhone(profData.phone || '');
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
    // Score computation
    let correctCount = 0;
    testQuestions.forEach((q, idx) => {
      const userAnswerIdx = selectedAnswers[idx];
      const userAnswerChar = userAnswerIdx !== undefined ? String.fromCharCode(65 + userAnswerIdx) : '';
      if (userAnswerChar === q.answer) {
        correctCount++;
      }
    });

    setSubmittingTest(true);
    try {
      const res = await apiFetch('/student/tests/submit', {
        token,
        method: 'POST',
        json: {
          skillName: activeTestSkill,
          score: correctCount
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          score: correctCount,
          passed: true,
          attempt: data.attempt
        });
        fetchTechnicalSkills();
      } else {
        alert('Failed to submit test results.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting test.');
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
          cocurricular
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
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }

    try {
      setSubmittingProfile(true);

      // 1. Request S3 pre-signed upload URL from backend
      const urlRes = await apiFetch('/upload/request-url', {
        token,
        method: 'POST',
        json: {
          fileType: 'resume',
          fileName: file.name,
          contentType: file.type
        }
      });

      if (!urlRes.ok) {
        throw new Error('Failed to request S3 upload URL from server.');
      }

      const { uploadUrl, publicUrl } = await urlRes.json();

      // 2. Upload file directly to S3 via pre-signed PUT URL
      const s3Res = await putFileToS3(uploadUrl, file);

      if (!s3Res.ok) {
        throw new Error('Failed to upload file directly to S3.');
      }

      // 3. Save the S3 publicUrl to student profile
      const res = await apiFetch('/student/profile', {
        token,
        method: 'PUT',
        json: {
          name: profile?.name,
          resumeUrl: publicUrl,
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
        setResumeUrl(publicUrl);
        setFeedbackMsg('Resume PDF uploaded and saved to S3 successfully!');
      } else {
        alert('Failed to save uploaded resume S3 URL on the server.');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error uploading resume PDF.');
    } finally {
      setSubmittingProfile(false);
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
        alert('Application submitted successfully!');
        fetchProfileAndJobs();
      } else {
        const d = await res.json();
        alert(d.error || 'Could not apply');
      }
    } catch (err) {
      alert('Error applying');
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
    { id: 'showcase', icon: Video, label: 'Showcase Yourself', locked: false },
    { id: 'progress', icon: ClipboardList, label: 'Your Job Progress', locked: !isComplete },
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
            <p className="text-[9px] font-mono uppercase tracking-wider text-on-surface-variant opacity-70 px-0.5">Student Dashboard</p>
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
              locked={item.locked}
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
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold shrink-0 overflow-hidden">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile?.name?.charAt(0) || 'S'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{profile?.name || 'Loading...'}</p>
              <p className="text-xs text-on-surface-variant truncate">Candidate</p>
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
                  {!hasGeneralInfo && <li>Fill in all fields in Profile & Ratings &rarr; General tab (Bio, Nationality, Gender, Email, DOB, Phone)</li>}
                  {!hasSkills && <li>Add at least one skill in Profile & Ratings &rarr; Skills tab</li>}
                  {!hasIntroVideo && <li>Upload an intro video in the Showcase Yourself tab</li>}
                </ul>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <StudentDashboard
                jobs={jobs}
                skillCount={skillCount}
                appliedCount={appliedCount}
                handleApply={handleApply}
                setTestSkill={setTestSkill}
                onRefresh={fetchProfileAndJobs}
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
                resumeUrl={resumeUrl}
                generatingPdf={generatingPdf}
                handleResumeUpload={handleResumeUpload}
                handleDownloadUploadedResume={handleDownloadUploadedResume}
                handleDeleteUploadedResume={handleDeleteUploadedResume}
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

            {activeTab === 'showcase' && (
              <StudentShowcase
                profile={profile}
                token={token}
                onVideoSaved={(url) => setProfile(prev => ({ ...prev, introVideoUrl: url }))}
              />
            )}

            {activeTab === 'progress' && (
              <StudentProgress
                applications={applications}
                loading={loadingApplications}
              />
            )}
          </div>
        )}
      </main>
    </>
  );
}
