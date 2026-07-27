import React, { useEffect, useRef } from 'react';
import { apiFetch } from '../../services/apiClient';

export default function GoogleAuthButton({ role = 'STUDENT', onSuccess, onError }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '44744027390-hu34fm4t2sgvm5shtu22illf0qd17rqb.apps.googleusercontent.com';

    const handleGoogleCallback = async (response) => {
      if (!response.credential) {
        onError?.('Google login failed.');
        return;
      }

      try {
        const res = await apiFetch('/auth/google', {
          method: 'POST',
          json: {
            credential: response.credential,
            role
          }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Google Authentication failed');
        }
        onSuccess(data);
      } catch (err) {
        onError?.(err.message || 'Google Sign-In failed');
      }
    };

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
            auto_select: false
          });

          if (buttonRef.current) {
            buttonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(buttonRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: '100%'
            });
          }
        } catch (e) {
          console.error('Google accounts ID init error:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', initializeGoogle);
      }
    }
  }, [role, onSuccess, onError]);

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full min-h-[42px] flex justify-center items-center" />
    </div>
  );
}
