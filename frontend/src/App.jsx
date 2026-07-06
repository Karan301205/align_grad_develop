import React, { useState, useEffect } from 'react';

// Import features
import AuthView from './features/Auth/AuthView';
import StudentLayout from './features/Student/StudentLayout';
import RecruiterLayout from './features/Recruiter/RecruiterLayout';
import ConnectionLoader from './components/ConnectionLoader';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testSkill, setTestSkill] = useState(null); // { skillName, targetRating, jobId }
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

  if (!token) {
    return <AuthView setToken={setToken} setUser={setUser} theme={theme} toggleTheme={toggleTheme} />;
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
        />
      )}
    </div>
  );
}
