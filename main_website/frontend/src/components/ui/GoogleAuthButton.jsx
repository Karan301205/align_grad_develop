import React, { useEffect, useRef } from 'react';
import { apiFetch } from '../../services/apiClient';
import { GOOGLE_CLIENT_ID } from '../../config';

export default function GoogleAuthButton({ role = 'STUDENT', onSuccess, onError }) {
  const buttonRef = useRef(null);
  const callbacksRef = useRef({ onSuccess, onError, role });
  callbacksRef.current = { onSuccess, onError, role };

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.warn('[GoogleAuthButton] VITE_GOOGLE_CLIENT_ID is not configured. Google Sign-In is disabled.');
      return;
    }

    const handleGoogleCallback = async (response) => {
      if (!response.credential) {
        callbacksRef.current.onError?.('Google login failed.');
        return;
      }

      try {
        const res = await apiFetch('/auth/google', {
          method: 'POST',
          json: {
            credential: response.credential,
            role: callbacksRef.current.role
          }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Google Authentication failed');
        }
        callbacksRef.current.onSuccess?.(data);
      } catch (err) {
        callbacksRef.current.onError?.(err.message || 'Google Sign-In failed');
      }
    };

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
            auto_select: false
          });

          buttonRef.current.innerHTML = '';
          const containerWidth = buttonRef.current.offsetWidth || 350;
          // Google Identity Services requires an integer width between 200 and 400
          const validWidth = Math.min(400, Math.max(200, Math.floor(containerWidth)));

          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: validWidth
          });
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
  }, []);

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full min-h-[42px] flex justify-center items-center" />
    </div>
  );
}
