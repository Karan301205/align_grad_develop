import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Briefcase, 
  Lock, 
  Mail, 
  ArrowLeft, 
  Building2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ThemeToggle from '../../components/ui/ThemeToggle';
import AnimatedContent from '../../components/ui/AnimatedContent';
import ClickSpark from '../../components/ui/ClickSpark';
import DotGrid from '../../components/ui/DotGrid';
import GoogleAuthButton from '../../components/ui/GoogleAuthButton';
import { formatErrorMessage } from '../../utils/errorFormatter';

export default function RecruiterAuth({ setToken, setUser, theme, toggleTheme, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
      return;
    }
    if (password.includes('@')) {
      setError("Password cannot contain '@' symbol.");
      return;
    }

    setLoading(true);

    const path = isLogin ? '/auth/login' : '/auth/signup';
    const cleanEmail = email.toLowerCase().trim();
    const payload = isLogin 
      ? { email: cleanEmail, password, role: 'RECRUITER' } 
      : { email: cleanEmail, password, role: 'RECRUITER', name: name.trim() };

    try {
      const res = await apiFetch(path, {
        method: 'POST',
        json: payload
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      if (data.user && data.user.role !== 'RECRUITER') {
        throw new Error('Access denied. This account is registered as a candidate. Please sign in through the Candidate portal.');
      }
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    // Update path locally for better UX
    const newPath = loginMode ? '/recruiter/login' : '/recruiter/signup';
    window.history.pushState({}, '', newPath);
  };

  const navigateToLanding = (e) => {
    e.preventDefault();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.location.href = 'https://aligngrad.com/';
    }
  };

  const navigateToCandidate = (e) => {
    e.preventDefault();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      window.history.pushState({}, '', '/candidate/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.location.href = 'https://career.aligngrad.com/candidate/login';
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
        {error && formatErrorMessage(error, () => setError(''))}

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
              <a href="/" onClick={navigateToLanding} className="flex items-center gap-2.5">
                <img 
                  src={theme === 'dark' ? '/a_g_logo_dark.webp' : '/a_g_logo.webp'} 
                  alt="AlignGrad Logo" 
                  className="h-9 w-auto object-contain"
                />
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={navigateToCandidate}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors font-headline uppercase tracking-wider"
              >
                Candidate Portal
              </button>
              <div className="h-4 w-[1px] bg-outline-variant"></div>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-md">
            <AnimatedContent distance={40} direction="vertical" delay={0.1}>
              {/* Neumorphic Chassis Container */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg border border-outline-variant/60 relative overflow-hidden">
                {/* Return button in top left of form */}
                <button
                  type="button"
                  onClick={navigateToLanding}
                  className="absolute top-3.5 left-3.5 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors flex items-center justify-center group z-10"
                  title="Return to home page"
                  aria-label="Return to home page"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                </button>

                {/* Visual Screws */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/15 border border-outline-variant text-on-surface text-[10px] font-headline font-medium uppercase tracking-wider mb-3">
                    {/* <Briefcase className="w-3.5 h-3.5 text-primary" /> */}
                    <span>Recruiter Workspace</span>
                  </div>
                  <h1 className="font-headline text-2xl font-medium tracking-tight text-on-surface">
                    {isLogin ? 'Recruiter Sign In' : 'Register Company'}
                  </h1>
                  <p className="text-xs text-on-surface-variant mt-1.5">
                    {isLogin 
                      ? 'Sign in to access your talent dashboard, manage posts, and audit ratings.' 
                      : 'Set up your company workspace and hire certified technical students.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <Input
                      label="Company / Organization Name"
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Aether Corp"
                      containerClassName="animate-fade-in"
                    />
                  )}

                  <Input
                    label="Business Email Address"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                  />

                  <div>
                    <label className="block text-[10px] font-headline font-medium uppercase tracking-wider text-on-surface-variant mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full bg-surface-container-low neu-recessed rounded-xl pl-4 pr-11 py-3 text-sm font-sans font-normal text-on-surface placeholder-on-surface-variant/50 transition-all focus:outline-none focus-visible:shadow-[var(--shadow-recessed),0_0_0_2px_var(--c-primary)]"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
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

                  {isLogin && (
                    <div className="flex justify-between items-center py-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                        />
                        <span className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors">Remember me</span>
                      </label>
                      <a 
                        href="#" 
                        className="text-[11px] text-primary hover:underline" 
                        onClick={(e) => { e.preventDefault(); alert("Password recovery is simulated in this build."); }}
                      >
                        Forgot password?
                      </a>
                    </div>
                  )}

                  <Button type="submit" loading={loading} fullWidth className="mt-4 shadow-sm shadow-primary/20">
                    {isLogin ? 'Sign In' : 'Register Workspace'}
                  </Button>
                </form>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/60"></div>
                  </div>
                  <span className="relative bg-surface-container px-3 text-[10px] font-headline font-medium text-on-surface-variant uppercase tracking-wider">
                    OR
                  </span>
                </div>

                <GoogleAuthButton
                  role="RECRUITER"
                  onSuccess={(data) => {
                    setToken(data.token);
                    setUser(data.user);
                  }}
                  onError={(msg) => setError(msg)}
                />

                {/* Redirect Toggles */}
                <div className="border-t border-outline-variant pt-5 mt-6 text-center">
                  <button
                    type="button"
                    className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => handleModeToggle(!isLogin)}
                  >
                    {isLogin ? (
                      <span>New employer? <strong className="text-primary hover:underline font-bold">Register your company</strong></span>
                    ) : (
                      <span>Already registered? <strong className="text-primary hover:underline font-bold">Sign in</strong></span>
                    )}
                  </button>
                </div>
              </div>
            </AnimatedContent>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-6 text-center text-[10px] font-sans font-normal text-on-surface-variant/70 border-t border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 AlignGrad Employer Network</span>
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
