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
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import ClickSpark from '../../../components/ui/ClickSpark';
import DotGrid from '../../../components/ui/DotGrid';
import GoogleAuthButton from '../../../components/ui/GoogleAuthButton';
import { formatErrorMessage } from '../../../utils/errorFormatter';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { LANDING_URL, CANDIDATE_URL } from '../../../config';

export default function RecruiterAuth({ setToken, setUser, theme, toggleTheme, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.');
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
    const newPath = loginMode ? '/recruiter/login' : '/recruiter/signup';
    window.history.pushState({}, '', newPath);
  };

  const navigateToLanding = (e) => {
    e.preventDefault();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && LANDING_URL) {
      window.location.href = `${LANDING_URL}/`;
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const navigateToCandidate = (e) => {
    e.preventDefault();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && CANDIDATE_URL) {
      window.location.href = `${CANDIDATE_URL}/candidate/login`;
    } else {
      window.history.pushState({}, '', '/candidate/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-on-surface font-sans antialiased overflow-x-hidden relative selection:bg-primary/20 selection:text-primary flex flex-col justify-between">
      <ClickSpark
        sparkColor={theme === 'dark' ? '#0181a0' : '#003527'}
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        {error && formatErrorMessage(error, () => setError(''))}

        {/* Dynamic Background DotGrid */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.25]" style={{ minHeight: '100vh' }}>
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

        {/* Top Header */}
        <header className="relative z-10 w-full bg-surface-container-lowest/85 backdrop-blur-md border-b border-outline-variant">
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
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-headline"
              >
                Candidate Portal
              </button>
              <div className="h-4 w-[1px] bg-outline-variant"></div>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Main Split-Screen Container */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-5xl">
            <AnimatedContent distance={40} direction="vertical" delay={0.1}>
              <div className="rounded-3xl border border-outline-variant/80 bg-surface-container-lowest/90 backdrop-blur-md shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                
                {/* Left Side: Complete Recruiter Login Showcase Image */}
                <div className="lg:col-span-5 relative min-h-[380px] sm:min-h-[460px] lg:min-h-full border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 overflow-hidden group bg-surface-container">
                  <img
                    src="/recruiter_login_showcase.jpg"
                    alt="AlignGrade Recruiter Talent Suite & Verified Match Hub"
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-5 left-5 right-5 text-white pointer-events-none">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-primary text-xs font-bold shadow-md backdrop-blur-md mb-2">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Employer Talent Suite</span>
                    </div>
                    <p className="text-xs font-medium text-white/95 drop-shadow-sm leading-relaxed">
                      Hire pre-vetted engineers with verified benchmark scores and zero resume fluff.
                    </p>
                  </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between relative">
                  {/* Return button */}
                  <div className="flex justify-between items-center mb-6">
                    <button
                      type="button"
                      onClick={navigateToLanding}
                      className="p-2 text-slate-500 hover:text-heading hover:bg-surface-container rounded-full transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Home</span>
                    </button>
                    <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary-container">
                      Recruiter Workspace
                    </span>
                  </div>

                  <div>
                    <div className="mb-6">
                      <h1 className="font-headline text-2xl sm:text-3xl font-medium tracking-tight text-heading">
                        {isLogin ? 'Recruiter Sign In' : 'Register Company Workspace'}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {isLogin 
                          ? 'Sign in to access your talent dashboard, manage posts, and audit ratings.' 
                          : 'Set up your company workspace and hire certified technical students.'}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {!isLogin && (
                        <div>
                          <label className="block text-xs font-semibold text-heading mb-1.5">
                            Company / Organization Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={e => setName(e.target.value)}
                              placeholder="e.g. Aether Corp"
                              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-heading placeholder-slate-400 border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-heading mb-1.5">
                          Work Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="recruiter@company.com"
                            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-heading placeholder-slate-400 border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-heading mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-surface-container-low rounded-xl pl-4 pr-11 py-3 text-sm text-heading placeholder-slate-400 border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-heading transition-colors"
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
                            <span className="text-xs text-slate-600 dark:text-slate-300">Remember me</span>
                          </label>
                          <button 
                            type="button" 
                            className="text-xs text-primary hover:underline cursor-pointer bg-transparent border-none p-0 font-medium" 
                            onClick={() => setIsForgotPasswordOpen(true)}
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        loading={loading} 
                        fullWidth 
                        className="mt-2 py-3.5 font-semibold text-sm shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                      >
                        {isLogin ? 'Sign In to Workspace' : 'Create Company Workspace'}
                      </Button>
                    </form>

                    <div className="relative my-5 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-outline-variant"></div>
                      </div>
                      <span className="relative bg-surface-container-lowest px-3 text-xs font-semibold text-slate-400">
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
                  </div>

                  {/* Redirect Toggles */}
                  <div className="border-t border-outline-variant pt-5 mt-6 flex flex-col gap-2.5 text-center">
                    <button
                      type="button"
                      className="text-xs text-slate-600 dark:text-slate-300 hover:text-heading transition-colors cursor-pointer"
                      onClick={() => handleModeToggle(!isLogin)}
                    >
                      {isLogin ? (
                        <span>New employer? <strong className="text-primary hover:underline font-bold">Register your company</strong></span>
                      ) : (
                        <span>Already registered? <strong className="text-primary hover:underline font-bold">Sign in</strong></span>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={navigateToCandidate}
                      className="text-[11px] text-slate-500 hover:text-primary transition-colors cursor-pointer"
                    >
                      Looking for jobs or side hustles? Switch to <span className="underline font-semibold">Candidate Portal</span>
                    </button>
                  </div>
                </div>

              </div>
            </AnimatedContent>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-6 text-center text-xs text-slate-500 border-t border-outline-variant/60">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 AlignGrad Employer Network</span>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-heading transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-heading transition-colors">Terms of Service</a>
            </div>
          </div>
        </footer>

        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          initialEmail={email}
          role="RECRUITER"
          theme={theme}
        />
      </ClickSpark>
    </div>
  );
}
