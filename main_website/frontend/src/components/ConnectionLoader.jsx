import React, { useState, useEffect } from 'react';
import { API_BASE } from '../constants';

export default function ConnectionLoader({ theme, onReady }) {
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  const checkConnection = async () => {
    try {
      // Strip "/api" or "/api/" suffix cleanly to hit root "/health" endpoint
      const rootUrl = API_BASE.replace(/\/api\/?$/, '');
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
      <main className="flex flex-col items-center justify-center">
        <svg height="224px" width="224px" viewBox="0 0 128 128" className="pl1">
          <defs>
            <linearGradient y2="1" x2="1" y1="0" x1="0" id="pl-grad">
              <stop stopColor="#000" offset="0%"></stop>
              <stop stopColor="#fff" offset="100%"></stop>
            </linearGradient>
            <mask id="pl-mask">
              <rect fill="url(#pl-grad)" height="128" width="128" y="0" x="0"></rect>
            </mask>
          </defs>
          <g fill="var(--c-primary, var(--primary, #003527))">
            <g className="pl1__g">
              <g transform="translate(20,20) rotate(0,44,44)">
                <g className="pl1__rect-g">
                  <rect height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                  <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                </g>
                <g transform="rotate(180,44,44)" className="pl1__rect-g">
                  <rect height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                  <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                </g>
              </g>
            </g>
          </g>
          <g mask="url(#pl-mask)" fill="hsl(343,90%,50%)">
            <g className="pl1__g">
              <g transform="translate(20,20) rotate(0,44,44)">
                <g className="pl1__rect-g">
                  <rect height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                  <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                </g>
                <g transform="rotate(180,44,44)" className="pl1__rect-g">
                  <rect height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                  <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </main>

      {/* Quietly display retry status only if there's a connection issue */}
      {hasError && (
        <div className="mt-6 text-[11px] font-sans font-normal text-error text-center animate-pulse">
          Services inactive. Retrying in background... (Attempt #{retryCount + 1})
        </div>
      )}
    </div>
  );
}
