import React, { useState, useEffect } from 'react';

// Import features
import { AuthView, CandidateAuth, RecruiterAuth, ResetPasswordPage } from '../features/Auth';
import { StudentLayout, PublicJobBriefPage } from '../features/Student';
import { RecruiterLayout } from '../features/Recruiter';
import ConnectionLoader from '../components/ConnectionLoader';
import CompanyProfileModal from '../components/CompanyProfileModal';
import EmeraldSignupToast from '../components/EmeraldSignupToast';
import {
  LANDING_HOSTNAME,
  CANDIDATE_HOSTNAME,
  RECRUITER_HOSTNAME,
  CANDIDATE_URL,
  RECRUITER_URL
} from '../config';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testSkill, setTestSkill] = useState(null); // { skillName, targetRating, jobId }
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [autoSelectOpportunity, setAutoSelectOpportunity] = useState(null);
  const [showSignupNotice, setShowSignupNotice] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('auth_prompt') === 'signup_required' ||
      params.get('prompt') === 'signup' ||
      params.get('signup_prompt') === 'true'
    ) {
      setShowSignupNotice(true);
      // Clean up URL search params cleanly without page reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleOpenCompanyProfile = (companyId) => {
    setSelectedCompanyId(companyId);
    setIsCompanyModalOpen(true);
  };

  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  useEffect(() => {
    if (token) {
      if (window.location.pathname.startsWith('/candidate') || window.location.pathname.startsWith('/recruiter')) {
        window.history.pushState({}, '', '/');
      }
    }
  }, [token]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
    setTestSkill(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener('aligngrade:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('aligngrade:unauthorized', handleUnauthorized);
  }, []);

  if (!isReady) {
    return <ConnectionLoader theme={theme} onReady={() => setIsReady(true)} />;
  }

  // Standalone public job brief view (unauthenticated or direct share link access)
  if (currentPath.startsWith('/job_brief')) {
    return <PublicJobBriefPage theme={theme} toggleTheme={toggleTheme} />;
  }

  // Standalone password reset view (unauthenticated or link access)
  if (currentPath.startsWith('/reset-password')) {
    return <ResetPasswordPage theme={theme} toggleTheme={toggleTheme} />;
  }

  const hostname = window.location.hostname.toLowerCase();
  const isLandingHost = Boolean(LANDING_HOSTNAME && (hostname === LANDING_HOSTNAME || hostname === `www.${LANDING_HOSTNAME}`));
  const isCareerHost = Boolean(CANDIDATE_HOSTNAME && hostname === CANDIDATE_HOSTNAME);
  const isHireHost = Boolean(RECRUITER_HOSTNAME && hostname === RECRUITER_HOSTNAME);

  if (!token) {
    // Cross-subdomain redirect enforcement when navigating or switching roles (active when URLs are configured)
    if (isLandingHost && currentPath.startsWith('/candidate') && CANDIDATE_URL) {
      window.location.href = `${CANDIDATE_URL}${currentPath}`;
      return null;
    }
    if (isLandingHost && currentPath.startsWith('/recruiter') && RECRUITER_URL) {
      window.location.href = `${RECRUITER_URL}${currentPath}`;
      return null;
    }
    if (isCareerHost && currentPath.startsWith('/recruiter') && RECRUITER_URL) {
      window.location.href = `${RECRUITER_URL}${currentPath}`;
      return null;
    }
    if (isHireHost && currentPath.startsWith('/candidate') && CANDIDATE_URL) {
      window.location.href = `${CANDIDATE_URL}${currentPath}`;
      return null;
    }

    let authView = null;
    if (currentPath.startsWith('/candidate')) {
      const mode = currentPath.endsWith('signup') ? 'signup' : 'login';
      authView = (
        <CandidateAuth
          setToken={setToken}
          setUser={setUser}
          theme={theme}
          toggleTheme={toggleTheme}
          initialMode={mode}
        />
      );
    } else if (currentPath.startsWith('/recruiter')) {
      const mode = currentPath.endsWith('signup') ? 'signup' : 'login';
      authView = (
        <RecruiterAuth
          setToken={setToken}
          setUser={setUser}
          theme={theme}
          toggleTheme={toggleTheme}
          initialMode={mode}
        />
      );
    } else if (isCareerHost) {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        window.history.replaceState({}, '', '/candidate/login');
      }
      authView = (
        <CandidateAuth
          setToken={setToken}
          setUser={setUser}
          theme={theme}
          toggleTheme={toggleTheme}
          initialMode="login"
        />
      );
    } else if (isHireHost) {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        window.history.replaceState({}, '', '/recruiter/login');
      }
      authView = (
        <RecruiterAuth
          setToken={setToken}
          setUser={setUser}
          theme={theme}
          toggleTheme={toggleTheme}
          initialMode="login"
        />
      );
    } else {
      authView = <AuthView setToken={setToken} setUser={setUser} theme={theme} toggleTheme={toggleTheme} />;
    }

    return (
      <>
        {showSignupNotice && (
          <EmeraldSignupToast
            onClose={() => setShowSignupNotice(false)}
            onSignUpClick={() => {
              setShowSignupNotice(false);
              window.history.pushState({}, '', '/candidate/signup');
            }}
          />
        )}
        {authView}
      </>
    );
  }

  if (isLandingHost && !currentPath.startsWith('/candidate') && !currentPath.startsWith('/recruiter')) {
    return <AuthView setToken={setToken} setUser={setUser} theme={theme} toggleTheme={toggleTheme} />;
  }

  if (isCareerHost && user.role !== 'STUDENT') {
    return (
      <div className="min-h-screen bg-background text-on-surface font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <h1 className="font-headline text-xl font-medium text-on-surface">Access denied</h1>
          <p className="text-sm text-on-surface-variant">
            This portal is for students only. Please sign in with a student account or use the recruiter portal.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl glass-button-primary text-on-primary text-sm font-semibold hover:brightness-110 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (isHireHost && user.role === 'STUDENT') {
    return (
      <div className="min-h-screen bg-background text-on-surface font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <h1 className="font-headline text-xl font-medium text-on-surface">Access denied</h1>
          <p className="text-sm text-on-surface-variant">
            This portal is for recruiters only. Please sign in with a recruiter account or use the student portal.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl glass-button-primary text-on-primary text-sm font-semibold hover:brightness-110 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex">
      {user.role === 'STUDENT' ? (
        <StudentLayout
          user={user}
          token={token}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          testSkill={testSkill}
          setTestSkill={setTestSkill}
          handleLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenCompanyProfile={handleOpenCompanyProfile}
          autoSelectOpportunity={autoSelectOpportunity}
          setAutoSelectOpportunity={setAutoSelectOpportunity}
        />
      ) : (
        <RecruiterLayout
          user={user}
          token={token}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenCompanyProfile={handleOpenCompanyProfile}
        />
      )}

      <CompanyProfileModal
        companyId={selectedCompanyId}
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        token={token}
        onViewOpportunity={(id, type) => {
          if (user.role === 'STUDENT') {
            setAutoSelectOpportunity({ id, type });
            if (type === 'gig') {
              setActiveTab('gigs');
            } else {
              setActiveTab('dashboard');
            }
          }
        }}
      />
    </div>
  );
}
