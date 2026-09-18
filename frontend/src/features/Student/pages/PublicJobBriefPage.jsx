import React, { useState, useEffect } from 'react';
import { Sun, Moon, LogIn } from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import JobBriefPage from './JobBriefPage';

export default function PublicJobBriefPage({ theme, toggleTheme }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');

    if (!jobId) {
      setError('No Job ID provided in the link.');
      setLoading(false);
      return;
    }

    const fetchPublicJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/student/jobs/${jobId}/public`);
        if (res.ok) {
          const data = await res.json();
          setJob(data);
        } else if (res.status === 404) {
          setError('This opportunity has expired or is no longer available.');
        } else {
          setError('Failed to load opportunity details.');
        }
      } catch (err) {
        console.error('Error fetching public job brief:', err);
        setError('Network error while loading job brief. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicJob();
  }, []);

  const handleNavigateHome = () => {
    window.location.href = '/?auth_prompt=signup_required';
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col">
      {/* Standalone Public Header (No Sidebar) */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={handleNavigateHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'}
              alt="AlignGrade"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-none border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleNavigateHome}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold text-xs rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Public Job Brief Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error ? (
          <div className="w-full min-h-[360px] flex flex-col items-center justify-center space-y-4 bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-8 text-center">
            <h2 className="text-lg font-headline font-bold text-slate-900 dark:text-slate-100">
              Opportunity Not Available
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans max-w-md">
              {error}
            </p>
            <button
              type="button"
              onClick={handleNavigateHome}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-headline font-bold rounded-none transition-colors cursor-pointer"
            >
              &larr; Go to AlignGrade Home
            </button>
          </div>
        ) : (
          <JobBriefPage
            job={job}
            loading={loading}
            isPublic={true}
            onBack={handleNavigateHome}
          />
        )}
      </main>
    </div>
  );
}
