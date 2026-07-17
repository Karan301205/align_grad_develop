import React, { useState, useEffect } from 'react';

// Import features
import AuthView from './features/Auth/AuthView';
import CandidateAuth from './features/Auth/CandidateAuth';
import RecruiterAuth from './features/Auth/RecruiterAuth';
import StudentLayout from './features/Student/StudentLayout';
import RecruiterLayout from './features/Recruiter/RecruiterLayout';
import ConnectionLoader from './components/ConnectionLoader';
import CompanyProfileModal from './components/CompanyProfileModal';

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

  const handleOpenCompanyProfile = (companyId) => {
    setSelectedCompanyId(companyId);
    setIsCompanyModalOpen(true);
  };

  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

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
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
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

  if (!isReady) {
    return <ConnectionLoader theme={theme} onReady={() => setIsReady(true)} />;
  }

  const hostname = window.location.hostname;
  const isLandingHost = hostname === 'aligngrad.com' || hostname === 'www.aligngrad.com';
  const isCareerHost = hostname === 'career.aligngrad.com';
  const isHireHost = hostname === 'hire.aligngrad.com';

  if (!token) {
    if (currentPath.startsWith('/candidate')) {
      const mode = currentPath.endsWith('signup') ? 'signup' : 'login';
      return (
        <CandidateAuth
          setToken={setToken}
          setUser={setUser}
          theme={theme}
          toggleTheme={toggleTheme}
          initialMode={mode}
        />
      );
    }
    if (currentPath.startsWith('/recruiter')) {
      const mode = currentPath.endsWith('signup') ? 'signup' : 'login';
      return (
        <RecruiterAuth
          setToken={setToken}
          setUser={setUser}
          theme={theme}
          toggleTheme={toggleTheme}
          initialMode={mode}
        />
      );
    }
    if (isCareerHost) {
      return (
        <CandidateAuth
          setToken={setToken}
          setUser={setUser}
          theme={theme}
          toggleTheme={toggleTheme}
          initialMode="login"
        />
      );
    }
    if (isHireHost) {
      return (
        <RecruiterAuth
          setToken={setToken}
          setUser={setUser}
          theme={theme}
          toggleTheme={toggleTheme}
          initialMode="login"
        />
      );
    }
    return <AuthView setToken={setToken} setUser={setUser} theme={theme} toggleTheme={toggleTheme} />;
  }

  if (isLandingHost && !currentPath.startsWith('/candidate') && !currentPath.startsWith('/recruiter')) {
    return <AuthView setToken={setToken} setUser={setUser} theme={theme} toggleTheme={toggleTheme} />;
  }

  if (isCareerHost && user.role !== 'STUDENT') {
    return (
      <div className="min-h-screen bg-background text-on-surface font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <h1 className="font-headline text-xl font-bold text-on-surface">Access denied</h1>
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
          <h1 className="font-headline text-xl font-bold text-on-surface">Access denied</h1>
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
