import { useState } from 'react';
import { apiFetch, userMessage } from '../../../services/apiClient';

/** Sign-up asks for 8+ characters (the form promises it); the API itself accepts 6+. */
export const SIGNUP_MIN_PASSWORD = 8;

const EMPTY_FIELDS = { name: '', email: '', password: '' };

/** Copy shown when the account belongs to the other portal. */
const WRONG_PORTAL = {
  STUDENT: {
    signIn: 'Access denied. This account is registered as a recruiter. Please sign in through the Recruiter portal.',
    verified: 'Access denied. This account is registered as a recruiter.'
  },
  RECRUITER: {
    signIn: 'Access denied. This account is registered as a candidate. Please sign in through the Candidate portal.',
    verified: 'Access denied. This account is registered as a candidate.'
  }
};

/** Scroll the auth card into view and focus its first field. */
function focusAuthCard() {
  const card = document.getElementById('auth');
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => card.querySelector('input')?.focus({ preventScroll: true }), 300);
}

/**
 * Sign-up / sign-in state and actions for the auth card on the candidate and
 * recruiter landing pages. `role` is 'STUDENT' or 'RECRUITER'. Behaviour is
 * carried over unchanged from the previous AuthView / RecruiterLandingPage:
 *  - POST /auth/signup or /auth/login with the role (sign-up also sends `name`:
 *    the person's name for candidates, the company name for recruiters)
 *  - needsVerification → 6-digit PIN modal
 *  - 409 on sign-up → switch to Sign in
 *  - accounts of the other role are refused
 *  - success → setToken/setUser, then route to '/'
 */
export default function useLandingAuth({ role, setToken, setUser, initialAuthMode = 'signup' }) {
  const [mode, setMode] = useState(initialAuthMode === 'login' ? 'login' : 'signup');
  const [syncedInitialMode, setSyncedInitialMode] = useState(initialAuthMode);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Follow route changes such as /candidate/login ↔ /candidate/signup.
  if (syncedInitialMode !== initialAuthMode) {
    setSyncedInitialMode(initialAuthMode);
    setMode(initialAuthMode === 'login' ? 'login' : 'signup');
  }

  const isLogin = mode === 'login';
  const wrongPortal = WRONG_PORTAL[role];

  const completeSignIn = (data) => {
    if (setToken) setToken(data.token);
    if (setUser) setUser(data.user);
    window.history.pushState({}, '', '/');
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  /** Used by the nav, CTAs and cards: pick a mode and bring the card into view. */
  const openAuth = (next) => {
    switchMode(next);
    focusAuthCard();
  };

  const updateField = (key) => (event) => {
    const { value } = event.target;
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const { password } = fields;
    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
      return;
    }
    if (!isLogin && password.length < SIGNUP_MIN_PASSWORD) {
      setError(`Password must be at least ${SIGNUP_MIN_PASSWORD} characters.`);
      return;
    }

    setError('');
    setLoading(true);

    const cleanEmail = fields.email.toLowerCase().trim();
    const payload = isLogin
      ? { email: cleanEmail, password, role }
      : { email: cleanEmail, password, role, name: fields.name.trim() };

    try {
      const res = await apiFetch(isLogin ? '/auth/login' : '/auth/signup', { method: 'POST', json: payload });
      const data = await res.json();

      if (!res.ok) {
        if (data.needsVerification) {
          setVerificationEmail(cleanEmail);
          setIsVerificationOpen(true);
          return;
        }
        if (!isLogin && res.status === 409) {
          setMode('login');
          setError('An account with this email already exists. Switched to Sign In — please enter your password.');
          return;
        }
        throw new Error(data.error || 'Authentication failed');
      }

      if (!isLogin && data.needsVerification) {
        setVerificationEmail(cleanEmail);
        setIsVerificationOpen(true);
        return;
      }

      if (data.user && data.user.role !== role) {
        throw new Error(wrongPortal.signIn);
      }
      completeSignIn(data);
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerified = (data) => {
    setIsVerificationOpen(false);
    if (data.user && data.user.role !== role) {
      setError(wrongPortal.verified);
      return;
    }
    completeSignIn(data);
  };

  return {
    role,
    mode,
    isLogin,
    fields,
    updateField,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    rememberMe,
    setRememberMe,
    error,
    clearError: () => setError(''),
    loading,
    submit,
    switchMode,
    openAuth,
    google: { onSuccess: completeSignIn, onError: setError },
    verification: {
      isOpen: isVerificationOpen,
      email: verificationEmail || fields.email,
      close: () => setIsVerificationOpen(false),
      onVerified
    },
    forgotPassword: {
      isOpen: isForgotPasswordOpen,
      open: () => setIsForgotPasswordOpen(true),
      close: () => setIsForgotPasswordOpen(false)
    }
  };
}
