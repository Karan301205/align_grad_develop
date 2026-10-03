import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import DotGrid from '../../../components/ui/DotGrid';
import ClickSpark from '../../../components/ui/ClickSpark';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import { submitPasswordReset } from '../services/passwordResetApi';

export default function ResetPasswordPage({ theme = 'light', toggleTheme }) {
  const [token, setToken] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectCount, setRedirectCount] = useState(3);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlRole = params.get('role');
    if (urlToken) {
      setToken(urlToken);
    }
    if (urlRole) {
      setRole(urlRole.toUpperCase());
    }
  }, []);

  const loginPath = role === 'RECRUITER' ? '/recruiter/login' : '/candidate/login';
  const portalLabel = role === 'RECRUITER' ? 'Recruiter Portal' : 'Candidate Workspace';

  const navigateToLogin = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({}, '', loginPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    let timer;
    if (isSuccess && redirectCount > 0) {
      timer = setTimeout(() => {
        setRedirectCount(prev => prev - 1);
      }, 1000);
    } else if (isSuccess && redirectCount === 0) {
      navigateToLogin();
    }
    return () => clearTimeout(timer);
  }, [isSuccess, redirectCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing or invalid reset token. Please request a new password reset link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      await submitPasswordReset({
        token,
        password,
        confirmPassword
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-on-surface font-sans antialiased overflow-x-hidden relative selection:bg-primary/20 selection:text-primary flex flex-col justify-between">
      <ClickSpark
        sparkColor={theme === 'dark' ? '#ffffff' : '#000000'}
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        {/* Dynamic Background DotGrid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.25]" style={{ minHeight: '100vh' }}>
          <DotGrid
            dotSize={5}
            gap={25}
            baseColor={theme === 'dark' ? '#0f2530ff' : '#3e6379ff'}
            activeColor={theme === 'dark' ? '#9bd6f2' : '#0181a0ff'}
            proximity={130}
            shockRadius={150}
            shockStrength={3}
            returnDuration={1.2}
          />
        </div>

        {/* Header */}
        <header className="relative z-10 w-full bg-background/80 backdrop-blur-md border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="flex items-center gap-2.5">
                <img 
                  src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'} 
                  alt="AlignGrad Logo" 
                  className="h-9 w-auto object-contain"
                />
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={navigateToLogin}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors font-headline tracking-wider flex items-center gap-1.5"
              >
                <span>Back to Login</span>
              </button>
              <div className="h-4 w-[1px] bg-outline-variant"></div>
              {toggleTheme && <ThemeToggle theme={theme} toggleTheme={toggleTheme} />}
            </div>
          </div>
        </header>

        {/* Main Form Chassis */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-md">
            <AnimatedContent distance={40} direction="vertical" delay={0.1}>
              <div className="glass-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg border border-outline-variant/60 relative overflow-hidden bg-surface">
                {/* Visual Screws */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>

                {!isSuccess ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-headline font-medium tracking-wider mb-3">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{portalLabel} Security</span>
                      </div>
                      <h1 className="font-headline text-2xl font-medium tracking-tight text-on-surface">
                        Set New Password
                      </h1>
                      <p className="text-xs text-on-surface-variant mt-1.5">
                        Choose a strong new password for your account.
                      </p>
                    </div>

                    {!token && (
                      <div className="p-3.5 rounded-xl mb-5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div className="flex-1 leading-snug">
                          No reset token detected in the URL. If you copied the link, ensure the entire link including <code>?token=...</code> was pasted.
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="p-3.5 rounded-xl mb-4 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div className="flex-1 leading-snug">{error}</div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-headline font-medium tracking-wider text-on-surface-variant mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="w-full bg-surface-container-low neu-recessed rounded-xl pl-4 pr-11 py-3 text-sm font-sans font-normal text-on-surface placeholder-on-surface-variant/50 transition-all focus:outline-none focus-visible:shadow-[var(--shadow-recessed),0_0_0_2px_var(--c-primary)]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-headline font-medium tracking-wider text-on-surface-variant mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            className="w-full bg-surface-container-low neu-recessed rounded-xl pl-4 pr-11 py-3 text-sm font-sans font-normal text-on-surface placeholder-on-surface-variant/50 transition-all focus:outline-none focus-visible:shadow-[var(--shadow-recessed),0_0_0_2px_var(--c-primary)]"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-on-surface-variant/70 space-y-1 pt-1 px-1">
                        <p>• Must be at least 6 characters</p>
                        <p>• Cannot contain spaces (special characters such as @, #, $, ! are allowed)</p>
                      </div>

                      <Button
                        type="submit"
                        loading={loading}
                        disabled={!token}
                        fullWidth
                        className="mt-5 shadow-sm shadow-primary/20"
                      >
                        Update Password
                      </Button>
                    </form>

                    <div className="border-t border-outline-variant pt-5 mt-6 text-center">
                      <button
                        type="button"
                        className="text-xs text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5"
                        onClick={navigateToLogin}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Return to {portalLabel}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="font-headline text-2xl font-medium tracking-tight text-on-surface mb-2">
                      Password Reset Complete
                    </h2>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-6 px-2">
                      Your password has been updated. You can now use your new password to sign into your account.
                    </p>

                    <div className="p-3 bg-surface-container-low neu-recessed rounded-xl text-xs text-on-surface-variant mb-6">
                      Redirecting to login in <strong>{redirectCount}</strong> second{redirectCount === 1 ? '' : 's'}...
                    </div>

                    <Button
                      type="button"
                      fullWidth
                      onClick={navigateToLogin}
                      className="shadow-sm shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </AnimatedContent>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-6 text-center text-[10px] font-sans font-normal text-on-surface-variant/70 border-t border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 AlignGrad</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-on-surface transition-colors" onClick={e => e.preventDefault()}>Privacy</a>
              <a href="#" className="hover:text-on-surface transition-colors" onClick={e => e.preventDefault()}>Terms</a>
            </div>
          </div>
        </footer>
      </ClickSpark>
    </div>
  );
}
