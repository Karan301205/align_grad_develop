import React, { useState, useEffect } from 'react';
import { API_BASE } from '../constants';

export default function ConnectionLoader({ theme, onReady }) {
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  const checkConnection = async () => {
    try {
      // Strip "/api" from API_BASE to hit root "/health" endpoint
      const rootUrl = API_BASE.replace('/api', '');
      const response = await fetch(`${rootUrl}/health`);
      const data = await response.json();

      if (response.ok && data.services?.database === 'ACTIVE') {
        setHasError(false);
        // Smooth delay so the loader is visible for at least 1.5s
        setTimeout(() => {
          onReady();
        }, 1500);
      } else {
        setHasError(true);
      }
    } catch (err) {
      setHasError(true);
    }
  };

  useEffect(() => {
    checkConnection();

    // Auto retry polling every 4 seconds
    const interval = setInterval(() => {
      setRetryCount(prev => prev + 1);
      checkConnection();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-4 select-none">
      <div className="loader-card flex flex-col items-center space-y-1">
        <div className="flex flex-row items-center gap-1">
          <div>
            {theme === 'dark' ? (
              <img
                src="/a_g_lg_dark.webp"
                alt="AlignGrade Logo"
                className="h-28 w-auto object-contain"
              />
            ) : (
              <img
                src="/a_g_l_w.webp"
                alt="AlignGrade Logo"
                className="h-28 w-auto object-contain"
              />
            )}
          </div>

          {/* Reference loader design */}
          <div className="loader-container">
            <p className="text-on-surface-variant font-medium select-none">loading</p>
            <div className="loader-words">
              <span className="loader-word">server</span>
              <span className="loader-word">database</span>
              <span className="loader-word">routes</span>
              <span className="loader-word">session</span>
              <span className="loader-word">server</span>
            </div>
          </div>
        </div>

        {/* Quietly display retry status only if there's a connection issue */}
        {hasError && (
          <div className="text-[11px] font-mono text-error text-center animate-pulse">
            Services inactive. Retrying in background... (Attempt #{retryCount + 1})
          </div>
        )}
      </div>
    </div>
  );
}
